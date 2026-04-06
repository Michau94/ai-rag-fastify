import Fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({ logger: true });

// server.ts

app.register(import("./plugins/supabase"));
app.register(import("@fastify/multipart"));
app.addContentTypeParser(
  "application/pdf",
  { parseAs: "buffer" },
  (_request, body, done) => {
    done(null, body);
  }
);
app.addContentTypeParser(
  "text/plain",
  { parseAs: "string" },
  (_request, body, done) => {
    done(null, body);
  }
);
app.register(import("./routes/upload"));

app.register(require("./plugins/openai"));
app.register(require("./plugins/rag"));
app.register(require("./routes/chat"));

app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});
