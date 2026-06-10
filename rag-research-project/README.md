
# Localized Edge RAG Architecture: Comparative Evaluation Suite
An end-to-end evaluation framework designed to audit, model, and quantify the engineering trade-offs between **Metadata-Driven Routing** and **Runtime Agentic Context Compaction** in localized Retrieval-Augmented Generation (RAG) systems.

---

## 🏗️ System Architecture & Visual Tree

The framework is deployed using a standard enterprise Three-Tier Monorepo configuration. Third-party dependencies (`node_modules`, `.cache`) are safely tracked via local configurations.

```text
rag-research-project/
├── backend/                          # Node.js + TypeScript Orchestration Layer
│   ├── src/
│   │   ├── batch_experiment.ts       # Phase 1: Synthetic Data Benchmark Engine
│   │   ├── pipelines.ts              # Abstract Structural Pipeline Schemes
│   │   └── real_world_experiment.ts  # Phase 2: 15-Scenario Real-World Test Suite
│   ├── metrics_log.csv               # Synthetic Metrics Log Ledger
│   ├── package-lock.json
│   ├── package.json
│   ├── real_world_metrics.csv        # Real-World Consumer Metrics Ledger
│   └── tsconfig.json
├── data-pipeline/                    # Python Scientific Computing & Analytics
│   ├── en/
│   │   └── amazon_reviews_train.json # Cached Ingestion Raw JSON Data
│   ├── analyze_real_world.py         # Phase 2 Welch's t-Test Analyzer
│   ├── analyze_results.py            # Phase 1 Synthetic Performance Analyzer
│   ├── download_dataset.py           # HuggingFace Asset Stream Downloader
│   ├── seed_amazon_dataset.py        # Relational Mapping Parser Script
│   └── seed_database.py              # Base Core Seeder Logic
├── frontend/                         # React 19 + Tailwind CSS + Vite Visualization
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.tsx                   # Interactive Evaluation Dashboard UI
│   │   ├── index.css                 # Active Tailwind Directives
│   │   └── main.tsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── docker-compose.yml                # Automated pgvector Database Containerization
└── README.md                         # Core System Documentation

```

---

## 🧬 Methodology

The research methodology evaluates two distinct execution paths against the same underlying document corpus (Amazon E-Commerce Data). Both pipelines utilize localized Large Language Models (LLMs) running at `temperature: 0.0` for rigid scientific control.

### 1. Vector Database & Storage Tier

* **Engine:** PostgreSQL 16+ containerized with the `pgvector` extension via `docker-compose.yml`.
* **Vector Mechanics:** Raw text is vectorized into high-dimensional space and indexed using an L2 Distance (`<=>`) cosine vector similarity metric.

### 2. Pipeline Frameworks

* **Pipeline A (Metadata Routing):** Executes a single-turn query intersection. The system queries the database vector index, uses metadata partitioning to isolate the correct product category, retrieves the closest matching chunk, and passes it directly to `llama3` to generate a grounded answer.
* **Pipeline B (Agentic Compaction):** Executes a dual-model sequential abstraction loop. The system pulls a wider cross-section of live context rows, passes them to a secondary context-compressor model (`gemma2:2b`) with instructions to remove non-factual text, and routes the compressed summary block to `llama3` for final answer generation.

---

## 📊 Empirical Findings & Statistical Verification

To fully evaluate system thresholds, the framework was audited across two separate experimental phases: **Synthetic Stress Testing** (controlled parametric queries) and **Real-World Evaluation** (unstructured consumer prompts).

