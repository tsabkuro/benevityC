import numpy as np
import vertexai
from vertexai.language_models import TextEmbeddingModel
from config import GCP_PROJECT, GCP_LOCATION, EMBEDDING_MODEL

vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def retrieve_relevant_chunks(query: str, all_chunks: list, top_k: int = 5):
    """Find the most relevant chunks for a query using cosine similarity.
    
    In production with deployed Vector Search endpoint, replace this
    with endpoint.find_neighbors() call.
    """
    model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL)
    query_embedding = model.get_embeddings([query])[0].values
    
    scored = []
    for chunk in all_chunks:
        if "embedding" in chunk:
            score = cosine_similarity(query_embedding, chunk["embedding"])
            scored.append((chunk, score))
    
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]