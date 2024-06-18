import {
  getTokenSizeFromPrompt,
  getTokenSizeFromString,
  getTokensFromRawImages,
} from "./tokenizer.js";

import models from "../data/model_prices_and_context_window.json" assert { type: "json" };

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
      return calculateSpeechToTextModel(prompt, model);
  }
}

export function calculateCompletionCost(completion, model, opts = {}) {
  const modelData = models[model];
  if (!modelData) {
    throw new Error(`Model ${model} not found in model list`);
  }
  switch (modelData.mode) {
    case "chat":
    case "completion":
    case "embedding":
    case "moderations":
      return calculateStringPromptCost(completion, model);
    case "image_generation":
      return calculateImageGenerationCost(completion, model);
    case "audio_transcription":
      return calculateSpeechToTextModel(completion, model);
  }
}

export function countMessageTokens(prompt) {
  return getTokenSizeFromPrompt(prompt);
}

export function countStringTokens(str) {
  return getTokenSizeFromString(str);
}

export function getModel(model) {
  return models[model] ?? null;
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

function calculateStringPromptCost(str, model) {
  let costPerToken = models[model].input_cost_per_token;
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
  let sizeKey = size.replace("x", "-x-");
  if (quality === "hd") {
    sizeKey = `hd/${sizeKey}`;
  }
  let modelData = models[`${sizeKey}/${model}`];

  const costPerPixel = modelData.input_cost_per_pixel;
  const [width, height] = size.split("x");
  return costPerPixel * width * height;
}

function calculateSpeechToTextModel({ duration }, model) {
  const costPerSecond = models[model].output_cost_per_second;
  return costPerSecond * duration;
}
