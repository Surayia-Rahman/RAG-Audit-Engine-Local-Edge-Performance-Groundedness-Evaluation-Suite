## 1. Project Overview & Architectural Paradigms

The core engineering handles the deployment of an enterprise-grade evaluation matrix to assess data bottlenecks when running large language models locally. In highly specialized context windows, naive document retrieval frequently feeds irrelevant, bloated chunks into the model, incurring severe generation slowdowns.

To systematically address this optimization problem, this architecture evaluates two distinct context-compaction frameworks against the baseline dataset:

```
                                  [ User Query ]
                                        |
                 +----------------------+----------------------+
                 |                                             |
     [ 1. Metadata Routing ]                         [ 2. Naive Retrieval ]
                 |                                             |
   ( SQL Structural Filtering )                      ( Pull Raw Chunks )
                 |                                             |
  [ PostgreSQL + pgvector Index ]                              |
                 |                                   [ Gemma2:2b Compactor ]
                 |                                   ( Sentence Pruning & Fact Ext. )
                 |                                             |
                 +----------------------+----------------------+
                                        |
                              [ Final Prompt Build ]
                                        |
                             [ Llama3 Execution ]

```

### Experimental Group 1: Metadata-Driven Routing

This configuration implements highly precise relational constraints combined with a vector similarity search engine. The model utilizes strict metadata filtering flags directly within the database queries before loading elements into the pipeline. By fencing data boundaries prior to vector scanning, the model limits context window footprint size without preprocessing noise.

* **Database Query Layer:**

$$\text{Target Data Selection} = \{x \in \text{Document Chunks} \mid \text{Category}(x) = \text{Target Category}\}$$


* **Vector Metric Optimization:** Cosine Distance mapping ($\Leftrightarrow$) executed strictly across the pre-filtered sub-partitions.

### Experimental Group 2: Agentic Context Compaction

This configuration implements a completely structural alternative. It triggers a wide, naive retrieval vector capture across unpartitioned database layers, merges dense chunks together, and delegates preprocessing to a secondary, light-parameter editor agent. The small agent reviews the raw context blocks, strips out fluff, isolates facts explicitly correlated with the query, and constructs a dense payload for the final engine.

* **Compaction Chain:** Dense Data Walls $\rightarrow$ Localized `gemma2:2b` Extraction layer $\rightarrow$ Structured Summary payload.

---

## 2. Experimental Execution & Statistical Findings

To eliminate hardware-coupling run variations during data collection, automated background batch testing sweeps were executed through dedicated execution harnesses (`batch_experiment.ts` and `real_world_experiment.ts`) over a minimum threshold profile of $N = 30$ steady-state analytical runs.

### Performance Latency Results

Statistical performance evaluation was calculated via a two-sample **Welch's $t$-test** comparing completion tracking arrays.

| Evaluation Metric Tracking | Metadata-Driven Routing | Agentic Context Compaction |
| --- | --- | --- |
| **Mean Steady-State Latency** | $\approx 19.21\text{s} - 35.35\text{s}$ | $\approx 21.67\text{s} - 30.59\text{s}$ |
| **Statistical Latency Overhead** | Optimized Base Profile | Verified $\approx 6\text{s}$ Pipeline Penalty |
| **Welch's $t$-test Significance** | Baseline Axis | $p < 0.05$ (Null Hypothesis Rejected) |

* **Key Insight:** The Agentic pipeline introduces a statistically significant latency penalty due to sequential context generation loops, requiring the CPU/GPU to cycle tokens through `gemma2:2b` entirely before initializing the final inference phase in `llama3`.

### Semantic Quality Achievements

* **Hallucination Containment:** Operating under deterministic constraints ($\text{temperature} = 0.0$), both architectures demonstrate outstanding resilience against out-of-domain query attacks. When subjected to adversarial inquiries (e.g., executing appliance-targeted test scenarios over a database seeded with cosmetic text), both engines choose safe factual refusals over hallucinated fabrications.
* **Context Precision:** Metadata routing successfully blocks semantic drift by returning an empty set when categories do not align. The Agentic pipeline successfully filters surrounding noise via compaction, though it exhibits higher sensitivity to context pollution if the underlying editor agent runs on a low parameter boundary.

---

## 3. Technology Stack & Directory Structural Mapping

### System Stack

