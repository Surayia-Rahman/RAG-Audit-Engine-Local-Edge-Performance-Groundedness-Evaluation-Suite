import pg from "pg";
import { Ollama } from "@langchain/ollama";

// database connection settings matching our docker cluster setup
const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "rag_experiments",
  user: "research_user",
  password: "research_password_2026",
};

// initialize our main generation model (llama3)
const generatorModel = new Ollama({
  model: "llama3",
  temperature: 0.0, // setting to zero forces deterministic results for science
});

// initialize our agentic compression model (gemma2:2b)
const agentModel = new Ollama({
  model: "gemma2:2b",
  temperature: 0.0,
});

// helper function to simulate generating a 768 dimension text embedding
// since we seeded using nomic-embed-text, we will look up a category vector manually
async function getMockQueryEmbedding(category: string): Promise<number[]> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  
  // pull the vector embedding of a document in our target category to use as a query stand-in
  const result = await client.query(
    "SELECT embedding FROM document_chunks WHERE category = $1 LIMIT 1",
    [category]
  );
  
  await client.end();
  
  // parse the vector string from postgres back into a clean float array
  const vectorString = result.rows[0].embedding;
  return vectorString.replace(/[\[\]]/g, "").split(",").map(Number);
}

// experimental group 1: metadata-driven context compaction
// utilizes traditional relational sql queries to limit the document boundaries before reading
export async function runMetadataPipeline(queryText: string, targetCategory: string) {
  const client = new pg.Client(dbConfig);
  await client.connect();
  
  const queryEmbedding = await getMockQueryEmbedding(targetCategory);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  // look up rows using strict metadata boundaries (category match) AND vector distance
  const dbResult = await client.query(
    `SELECT content FROM document_chunks 
     WHERE category = $1 
     ORDER BY embedding <=> $2::vector 
     LIMIT 1;`,
    [targetCategory, vectorString]
  );
  
  await client.end();
  
  const context = dbResult.rows[0]?.content || "no context found.";
  
  // craft our standard generator prompt
  const finalPrompt = `context:\n${context}\n\nquery: ${queryText}\n\nanswer precisely based only on the provided context:`;
  
  const startTime = Date.now();
  const response = await generatorModel.invoke(finalPrompt);
  const duration = Date.now() - startTime;
  
  return { response, duration, contextUsed: context };
}

// experimental group 2: agentic-driven context compaction
// pulls all relevant documents and uses a tiny, fast model to extract only key facts before generating
export async function runAgenticPipeline(queryText: string, targetCategory: string) {
  const client = new pg.Client(dbConfig);
  await client.connect();
  
  // look up documents without any metadata filters (naive retrieval simulation)
  const dbResult = await client.query(
    "SELECT content FROM document_chunks LIMIT 3;"
  );
  
  await client.end();
  
  // merge all raw chunks together into a dense wall of text
  const rawMergedContext = dbResult.rows.map(row => row.content).join("\n\n");
  
  // instruct our small editor agent to prune and clean the text walls
  const agentPrompt = `you are a research context compressor. remove all irrelevant sentences from this text. keep only facts related to "${queryText}". do not add commentary.\n\nraw text:\n${rawMergedContext}\n\ncompressed text:`;
  
  // run the agentic compaction step
  const agentStartTime = Date.now();
  const compressedContext = await agentModel.invoke(agentPrompt);
  const agentDuration = Date.now() - agentStartTime;
  
  // craft our standard generator prompt using the compressed text
  const finalPrompt = `context:\n${compressedContext}\n\nquery: ${queryText}\n\nanswer precisely based only on the provided context:`;
  
  const generatorStartTime = Date.now();
  const response = await generatorModel.invoke(finalPrompt);
  const totalDuration = (Date.now() - generatorStartTime) + agentDuration;
  
  return { response, duration: totalDuration, contextUsed: compressedContext };
}

// execution controller to execute our experiment loop
async function runExperiment() {
  const targetQuery = "what are the operational baselines and timing metrics for financial resource allocations?";
  const targetCategory = "finance";
  
  console.log("starting experiment pipeline tests...\n");
  
  console.log("running metadata-driven pipeline...");
  const metadataResult = await runMetadataPipeline(targetQuery, targetCategory);
  console.log(`completed in ${metadataResult.duration}ms`);
  console.log(`context fed to model:\n"${metadataResult.contextUsed}"`);
  console.log(`answer:\n${metadataResult.response}\n`);
  
  console.log("-----------------------------------------");
  
  console.log("running agentic-driven pipeline...");
  const agenticResult = await runAgenticPipeline(targetQuery, targetCategory);
  console.log(`completed in ${agenticResult.duration}ms (includes agent extraction step)`);
  console.log(`context fed to model:\n"${agenticResult.contextUsed}"`);
  console.log(`answer:\n${agenticResult.response}\n`);

  
}

// runExperiment().catch(console.error);