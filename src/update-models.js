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
    const { litellm_provider, ...rest } = modelsJSON[key];

    return {
      ...out,
      [key]: { ...rest, provider: litellm_provider },
    };
  }, {});

  await fs.writeFile(
    path.join(__dirname, "..", "data", "model_prices_and_context_window.json"),
    JSON.stringify(models, null, 2)
  );
  return models;
}
