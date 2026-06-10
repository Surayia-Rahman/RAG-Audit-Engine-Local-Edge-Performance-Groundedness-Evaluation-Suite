import os
import json
import psycopg2
import ollama

# connection settings matching our local postgres database container
db_config = {
    "host": "localhost",
    "port": "5432",
    "database": "rag_experiments",
    "user": "research_user",
    "password": "research_password_2026"
}

def seed_production_index():
    # this matches the file name you just successfully downloaded!
    local_file = "amazon_reviews_train.jsonl"
    
    if not os.path.exists(local_file):
        print(f"error: local data file '{local_file}' not found. run download_dataset.py first.")
        return

    # connect to the active postgres container
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    print("wiping old document matrix table...")
    cursor.execute("DROP TABLE IF EXISTS document_chunks;")
    
    create_table_query = """
    CREATE TABLE document_chunks (
        id SERIAL PRIMARY KEY,
        doc_id VARCHAR(50),
        category VARCHAR(50),
        chunk_timestamp TIMESTAMP,
        content TEXT,
        embedding vector(768)
    );
    """
    cursor.execute(create_table_query)
    conn.commit()
    
    print(f"reading local data framework rows from {local_file}...")
    row_count = 0
    target_limit = 7000
    
    # process the file line-by-line entirely offline
    with open(local_file, "r", encoding="utf-8") as f:
        for line in f:
            if row_count >= target_limit:
                break
                
            try:
                row_data = json.loads(line)
                
                doc_id = f"amzn_{row_count}"
                category = "appliances"
                
                # extract text field matching our new script-free json schema
                content_text = str(row_data.get("text", "")).lower().strip()
                
                if not content_text or len(content_text) < 15:
                    continue
                    
                # generate the dense vector representation locally using ollama
                response = ollama.embed(
                    model="nomic-embed-text",
                    input=content_text
                )
                embedding = response["embeddings"][0]
                
                # insert cleanly into your local database index
                insert_query = """
                INSERT INTO document_chunks (doc_id, category, chunk_timestamp, content, embedding)
                VALUES (%s, %s, NOW(), %s, %s);
                """
                cursor.execute(insert_query, (doc_id, category, content_text, embedding))
                
                row_count += 1
                if row_count % 100 == 0:
                    print(f"safely indexed and embedded {row_count} / {target_limit} rows...")
                    conn.commit()
                    
            except Exception as e:
                # ignore anomalous line reads and keep moving
                continue
                
    conn.commit()
    print(f"\nsuccess! real-world data layer initialization complete: {row_count} rows loaded.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    seed_production_index()