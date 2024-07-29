import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function updateModels() {
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
    path.join(__dirname, "..", "data", "model_prices_and_context_window.json"),
    JSON.stringify(models, null, 2)
  );
  return models;
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
