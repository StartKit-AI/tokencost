import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";
import modelsData from "../data/model_prices_and_context_window.json" with { type: "json" };

const { lastUpdated, models } = modelsData;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function updateModels() {
  // if the list has been updated in the last hour, don't update it
  if (Date.now() - new Date(lastUpdated) < 360000) {
    console.log("[tokencost]: models are up to date");
    return models;
  }
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
    );
    const modelsJSON = await response.json();
    let genericModels = {};
    let imageModels = {};
    const models = Object.keys(modelsJSON).reduce((out, key) => {
      let name = key;
      if (name === "sample_spec") {
        return out;
      }
      const { litellm_provider, ...rest } = modelsJSON[name];
      let provider = litellm_provider;
      if (provider === "text-completion-openai") {
        provider = "openai";
      }

      if (rest.mode === "image_generation") {
        // add a generic model for the actual image model
        // without the size and quality
        const parts = name.split("/");
        const imageModelName = parts.pop();
        let size;
        let quality;
        for (let part of parts) {
          if (part.includes("-x-")) {
            size = part;
          } else {
            quality = part;
          }
        }
        if (!imageModels[imageModelName]) {
          imageModels[imageModelName] = {
            ...convertObjectKeysToCamel(rest),
            sizes: [],
            qualities: [],
            providers: [],
          };
        }
        if (size && !imageModels[imageModelName].sizes.includes(size)) {
          imageModels[imageModelName].sizes.push(size);
        }
        if (
          quality &&
          !imageModels[imageModelName].qualities.includes(quality)
        ) {
          imageModels[imageModelName].qualities.push(quality);
        }
        if (!imageModels[imageModelName].providers.includes(provider)) {
          imageModels[imageModelName].providers.push(provider);
        }
      } else if (name.includes("/")) {
        const parts = name.split("/");
        const genericModelName = parts.pop();
        const genericProvider = parts.join("/");
        if (!genericModels[genericModelName]) {
          genericModels[genericModelName] = {
            providers: [],
          };
        }
        if (
          !genericModels[genericModelName].providers.includes(genericProvider)
        ) {
          genericModels[genericModelName].providers.push(genericProvider);
        }
      }

      return {
        ...out,
        [name]: {
          ...convertObjectKeysToCamel(rest),
          provider,
        },
      };
    }, {});

    await fs.writeFile(
      path.join(
        __dirname,
        "..",
        "data",
        "model_prices_and_context_window.json"
      ),
      JSON.stringify(
        {
          lastUpdated: Date.now(),
          models,
          genericModels,
          imageModels,
        },
        null,
        2
      )
    );

    return models;
  } catch (err) {
    console.log("[tokencost]: failed to fetch new models");
    return null;
  }
}

function convertObjectKeysToCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeysToCamel);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelCaseKey = snakeToCamel(key);
      acc[camelCaseKey] = convertObjectKeysToCamel(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

function snakeToCamel(snakeCase) {
  return snakeCase.replace(/(_\w)/g, function (match) {
    return match[1].toUpperCase();
  });
}