* **User Interface Layer:** React 18, TypeScript, Tailwind CSS v4 Native Compiler Engine, Lucide Icons.
* **Pipeline API Gateway:** Node.js, Express, CORS, TypeScript (`tsx` compilation runtime execution).
* **Database Engine:** PostgreSQL, `pgvector` index tables served inside a Docker container cluster.
* **Orchestration & Weights Framework:** LangChain Engine (`@langchain/ollama`), Ollama background inference serving `llama3` and `gemma2:2b`.

### Directory Layout

```text
rag-research-project/
├── backend/
│   ├── src/
│   │   ├── batch_experiment.ts        # Automated synthetic testing loop harness
│   │   ├── pipelines.ts               # Core RAG Execution (pgvector Queries + Ollama)
│   │   ├── real_world_experiment.ts   # CSV recording harness for real-world scenarios
│   │   └── server.ts                  # Live Express API Gateway (Port 3001)
│   ├── metrics_log.csv                # Synthetic 30-run batch experiment data matrix
│   ├── package-lock.json
│   ├── package.json
│   ├── real_world_metrics.csv         # Logged records from live frontend interactions
│   └── tsconfig.json
├── data-pipeline/
│   ├── amazon_reviews_train.jsonl     # Base training set vector source material
│   ├── analyze_real_world.py          # Empirical script processing runtime csv matrix logs
│   ├── analyze_results.py             # Welch's t-test and latency distribution plot charts
│   ├── download_dataset.py            # Automated collection fetching logic for raw inputs
│   ├── seed_amazon_dataset.py         # Specialized parser handling vector normalization
│   └── seed_database.py               # SQL transaction connector seeding local pgvector
└── frontend/
    ├── public/
    ├── src/
    │   ├── App.tsx                    # Interactive React Analytics Dashboard
    │   └── index.css                  # Tailwind v4 styling layer
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts                 # Native Vite bundling configuration

```

---

## 4. Operational Deployment Guide

To spin up the live unscripted system end-to-end, execute the initialization steps sequentially across clean terminal windows.

### Infrastructure Validation Requirements

1. Confirm **Docker Desktop** is active, hosting your PostgreSQL instance on port `5432`.
2. Confirm the **Ollama** engine daemon is fully initialized in your background system tray:
```bash
ollama pull llama3
ollama pull gemma2:2b

```



### Step 1: Initialize the API Server Gateway

Navigate to the backend directory, install pure decoupled configurations, and launch the server pipeline:

```bash
cd backend
npm install --legacy-peer-deps
npx tsx src/server.ts

```

*Console output signature:* `🚀 [LIVE GATEWAY ENGAGED] Listening on http://localhost:3001`

### Step 2: Initialize the Frontend Visual Dashboard

Open a secondary independent terminal terminal instance, clear active visual configurations, and spin up Vite:

```bash
cd frontend
npm install
npm run dev

```

*Console output signature:* Open local web browser anchor to `http://localhost:5173/`

Select a target scenario block from the **Evaluation Matrix Scenarios** list panel and trigger **Execute Comparative Analysis** to observe raw vector streaming and local model context extraction logs.
<img width="1846" height="864" alt="image" src="https://github.com/user-attachments/assets/f097ade3-7e90-44ec-9ce6-670edd7a85f9" />

<img width="1801" height="922" alt="image" src="https://github.com/user-attachments/assets/8a519411-f9ab-421a-a856-4b9e553af662" />


---

## 5. System Limitations & Future Work

### Limitations

* **Hardware Thread Coupling:** Because inference runs purely at the local edge, execution times show heavy variance based on active system memory limits, CPU/GPU throttling, and background thread load switching.
* **Mismatched Retrieval Alignment:** The retrieval model is bound to the available seeded database text. If queries and metadata parameters are mismatched, the generation tier defaults to safe denials, preventing deeper tests of semantic synthesis quality.
* **Agentic Compaction Bottlenecks:** The pipeline uses a synchronous design where the compacting agent must fully generate its text before the primary model can start. This creates a processing queue that limits system throughput.

### Future Work

* **Asynchronous Processing Streams:** Update the agent layer to handle real-time chunk token streaming via asynchronous WebSockets. This allows the primary generation model to begin reading the context data while the compactor agent is still processing chunks.
* **Automated Evaluation Integration (LLM-as-a-Judge):** Integrate a production-ready python assessment step (`evaluate_accuracy.py`) directly into the backend runtime loop. This will automatically log quantitative semantic accuracy, faithfulness, and answer relevance metrics to the CSV logs alongside latency speeds.
* **Cross-Domain Vector Seeding:** Expand database vector distribution layers to cover balanced domain types across finance, health, and consumer appliances. This will let developers audit cross-domain routing performance profiles without intentional data mismatches.
