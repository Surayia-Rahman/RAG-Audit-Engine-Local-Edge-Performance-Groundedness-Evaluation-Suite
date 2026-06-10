import json
import psycopg2
import ollama

# database connection parameters matching our docker-compose file
db_config = {
    "host": "localhost",
    "port": "5432",
    "database": "rag_experiments",
    "user": "research_user",
    "password": "research_password_2026"
}

# simulated seed dataset representing multi-domain sample context chunks
# this keeps the setup free and requires zero external network downloads
sample_documents = [
    {
        "id": "doc_001",
        "category": "finance",
        "timestamp": "2026-01-15 09:00:00",
        "content": "the fiscal framework amendment passed by the board dictates that standard corporate contingency reserves must maintain a minimum threshold of twelve percent of gross annual revenue. allocations falling below this baseline trigger an automated auditing sequence by the risk management committee within forty eight hours."
    },
    {
        "id": "doc_002",
        "category": "finance",
        "timestamp": "2026-03-22 14:30:00",
        "content": "quarterly financial tracking protocols indicate that investment vectors targeting emergent clean energy grids are granted a baseline tax variance allowance. this specific provision enables subsidiaries to offset infrastructure depreciation metrics against localized municipal carbon levies across all domestic operational sectors."
    },
    {
        "id": "doc_003",
        "category": "compliance",
        "timestamp": "2026-02-10 11:15:00",
        "content": "data retention architecture guidelines require that user access log files containing personally identifiable information must be encrypted using aes two hundred and fifty six standards. keys must be rotated every ninety days, and any unencrypted log fragments persisting past the retention window face automatic deletion."
    },
    {
        "id": "doc_004",
        "category": "compliance",
        "timestamp": "2026-05-05 16:45:00",
        "content": "cross border digital transaction compliance frameworks state that data transmission across international nodes must pass through a strict secure socket validation layer. compliance supervisors are legally obligated to record anomalies exceeding five hundred milliseconds in latency to prevent potential packet sniffing vectors."
    }
]

def initialize_database():
    # open a connection to the running postgres docker container
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    # activate the pgvector extension within our target database
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # drop existing tables if running the script multiple times to ensure a clean slate
    cursor.execute("DROP TABLE IF EXISTS document_chunks;")
    
    # create the document storage table with an explicit vector dimension column
    # nomic-embed-text models produce vectors containing exactly 768 dimensions
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
    
    print("database structure initialized and pgvector enabled successfully.")
    cursor.close()
    conn.close()

def seed_data():
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    
    print("generating embeddings using local ollama nomic-embed-text instance...")
    
    for doc in sample_documents:
        # invoke your background ollama service to generate a dense vector for the text using the dedicated embed function
        response = ollama.embed(
            model="nomic-embed-text",
            input=doc["content"]
        )
        # extract the single list vector out of the returned embeddings array
        embedding = response["embeddings"][0]
        
        # insert structured metadata, text context, and numerical vectors into postgres
        insert_query = """
        INSERT INTO document_chunks (doc_id, category, chunk_timestamp, content, embedding)
        VALUES (%s, %s, %s, %s, %s);
        """
        cursor.execute(insert_query, (
            doc["id"],
            doc["category"],
            doc["timestamp"],
            doc["content"],
            embedding
        ))
        
    conn.commit()
    print(f"successfully loaded {len(sample_documents)} documents with vectors into the database.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    initialize_database()
    seed_data()