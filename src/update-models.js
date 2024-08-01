import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";
import modelsData from "../data/model_prices_and_context_window.json" assert { type: "json" };

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
    const models = Object.keys(modelsJSON).reduce((out, key) => {
      let name = key;
      const { litellm_provider, ...rest } = modelsJSON[name];
      let provider = litellm_provider;
      if (provider === "text-completion-openai") {
        provider = "openai";
      }

      return {
        ...out,
        [name]: { ...convertObjectKeysToCamel(rest), provider },
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
