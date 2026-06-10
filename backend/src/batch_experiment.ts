import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { Ollama } from "@langchain/ollama";

// database configuration parameters
const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "rag_experiments",
  user: "research_user",
  password: "research_password_2026",
};

// initialize our target models with zero temperature for scientific control
const generatorModel = new Ollama({ model: "llama3", temperature: 0.0 });
const agentModel = new Ollama({ model: "gemma2:2b", temperature: 0.0 });

// definition structure for our experiment test cases
interface TestCase {
  id: number;
  queryText: string;
  targetCategory: string;
}

// dataset of explicit test scenarios across multiple domains
const evaluationDataset: TestCase[] = [
  {
    id: 1,
    queryText: "what is the specific percentage threshold required for corporate contingency reserves?",
    targetCategory: "finance",
  },
  {
    id: 2,
    queryText: "what timing windows and requirements dictate aes encryption keys and access logs?",
    targetCategory: "compliance",
  },
  {
    id: 3,
    queryText: "how are clean energy grid tracking provisions used to offset carbon levies?",
    targetCategory: "finance",
  },
  {
    id: 4,
    queryText: "what latency metric threshold requires manual logging by cross border compliance supervisors?",
    targetCategory: "compliance",
  }
];

// helper function to extract database vectors based on categories
async function getCategoryEmbedding(category: string): Promise<number[]> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  const result = await client.query(
    "SELECT embedding FROM document_chunks WHERE category = $1 LIMIT 1",
    [category]
  );
  await client.end();
  const vectorString = result.rows[0].embedding;
  return vectorString.replace(/[\[\]]/g, "").split(",").map(Number);
}

// processing execution for metadata pipeline
async function executeMetadataPipeline(queryText: string, category: string): Promise<{ duration: number; answer: string }> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  
  const queryEmbedding = await getCategoryEmbedding(category);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  const dbResult = await client.query(
    `SELECT content FROM document_chunks 
     WHERE category = $1 
     ORDER BY embedding <=> $2::vector 
     LIMIT 1;`,
    [category, vectorString]
  );
  await client.end();

  const context = dbResult.rows[0]?.content || "";
  const finalPrompt = `context:\n${context}\n\nquery: ${queryText}\n\nanswer precisely based only on the provided context:`;
  
  const startTime = Date.now();
  const answer = await generatorModel.invoke(finalPrompt);
  const duration = Date.now() - startTime;

  return { duration, answer: answer.replace(/\n/g, " ").trim() };
}

// processing execution for agentic pipeline
async function executeAgenticPipeline(queryText: string): Promise<{ duration: number; answer: string }> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  const dbResult = await client.query("SELECT content FROM document_chunks LIMIT 3;");
  await client.end();

  const rawMergedContext = dbResult.rows.map(row => row.content).join("\n\n");
  const agentPrompt = `you are a research context compressor. remove all irrelevant sentences from this text. keep only facts related to "${queryText}". do not add commentary.\n\nraw text:\n${rawMergedContext}\n\ncompressed text:`;
  
  const agentStartTime = Date.now();
  const compressedContext = await agentModel.invoke(agentPrompt);
  const agentDuration = Date.now() - agentStartTime;

  const finalPrompt = `context:\n${compressedContext}\n\nquery: ${queryText}\n\nanswer precisely based only on the provided context:`;
  
  const generatorStartTime = Date.now();
  const answer = await generatorModel.invoke(finalPrompt);
  const totalDuration = (Date.now() - generatorStartTime) + agentDuration;

  return { duration: totalDuration, answer: answer.replace(/\n/g, " ").trim() };
}

// main execution loop to iterate through dataset scenarios
async function runBatch() {
  console.log(`starting batch execution over ${evaluationDataset.length} test scenarios...`);
  
  // define csv headers and output path
  const csvPath = path.join(process.cwd(), "metrics_log.csv");
  const csvHeaders = "test_case_id,pipeline_type,category,latency_ms,generated_answer\n";
  fs.writeFileSync(csvPath, csvHeaders);

  for (const scenario of evaluationDataset) {
    console.log(`\nprocessing test case ${scenario.id}: [${scenario.targetCategory}]`);
    
    // execute metadata pipeline pass
    console.log("-> running metadata strategy...");
    const metaData = await executeMetadataPipeline(scenario.queryText, scenario.targetCategory);
    const metaRow = `${scenario.id},metadata,${scenario.targetCategory},${metaData.duration},"${metaData.answer}"\n`;
    fs.appendFileSync(csvPath, metaRow);
    
    // execute agentic pipeline pass
    console.log("-> running agentic strategy...");
    const agentData = await executeAgenticPipeline(scenario.queryText);
    const agentRow = `${scenario.id},agentic,${scenario.targetCategory},${agentData.duration},"${agentData.answer}"\n`;
    fs.appendFileSync(csvPath, agentRow);
  }
  
  console.log(`\nbatch execution complete. metrics safely logged to: ${csvPath}`);
}

runBatch().catch(console.error);