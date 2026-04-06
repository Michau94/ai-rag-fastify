// services/rag.ts

import { createEmbedding } from "./embedding";

export async function ask(fastify: any, question: string) {
  // 1. embedding domanda
  const embedding = await createEmbedding(fastify, question);

  // 2. similarity search
  const { data } = await fastify.supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 3,
  });

  const context = data?.map((d: any) => d.content).join("\n");

  // 3. prompt
  const prompt = `
Rispondi SOLO usando queste informazioni:
${context}

Domanda: ${question}
`;

  // 4. LLM
  const response = await fastify.openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}
