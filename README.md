# TokenCost for Nodejs

TokenCost helps calculate the USD cost of using major Large Language Model (LLMs) APIs by calculating the estimated cost of prompts and completions.

API forked from [TokenCost for Python](https://github.com/AgentOps-AI/tokencost) with code adapted for Node.js apps. Originally written for [StartKit](https://startkit.ai).

### Changes

- Added support for calculating cost of sending Images with Chat Prompts
- Added support for calculating cost of Image generations
- Added Whisper support

Prices are forked from from [LiteLLM's cost dictionary](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json).
