const OpenAI = require('openai');
require('dotenv').config();

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.NEMOTRON_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [{"content":"Reply with the word SUCCESS","role":"user"}],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      reasoning_budget: 16384,
      chat_template_kwargs: {"enable_thinking":true},
      stream: true
    });
     
    for await (const chunk of completion) {
      const reasoning = chunk.choices[0]?.delta?.reasoning_content;
      if (reasoning) process.stdout.write('[R] ' + reasoning);
      const content = chunk.choices[0]?.delta?.content;
      if (content) process.stdout.write('[C] ' + content);
    }
    console.log('\nStream completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
