import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.ARK_API_KEY,

  baseURL:'https://ark.cn-beijing.volces.com/api/v3'

});

const response = await client.chat.completions.create({
    model: "doubao-seed-1-6-flash-250715",
    messages:[{
      role:"system",
      content:"你是一个专业的科普作家，擅长创作科普文章。用户提供一个词，你会对此生成一个科普文章。字数在200-250之间。语气专业，专业的。"
      },
      {
        role:"user",
        content:"万历皇帝"
      }
    ],
    temperature:0.7,
    top_p:0.7,
    max_tokens:1024,
});

console.log(response.choices[0].message.content);  
