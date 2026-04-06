import fp from "fastify-plugin";
import OpenAI from "openai";

export default fp(async (fastify: any) => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  fastify.decorate("openai", client);
});
