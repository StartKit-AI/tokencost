import {
  getTokenSizeFromPrompt,
  getTokenSizeFromString,
  getTokensFromRawImages,
} from "./tokenizer.js";

import modelsData from "../data/model_prices_and_context_window.json" assert { type: "json" };
import { updateModels } from "./update-models.js";

const modes = [
  "chat",
  "completion",
  "embedding",
  "moderations",
  "image_generation",
  "audio_transcription",
  "audio_speech",
];

export let models = modelsData.models;

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
  return modes;
}

export function addCustomModels(customModels = {}) {
  const custom = Object.entries(customModels).reduce((out, [key, value]) => {
    return { ...out, [key]: { ...value, isCustom: true } };
  }, {});
  models = { ...models, ...custom };
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
    outputTokens: modelData.maxTokens,
    inputTokens: modelData.maxInputTokens,
  };
}

export function getInputCostPerToken(model) {
  return models[model].inputCostPerToken;
}
export function getOutputCostPerToken(model) {
  return models[model].inputCostPerToken;
}

function calculateStringPromptCost(str, model) {
  let costPerToken = models[model].inputCostPerToken;
  const tokenSize = getTokenSizeFromString(str);
  return tokenSize * costPerToken;
}

function calculateStringGenerationCost(str, model) {
  let costPerToken = models[model].maxOutputTokens;
  const tokenSize = getTokenSizeFromString(str);
  return tokenSize * costPerToken;
}

function calculateChatPromptCost(prompt, model, { images = [] }) {
  if (typeof prompt === "string") {
    return calculateStringPromptCost(prompt, model);
  }
  let costPerToken = models[model].inputCostPerToken;
  const tokenSize = getTokenSizeFromPrompt(prompt, { images });
  if (images.length) {
    tokenSize += getTokensFromRawImages(images);
  }
  return tokenSize * costPerToken;
}

export function calculateImageDetectionCost(image, model) {
  const tokenSize = getTokensFromRawImages([image]);
  const costPerToken = models[model].inputCostPerToken;
  return tokenSize * costPerToken;
}

export function calculateImageGenerationCost({ size, quality }, model) {
  const modelData = getImageModel(model, quality, size);
  const costPerPixel = modelData.inputCostPerPixel;
  const [width, height] = size.split("x");
  return costPerPixel * width * height;
}

export async function update() {
  const updatedModels = await updateModels();
  if (updatedModels) {
    models = updatedModels;
  }
  return models;
}

export function getImageModel(model, quality, size) {
  let modelData = models[getImageModelName(model, quality, size)];
  return modelData;
}

export function getImageModelName(model, quality, size) {
  let sizeKey = size;
  if (!size.includes("-x-")) {
    sizeKey = size.replace("x", "-x-");
  }
  if (quality) {
    sizeKey = `${quality}/${sizeKey}`;
  }
  return `${sizeKey}/${model}`;
}

function parseImageModelKey(modelData) {
  return {
    quality: 0,
    size: 0,
  };
}

function calculateSpeechToTextModelCost({ duration }, model) {
  const costPerSecond = models[model].outputCostPerSecond;
  return costPerSecond * duration;
}
