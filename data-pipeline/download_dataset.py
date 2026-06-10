import os
import json
from datasets import load_dataset

def download_script_free_reviews():
    output_filename = "amazon_reviews_train.jsonl"
    print("connecting to direct parquet/json data partition on hf...")
    
    try:
        # loads from a modern, pre-converted version that uses no background script frameworks
        dataset = load_dataset(
            "gmongaras/Amazon-Reviews-2023", 
            split="train", 
            streaming=True
        )
        
        print("data stream established. caching real-world records locally...")
        row_count = 0
        target_limit = 7000
        
        with open(output_filename, "w", encoding="utf-8") as f:
            for row in dataset:
                if row_count >= target_limit:
                    break
                
                # package standard text fields cleanly matching the schema
                clean_row = {
                    "text": str(row.get("text", "")).strip(),
                    "category": "appliances"
                }
                
                f.write(json.dumps(clean_row) + "\n")
                row_count += 1
                
        print(f"\nsuccess! real data framework saved locally as: {os.path.abspath(output_filename)}")
        print(f"total rows written: {row_count}")
        
    except Exception as e:
        print(f"\nfailed to extract dataset assets: {e}")

if __name__ == "__main__":
    download_script_free_reviews()