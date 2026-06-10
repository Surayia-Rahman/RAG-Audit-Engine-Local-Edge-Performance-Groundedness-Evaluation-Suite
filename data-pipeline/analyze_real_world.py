import os
import pandas as pd
from scipy import stats

# path pointing directly to your new, perfectly escaped real-world metrics file
csv_path = path = os.path.join("..", "backend", "real_world_metrics.csv")

def analyze_production_metrics():
    if not os.path.exists(csv_path):
        print(f"error: could not locate real_world_metrics.csv at {csv_path}")
        return

    try:
        # load our cleanly formatted real-world dataset
        df = pd.read_csv(csv_path)
        
        # separate our tracking groups
        metadata_latencies = df[df["pipeline_type"] == "metadata"]["latency_ms"]
        agentic_latencies = df[df["pipeline_type"] == "agentic"]["latency_ms"]
        
        mean_meta = metadata_latencies.mean()
        mean_agent = agentic_latencies.mean()
        
        print("=== real-world descriptive statistics ===")
        print(f"total evaluation runs processed: {len(df)}")
        print(f"mean metadata pipeline latency: {mean_meta:.2f} ms")
        print(f"mean agentic pipeline latency: {mean_agent:.2f} ms")
        print(f"absolute operational delta: {mean_agent - mean_meta:.2f} ms\n")
        
        print("=== academic hypothesis testing (two-sample t-test) ===")
        t_stat, p_value = stats.ttest_ind(metadata_latencies, agentic_latencies, equal_var=False)
        
        print(f"calculated t-statistic value: {t_stat:.4f}")
        print(f"calculated p-value parameter: {p_value:.4f}")
        
        alpha = 0.05
        if p_value < alpha:
            print("\nconclusion: reject the null hypothesis (h0).")
            print("the latency variance between pipelines is statistically significant under production conditions.")
        else:
            print("\nconclusion: fail to reject the null hypothesis (h0).")
            print("the operational overhead between strategies is not statistically significant at this scale.")

    except Exception as e:
        print(f"failed to compute statistical significance: {e}")

if __name__ == "__main__":
    analyze_production_metrics()