import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { Ollama } from "@langchain/ollama";

// database configuration parameters matching our local cluster setup
const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "rag_experiments",
  user: "research_user",
  password: "research_password_2026",
};

// initialize target models with zero temperature for scientific control
const generatorModel = new Ollama({ model: "llama3", temperature: 0.0 });
const agentModel = new Ollama({ model: "gemma2:2b", temperature: 0.0 });

interface RealWorldTestCase {
  id: number;
  queryText: string;
  targetCategory: string;
}

// dataset of explicit e-commerce consumer evaluation scenarios
// expanded dataset of explicit e-commerce consumer evaluation scenarios (N=15)
const realWorldDataset: RealWorldTestCase[] = [
  {
    id: 1,
    queryText: "what do users complain about regarding setup, performance, or installation issues?",
    targetCategory: "appliances",
  },
  {
    id: 2,
    queryText: "what specific features make this choice highly recommended for long term value?",
    targetCategory: "appliances",
  },
  {
    id: 3,
    queryText: "are there any specific safety warnings, defect reports, or breakdown structural anomalies?",
    targetCategory: "appliances",
  },
  {
    id: 4,
    queryText: "what is the general user sentiment regarding the delivery packaging and quality control?",
    targetCategory: "appliances",
  },
  {
    id: 5,
    queryText: "how does the product handle continuous daily usage over an extended period of time?",
    targetCategory: "appliances",
  },
  {
    id: 6,
    queryText: "are there mentions of unexpected operational noise, vibrations, or loud sounds?",
    targetCategory: "appliances",
  },
  {
    id: 7,
    queryText: "does the item require specialized cleaning tools or high maintenance overhead?",
    targetCategory: "appliances",
  },
  {
    id: 8,
    queryText: "what do users say about the user interface, buttons, or physical design layout?",
    targetCategory: "appliances",
  },
  {
    id: 9,
    queryText: "is the build material described as premium durable metal or fragile plastic components?",
    targetCategory: "appliances",
  },
  {
    id: 10,
    queryText: "do consumers feel that the actual product match the promotional advertising descriptions?",
    targetCategory: "appliances",
  },
  {
    id: 11,
    queryText: "are there complaints regarding electrical power usage, cords, or short-circuiting?",
    targetCategory: "appliances",
  },
  {
    id: 12,
    queryText: "what alternative brands do users compare this item to when evaluating performance?",
    targetCategory: "appliances",
  },
  {
    id: 13,
    queryText: "does the user manual provide clear step-by-step instructions for troubleshooting errors?",
    targetCategory: "appliances",
  },
  {
    id: 14,
    queryText: "are there any hidden maintenance costs or accessories required that were not included?",
    targetCategory: "appliances",
  },
  {
    id: 15,
    queryText: "what is the consensus on customer support responsiveness for resolving broken parts?",
    targetCategory: "appliances",
  }
];

// helper function to programmatically escape commas and quotes for standard csv safety
function formatCSVField(text: string): string {
  // replace single double-quotes with escaped double-double quotes, flatten newlines, and trim whitespace
  const cleanText = text.replace(/"/g, '""').replace(/\n/g, ' ').trim();
  return `"${cleanText}"`;
}

async function getCategoryEmbedding(category: string): Promise<number[]> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  // fetch a representative vector from our real table partition to anchor the vector search math
  const result = await client.query(
    "SELECT embedding FROM document_chunks WHERE category = $1 LIMIT 1",
    [category]
  );
  await client.end();
  const vectorString = result.rows[0].embedding;
  return vectorString.replace(/[\[\]]/g, "").split(",").map(Number);
}

async function executeMetadataPipeline(queryText: string, category: string): Promise<{ duration: number; answer: string }> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  
  const queryEmbedding = await getCategoryEmbedding(category);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  // look up relevant matches directly within our real world database index
  const dbResult = await client.query(
    `SELECT content FROM document_chunks 
     ORDER BY embedding <=> $1::vector 
     LIMIT 1;`,
    [vectorString]
  );
  await client.end();

  const context = dbResult.rows[0]?.content || "";
  const finalPrompt = `context:\n${context}\n\nquery: ${queryText}\n\nanswer precisely based only on the provided context:`;
  
  const startTime = Date.now();
  const answer = await generatorModel.invoke(finalPrompt);
  const duration = Date.now() - startTime;

  return { duration, answer };
}

async function executeAgenticPipeline(queryText: string): Promise<{ duration: number; answer: string }> {
  const client = new pg.Client(dbConfig);
  await client.connect();
  // pull a cross-section of live rows from the real-world dataset matrix
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

  return { duration: totalDuration, answer };
}

async function runRealWorldExperiment() {
  console.log(`starting real-world batch execution over ${realWorldDataset.length} consumer scenarios...`);
  
  // output target shifted to a distinct real-world metrics file to preserve pilot study data
  const csvPath = path.join(process.cwd(), "real_world_metrics.csv");
  const csvHeaders = "test_case_id,pipeline_type,category,latency_ms,generated_answer\n";
  fs.writeFileSync(csvPath, csvHeaders);

  for (const scenario of realWorldDataset) {
    console.log(`\nprocessing test case ${scenario.id}: [${scenario.targetCategory}]`);
    
    console.log("-> running metadata strategy...");
    const metaData = await executeMetadataPipeline(scenario.queryText, scenario.targetCategory);
    const metaRow = `${scenario.id},metadata,${scenario.targetCategory},${metaData.duration},${formatCSVField(metaData.answer)}\n`;
    fs.appendFileSync(csvPath, metaRow);
    
    console.log("-> running agentic strategy...");
    const agentData = await executeAgenticPipeline(scenario.queryText);
    const agentRow = `${scenario.id},agentic,${scenario.targetCategory},${agentData.duration},${formatCSVField(agentData.answer)}\n`;
    fs.appendFileSync(csvPath, agentRow);
  }
  
  console.log(`\nreal-world batch complete. output safely logged to: ${csvPath}`);
}

runRealWorldExperiment().catch(console.error);