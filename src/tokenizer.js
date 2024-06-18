import {
  decode,
  decodeAsyncGenerator,
  decodeGenerator,
  encode,
  encodeChat,
  encodeGenerator,
  isWithinTokenLimit,
} from "gpt-tokenizer";

/**
 * Calculates the total size in tokens for an array of prompts,
 * such as the prompt used when querying the OpenAI chat endpoint.
 *
 * Useful when you're building a complex prompt and what to know
 * what to set the max_tokens value to on the response
 *
 * @param {Object[{ type, content }]} prompts - Array of prompt objects.
 * @returns {number} Total token size of the prompts.
 *
 * @example
 * const tokenSize = getTokenSize([
 *   {
 *    type: 'system',
 *    content: 'You are an AI Chat bot'
 *   }, {
 *    type: 'user',
 *    content: 'Hey there, tell me a bedtime story'
 *   }
 * ]);
 */
export function getTokenSizeFromPrompt(prompts) {
  let textTokenSize = prompts.reduce((out, p) => {
    if (Array.isArray(p.content)) {
      const tokenSize = p.content.reduce(
        (o, c) => (o += c.type === "text" ? getTokenSizeFromString(c.text) : 0),
        0
      );
      return out + tokenSize;
    }

    return out + getTokenSizeFromString(p.content ?? "");
  }, 0);

  return textTokenSize;
}

/**
 * Calculates the token size of a given string.
 *
 * @param {string} str - The string to calculate token size for.
 * @returns {number} The token size of the string.
 *
 * @example
 * // Calculate token size for a string
 * const size = getTokenSizeFromString('Hello world');
 */
export function getTokenSizeFromString(str) {
  return encode(str).length;
}

/**
 * A chat can be prompted with one or more images (vision)
 * This will calculate the number of tokens in those images
 */
export function getTokensFromRawImages(images) {
  return images.reduce((out, { base64 }) => {
    const buffer = Buffer.from(base64, "base64");
    const uintArray = new Uint8Array(buffer);
    const { width, height } = sizeOf(uintArray);
    return out + getTokensFromImage({ width, height });
  }, vision.baseTokens);
}

export function getTokensFromImage({ width, height }) {
  const vision = {
    tileSize: 512,
    baseTokens: 85,
    tokensPerTile: 170,
  };
  const tiles =
    Math.ceil(width / vision.tileSize) + Math.ceil(height / vision.tileSize);
  return vision.tokensPerTile * tiles;
}
