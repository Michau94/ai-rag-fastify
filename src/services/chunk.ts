// services/chunk.ts

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function splitIntoSentences(text: string) {
  return text.split(/(?<=[.!?])\s+/);
}

export function smartChunk(text: string, maxLength = 500, overlapSize = 100) {
  const cleaned = cleanText(text);
  const sentences = splitIntoSentences(cleaned);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current) chunks.push(current.trim());

  // 🔥 overlap
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;

    const prev = chunks[i - 1];
    const overlap = prev.slice(-overlapSize);

    return overlap + " " + chunk;
  });
}