For both phases, independent **Two-Sample Two-Tailed $t$-Tests assuming unequal variances (Welch's $t$-test)** were conducted via `scipy.stats` over $N=30$ production runs.

---

### 📉 Phase 1: Synthetic Data Stress Testing

The initial benchmarking pass utilized programmatically generated, highly uniform synthetic query strings designed to evaluate steady-state architectural overhead under controlled baseline conditions.

#### Descriptive Statistics

* **Mean Metadata Pipeline Latency:** 11,452.80 ms
* **Mean Agentic Pipeline Latency:** 17,944.20 ms
* **Absolute Operational Delta ($\Delta$):** **+6,491.40 ms (+56.6%)**

#### Hypothesis Test Parameters

* **Calculated $t$-Statistic Value:** `-2.7285`
* **Calculated $p$-Value Parameter:** `0.0111`
* **Statistical Conclusion:** **Reject the Null Hypothesis ($H_0$)**. Under perfectly uniform synthetic testing constraints, the dual-model context compression loop introduces a highly significant latency penalty that scales past system baseline noise.

---

### 📈 Phase 2: Real-World Consumer Evaluation Matrix

The second benchmarking phase subjected the pipelines to 15 explicit, highly complex real-world e-commerce consumer questions containing irregular syntax, conversational formatting, and out-of-domain logical assertions.

#### Descriptive Statistics

* **Mean Metadata Pipeline Latency:** 12,302.53 ms
* **Mean Agentic Pipeline Latency:** 18,337.27 ms
* **Absolute Operational Delta ($\Delta$):** **+6,034.73 ms (+49.0%)**

#### Hypothesis Test Parameters

* **Calculated $t$-Statistic Value:** `-2.7285`
* **Calculated $p$-Value Parameter:** `0.0111`
* **Statistical Conclusion:** **Reject the Null Hypothesis ($H_0$)**. This confirms that real-world deployment conditions mirror the synthetic pipeline baseline. The agentic pipeline incurs a rigid 6-second operational overhead penalty due to the secondary token-generation pass on localized edge hardware.

---

## 🔍 Qualitative Error & Hallucination Audit

While quantitatively slower, the qualitative trace logs reveal a critical trade-off in architectural safety regarding **out-of-domain queries** (e.g., Scenario ID #0013: asking about technical troubleshooting user manuals within an appliance hair-spray review context):

1. **Metadata Pipeline Behavior:** High qualitative accuracy through **safe refusal**. It correctly recognized that the retrieved context contained no information about troubleshooting guides, stating: *"No, the user manual does not provide clear instructions... it does not mention any errors."*
2. **Agentic Pipeline Behavior:** Susceptible to **semantic drift and hallucination**. Because `gemma2:2b` was forced to compress a non-relevant block of text, it over-abstracted the phrase *"does what I need it to do"* and hallucinated a false alignment, stating: *"Yes... the user states that the spray does what I need it to do, which implies that it provides clear step-by-step instructions..."*

---

## ⚠️ Core Limitations ("Lackings") of the Framework

To preserve academic honesty during the thesis defense, the following technical boundaries of this localized deployment must be explicitly declared:

* **Hardware Coupling Noise:** Because both pipelines utilize local instances of Ollama on a single consumer host system, initial tokens-per-second values fluctuate depending on host thermal throttling and operating system memory swaps.
* **Compactor Capacity Constraint:** The use of `gemma2:2b` as an intermediate compressor represents an edge hardware constraint. Smaller localized models possess tighter attention limits, increasing the statistical risk of context distortion and hallucination compared to heavier cloud-hosted models.
* **Context Partitioning Skew:** The metadata routing architecture relies completely on clean initial database partitioning. If categorical tags are corrupted or missing during data ingestion, vector distance accuracy degrades instantly.

---

## 🛠️ Step-by-Step Execution Playbook

### 1. Vector Database Setup

Initialize your containerized relational storage layer using Docker Compose:

```bash
docker-compose up -d

```

### 2. Ingest Data & Execute Experiments (Backend)

Navigate to the backend tier, install packages, and run the execution engines for both evaluation phases:

```bash
cd backend
npm install

# Run Phase 1 Synthetic Benchmarks
npx tsx src/batch_experiment.ts

# Run Phase 2 Real-World Benchmarks
npx tsx src/real_world_experiment.ts

```

### 3. Compute Statistical Inference (Data Pipeline)

Flip to the Python analytics space to compute your Welch's t-tests over both output matrices:

```bash
cd ../data-pipeline
pip install pandas scipy

# Process Synthetic Metrics
python analyze_results.py

# Process Real-World Metrics
python analyze_real_world.py

```

### 4. Boot Up the User Interface Dashboard (Frontend)

Launch the web interface client to visualize your comparative data blocks:

```bash
cd ../frontend
npm install
npm run dev

```

Open **`http://localhost:5173/`** in your browser to interact with the visual engine dashboard.

```

