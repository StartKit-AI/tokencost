import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function updatePrices() {
  const response = await fetch(
    "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
  );
  const pricesJson = await response.json();
  const prices = Object.keys(pricesJson).reduce((out, key) => {
    const { litellm_provider, ...rest } = pricesJson[key];

    return {
      ...out,
      [key]: { ...rest, provider: litellm_provider },
    };
  }, {});

  await fs.writeFile(
    path.join(__dirname, "..", "data", "model_prices_and_context_window.json"),
    JSON.stringify(prices, null, 2)
  );
}
