import { parseFile } from "../services/ingest";
import { storeDocument } from "../services/store";

export default async function (fastify: any) {
  fastify.post("/upload", async (request: any) => {
    let mimetype: string;
    let buffer: Buffer;

    if (request.isMultipart()) {
      const file = await request.file();
      if (!file) {
        throw new Error("No file uploaded");
      }

      mimetype = file.mimetype;
      buffer = await file.toBuffer();
    } else {
      mimetype = (request.headers["content-type"] || "")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (Buffer.isBuffer(request.body)) {
        buffer = request.body;
      } else if (typeof request.body === "string") {
        buffer = Buffer.from(request.body, "utf-8");
      } else {
        throw new Error("Unsupported request body");
      }
    }

    const text = await parseFile(buffer, mimetype);

    await storeDocument(fastify, text);

    return { status: "ok" };
  });
}
