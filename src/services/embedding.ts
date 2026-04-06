// services/embedding.ts

export async function createEmbedding(fastify: any, text: string) {
  const res = await fastify.openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return res.data[0].embedding;
}
