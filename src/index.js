import {
  getTokenSizeFromPrompt,
  getTokenSizeFromString,
  getTokensFromRawImages,
} from "./tokenizer.js";

import modelsList from "../data/model_prices_and_context_window.json" assert { type: "json" };
import { updateModels } from "./update-models.js";

export let models = modelsList;

export function calculatePromptCost(prompt, model, opts = {}) {
  const modelData = models[model];
  if (!modelData) {
    throw new Error(`Model ${model} not found in model list`);
  }

  switch (modelData.mode) {
    case "chat":
    case "completion":
      return calculateChatPromptCost(prompt, model, opts);
    case "embedding":
    case "moderations":
      return calculateStringPromptCost(prompt, model);
    case "audio_transcription":
      return calculateSpeechToTextModelCost(prompt, model);
  }
}

export function calculateCompletionCost(completion, model, opts = {}) {
  const modelData = getModel(model, opts);
  if (!modelData) {
    throw new Error(`Model ${model} not found in model list`);
  }
  switch (modelData.mode) {
    case "chat":
    case "completion":
    case "embedding":
    case "moderations":
      return calculateStringGenerationCost(completion, model);
    case "image_generation":
      return calculateImageGenerationCost(completion, model);
    case "audio_transcription":
      return calculateSpeechToTextModelCost(completion, model);
  }
}

export function countMessageTokens(prompt) {
  return getTokenSizeFromPrompt(prompt);
}

export function countStringTokens(str) {
  return getTokenSizeFromString(str);
}

export function getModel(model, opts = {}) {
  if (opts.quality) {
    return getImageModel(model, opts.quality, opts.size);
  }
  return models[model] ?? null;
}

export function getModelMode(model, opts) {
  return getModel(model, opts)?.mode ?? null;
}

export function getAllModes() {
  return [...new Set(Object.values(models).map((model) => model.mode))].filter(
    Boolean
  );
}

export function getModelProvider(model) {
  return getModel(model)?.provider ?? null;
}

export function getModels(mode, providers = []) {
  return Object.keys(models)
    .filter((model) => {
      let match = true;
      if (mode && models[model].mode !== mode) {
        match = false;
      }
      if (providers.length && !providers.includes(models[model].provider)) {
        match = false;
      }
      return match;
    })
    .map((key) => ({ ...models[key], name: key }));
}

export function getEmbeddingsDimension(model) {
  return models[model].output_vector_size;
}

export function getMaxTokens(model) {
  const modelData = models[model];
  if (!modelData) {
    throw new Error(`Model ${model} not found in model list`);
  }
  return {
    outputTokens: modelData.max_tokens,
    inputTokens: modelData.max_input_tokens,
  };
}

export function getInputCostPerToken(model) {
  return models[model].input_cost_per_token;
}
export function getOutputCostPerToken(model) {
  return models[model].input_cost_per_token;
}

function calculateStringPromptCost(str, model) {
  let costPerToken = models[model].input_cost_per_token;
  const tokenSize = getTokenSizeFromString(str);
  return tokenSize * costPerToken;
}

function calculateStringGenerationCost(str, model) {
  let costPerToken = models[model].output_cost_per_token;
  const tokenSize = getTokenSizeFromString(str);
  return tokenSize * costPerToken;
}

function calculateChatPromptCost(prompt, model, { images = [] }) {
  if (typeof prompt === "string") {
    return calculateStringPromptCost(prompt, model);
  }
  let costPerToken = models[model].input_cost_per_token;
  const tokenSize = getTokenSizeFromPrompt(prompt, { images });
  if (images.length) {
    tokenSize += getTokensFromRawImages(images);
  }
  return tokenSize * costPerToken;
}

export function calculateImageDetectionCost(image, model) {
  const tokenSize = getTokensFromRawImages([image]);
  const costPerToken = models[model].input_cost_per_token;
  return tokenSize * costPerToken;
}

export function calculateImageGenerationCost({ size, quality }, model) {
  const modelData = getImageModel(model, quality, size);
  const costPerPixel = modelData.input_cost_per_pixel;
  const [width, height] = size.split("x");
  return costPerPixel * width * height;
}

export async function update() {
  models = await updateModels();
  return models;
}

export function getImageModel(model, quality, size) {
  let sizeKey = size;
  if (!size.includes("-x-")) {
    sizeKey = size.replace("x", "-x-");
  }
  if (quality === "hd") {
    sizeKey = `hd/${sizeKey}`;
  }
  let modelData = models[`${sizeKey}/${model}`];
  return modelData;
}

function calculateSpeechToTextModelCost({ duration }, model) {
  const costPerSecond = models[model].output_cost_per_second;
  return costPerSecond * duration;
}
