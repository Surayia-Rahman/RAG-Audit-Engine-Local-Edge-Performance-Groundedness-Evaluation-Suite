import React, { useState } from 'react';
import { Play, ShieldAlert, Cpu, Database, BarChart3, RefreshCw } from 'lucide-react';

interface TestCase {
  id: number;
  queryText: string;
  targetCategory: string;
}

interface RunResult {
  pipeline_type: 'metadata' | 'agentic';
  latency_ms: number;
  generated_answer: string;
}

const realWorldDataset: TestCase[] = [
  { id: 1, queryText: "what do users complain about regarding setup, performance, or installation issues?", targetCategory: "appliances" },
  { id: 2, queryText: "what specific features make this choice highly recommended for long term value?", targetCategory: "appliances" },
  { id: 3, queryText: "are there any specific safety warnings, defect reports, or breakdown structural anomalies?", targetCategory: "appliances" },
  { id: 4, queryText: "what is the general user sentiment regarding the delivery packaging and quality control?", targetCategory: "appliances" },
  { id: 5, queryText: "how does the product handle continuous daily usage over an extended period of time?", targetCategory: "appliances" },
  { id: 6, queryText: "are there mentions of unexpected operational noise, vibrations, or loud sounds?", targetCategory: "appliances" },
  { id: 7, queryText: "does the item require specialized cleaning tools or high maintenance overhead?", targetCategory: "appliances" },
  { id: 8, queryText: "what do users say about the user interface, buttons, or physical design layout?", targetCategory: "appliances" },
  { id: 9, queryText: "is the build material described as premium durable metal or fragile plastic components?", targetCategory: "appliances" },
  { id: 10, queryText: "do consumers feel that the actual product match the promotional advertising descriptions?", targetCategory: "appliances" },
  { id: 11, queryText: "are there complaints regarding electrical power usage, cords, or short-circuiting?", targetCategory: "appliances" },
  { id: 12, queryText: "what alternative brands do users compare this item to when evaluating performance?", targetCategory: "appliances" },
  { id: 13, queryText: "does the user manual provide clear step-by-step instructions for troubleshooting errors?", targetCategory: "appliances" },
  { id: 14, queryText: "are there any hidden maintenance costs or accessories required that were not included?", targetCategory: "appliances" },
  { id: 15, queryText: "what is the consensus on customer support responsiveness for resolving broken parts?", targetCategory: "appliances" }
];

export default function App() {
  const [selectedCase, setSelectedCase] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<{ metadata?: RunResult; agentic?: RunResult } | null>(null);

  const triggerPipelineRun = async () => {
    setIsRunning(true);
    setResults(null);
    
    const currentQuery = realWorldDataset.find(c => c.id === selectedCase);
    if (!currentQuery) return;

    try {
      // POST the clicked question parameters straight to your local node runtime server
      const response = await fetch('http://localhost:3001/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryText: currentQuery.queryText,
          targetCategory: currentQuery.targetCategory
        })
      });

      if (!response.ok) throw new Error("Local pipeline connection timed out.");
      
      const data = await response.json();
      
      // Update UI state with real unscripted LLM token outputs and speeds from the backend
      setResults({
        metadata: data.metadata,
        agentic: data.agentic
      });

    } catch (error) {
      console.error("Live execution failed:", error);
      alert("Execution Engine Offline: Make sure your server.ts and Ollama instances are running!");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#090d16] text-slate-100">
      {/* Header */}
      <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-400">RAG-Audit Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Localized Evaluation Dashboard & Optimization Analytics Suite</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          PostgreSQL Matrix Container: Active
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scenario Selector Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" /> Evaluation Matrix Scenarios
          </h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {realWorldDataset.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => !isRunning && setSelectedCase(scenario.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 cursor-pointer ${
                  selectedCase === scenario.id
                    ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-teal-600 font-semibold">ID: #00{scenario.id}</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] uppercase font-bold text-slate-500">{scenario.targetCategory}</span>
                </div>
                <p className="line-clamp-2 leading-relaxed">{scenario.queryText}</p>
              </button>
            ))}
          </div>

          <button
            onClick={triggerPipelineRun}
            disabled={isRunning}
            className="w-full mt-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-40"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {isRunning ? 'Invoking Local Core Engines...' : 'Execute Comparative Analysis'}
          </button>
        </div>

        {/* Output & Latency Monitoring Panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metadata Card */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Metadata Routing
                </span>
                <span className="text-[10px] font-mono text-slate-500">Llama3 (0.0t)</span>
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight text-sky-100">
                {results?.metadata ? `${(results.metadata.latency_ms / 1000).toFixed(2)}s` : '--.--s'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Direct vector intersection over metadata partitions.</p>
            </div>

            {/* Agentic Card */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Agentic Compaction
                </span>
                <span className="text-[10px] font-mono text-slate-500">Gemma2:2b</span>
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight text-amber-100">
                {results?.agentic ? `${(results.agentic.latency_ms / 1000).toFixed(2)}s` : '--.--s'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dual-model sequential context contraction pass.</p>
            </div>
          </div>

          {/* Response Trace Logs */}
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-6 min-h-[340px] flex flex-col justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500" /> Grounded Generation Trace Logs
            </h3>

            {!results && !isRunning && (
              <div className="flex flex-col items-center justify-center text-center my-auto py-12">
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Select a real-world scenario from the tracking matrix and click execute to run live semantic evaluation logs.</p>
              </div>
            )}

            {isRunning && (
              <div className="flex flex-col items-center justify-center text-center my-auto py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-500 mb-3" />
                <p className="text-xs text-slate-400 font-mono tracking-wide">Awaiting localized model response array...</p>
              </div>
            )}

            {results && !isRunning && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
                  <h4 className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase mb-2 pb-1 border-b border-slate-900">Metadata Strategy Output</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.metadata?.generated_answer}</p>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
                  <h4 className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-2 pb-1 border-b border-slate-900">Agentic Strategy Output</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.agentic?.generated_answer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}