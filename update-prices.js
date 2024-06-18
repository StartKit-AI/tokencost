import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const response = await fetch(
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
);
const pricesJson = await response.json();
const modes = new Set();
const prices = Object.keys(pricesJson).reduce((out, key) => {
  const { litellm_provider, ...rest } = pricesJson[key];
  modes.add(rest.mode);
  return {
    ...out,
    [key]: { ...rest, provider: litellm_provider },
  };
}, {});
await fs.writeFile(
  path.join(__dirname, "data", "model_prices_and_context_window.json"),
  JSON.stringify(prices, null, 2)
);

console.log([...modes]);

console.log("done");
