export default async function (fastify: any) {
  fastify.post("/chat", async (request: any, reply: any) => {
    const { question } = request.body;

    const answer = await fastify.rag.ask(question);

    return { answer };
  });
}
