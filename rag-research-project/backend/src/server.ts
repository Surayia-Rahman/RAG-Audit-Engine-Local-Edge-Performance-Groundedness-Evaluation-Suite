import express from 'express';
import cors from 'cors';
import { runMetadataPipeline, runAgenticPipeline } from './pipelines'; 

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/evaluate', async (req, res) => {
  const { queryText, targetCategory } = req.body;
  
  try {
    console.log(`\nIncoming Web Request: "${queryText}" [Category: ${targetCategory}]`);
    
    // 1. Run your real Metadata Pipeline and pull its internal metrics
    console.log("⚡ Invoking local pgvector index + Llama3...");
    const metaPipelineData = await runMetadataPipeline(queryText, targetCategory);

    // 2. Run your real Agentic Pipeline and pull its combined metrics
    console.log("⚡ Invoking Naive Context Retrieval + Gemma2 Compactor + Llama3...");
    const agentPipelineData = await runAgenticPipeline(queryText, targetCategory);

    console.log(`✅ Complete! Meta: ${metaPipelineData.duration}ms | Agent: ${agentPipelineData.duration}ms`);

    // Stream the real, unscripted data straight into your React dashboard states
    res.json({
      metadata: {
        pipeline_type: 'metadata',
        latency_ms: metaPipelineData.duration, // Using the real model timing from your pipeline script
        generated_answer: metaPipelineData.response // Using the real unscripted text string
      },
      agentic: {
        pipeline_type: 'agentic',
        latency_ms: agentPipelineData.duration, // Using the real combined agent timing
        generated_answer: agentPipelineData.response // Using the real unscripted text string
      }
    });

  } catch (error) {
    console.error("⛔ Pipeline runtime crash error:", error);
    res.status(500).json({ error: "Localized core pipeline execution failed." });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 [LIVE GATEWAY ENGAGED] Listening on http://localhost:${PORT}`);
  console.log(`📌 Standing by for real-time frontend execution requests...`);
});