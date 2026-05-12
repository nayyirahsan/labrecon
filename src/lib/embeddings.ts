import { CohereClient } from "cohere-ai";

if (!process.env.COHERE_API_KEY) {
  throw new Error("Missing required env var: COHERE_API_KEY");
}

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await cohere.embed({
    texts: [query],
    model: "embed-english-v3.0",
    inputType: "search_query",
  });
  const embeddings = response.embeddings as number[][];
  return embeddings[0];
}
