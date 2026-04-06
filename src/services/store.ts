import { smartChunk } from "./chunk";
import { createEmbedding } from "./embedding";

export async function storeDocument(fastify: any, text: string) {
  // 1️⃣ chunk
  const chunks = smartChunk(text).slice(0, 20);

  console.log("Total chunks:", chunks.length);

  // 2️⃣ embedding + prepare insert
  const records = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await createEmbedding(fastify, chunk);

      return {
        content: chunk,
        embedding: `[${embedding.join(",")}]`,
      };
    }),
  );

  // 3️⃣ insert batch
  const { data, error } = await fastify.supabase
    .from("documents")
    .insert(records);

  if (error) {
    console.error("Insert error:", error);
    throw error;
  }

  return data;
}
