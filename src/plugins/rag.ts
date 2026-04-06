import fp from "fastify-plugin";
import { ask } from "../services/rag";
import { storeDocument } from "../services/store";

export default fp(async (fastify: any) => {
  fastify.decorate("rag", {
    ask: (question: string) => ask(fastify, question),
    store: (text: string) => storeDocument(fastify, text),
  });
});
