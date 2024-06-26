# TokenCost for Nodejs

TokenCost helps calculate the USD cost of using major Large Language Model (LLMs) APIs by calculating the estimated cost of prompts and completions.

API forked from [TokenCost for Python](https://github.com/AgentOps-AI/tokencost) with code adapted for Nodejs apps. Originally written for [StartKit](https://startkit.ai).

### Improvements

We've added some improvements over the python version:

- Added support for calculating cost of sending Images with Chat Prompts
- Added Image generation support
- Added Audio/Whisper support

### LLM Costs

Prices are forked from from [LiteLLM's cost dictionary](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json).

# Installation

```bash
npm i tokencost
```

# Usage

You can calculate the cost of prompts and completions from OpenAI requests:

```js
import { calculatePromptCost, calculateCompletionCost } from "tokencost";

const messages = [
  { role: "system", content: "You are a helpful assistant." },
  {
    role: "user",
    content: "What is the prime directive?\n",
  },
];
const promptCost = calculatePromptCost(messages, "gpt-4o");

const completion = await openai.chat.completions.create({
  messages,
  model: "gpt-4o",
});

const { content } = completion.choices[0].message;
const completionCost = calculateCompletionCost(content, "gpt-4o");

console.log(`Total cost:`, promptCost + completionCost);
```

Note: If you're including images as part of a chat completion then they will also be included in the cost calculation!

## Images

You can also calculate the cost of generating images:

```js
import { calculateImageGenerationCost } from "tokencost";

const imageOptions = { size: "1024x1024", quality: "standard" };
const cost = calculateImageGenerationCost(imageOptions, "dall-e-3");
```

And of identifying images with Vision:

```js
import { calculateImageDetectionCost } from "tokencost";

const image = readFileSync("image.jpg");
const cost = calculateImageDetectionCost(image, "gpt-4o");
```

## Audio

```js
const openai = new OpenAI({ apiKey });

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("audio.mp3"),
  model: "whisper-1",
});

const { duration } = transcription;
const cost = calculateCompletionCost({ duration }, "whisper-1");
```

# Contributing

Contributions to TokenCost are welcome! Feel free to create an issue for any bug reports, complaints, or feature suggestions.

# License

TokenCost is released under the MIT License.
