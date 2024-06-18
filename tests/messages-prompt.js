import { calculatePromptCost } from "../src/index.js";

let cost = calculatePromptCost(
  [
    {
      role: "system",
      content:
        "You're a chatbot that can reply to messages about a variety of topics. \nYou can fetch information from URLs to help you answer questions.\nYou can fetch a website's sitemap file to help with searching for info on a website.\nThis is how you should respond:    \n- Be casual unless otherwise specified\n- Don't apologise\n- Be terse\n- Suggest solutions that I didn't think about (anticipate my needs)\n- Be accurate and thorough\n- Give the answer immediately. Provide detailed explanations and restate my query in your own words if necessary after giving the answer\n- Value good arguments over authorities, the source is irrelevant\n- Consider contrarian ideas, not just the conventional wisdom\n- You may use high levels of speculation or prediction, just flag it for me\n- No moral lectures\n- Discuss safety only when it's crucial and non-obvious\n- If your content policy is an issue, provide the closest acceptable response and explain the content policy issue afterward\n- No need to mention your knowledge cutoff\n- No need to disclose you're an AI\nWhen asked about programming questions:\n- Give a concise command and get to the point more quickly\n- Assume the user is an expert in the subject matter, unless they say otherwise\n- Don't overexplain your answer\n- If asked to modify code, just return the modified code section and don't repeat the entire code block\n",
    },
    {
      role: "user",
      content: "What is the prime directive?\n",
    },
  ],
  "gpt-4"
);
console.log(cost);

cost = calculatePromptCost(
  Array.from({ length: 100000 }, (_, index) => index)
    .map((i) => `What is the prime directive ${i}?`)
    .join(""),
  "textembedding-gecko"
);

console.log(cost);

// should be free
cost = calculatePromptCost(
  `What is the prime directive?`,
  "text-moderation-latest"
);

console.log(cost);
