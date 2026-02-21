import vertexai
from vertexai.language_models import TextEmbeddingModel
from config import GCP_PROJECT, GCP_LOCATION, EMBEDDING_MODEL
vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)

def chunk_article(article_text: str, source_url: str, title: str, publish_date: str, campaign_id: str):
    """Split article into chunks with metadata."""
    paragraphs = [p.strip() for p in article_text.strip().split("\n\n") if p.strip()]
    chunks = []
    for i, para in enumerate(paragraphs):
        chunks.append({
            "id": f"{campaign_id}_chunk_{i}",
            "text": para,
            "source_url": source_url,
            "title": title,
            "publish_date": publish_date,
            "campaign_id": campaign_id,  # Tim's "shared id" requirement
        })
    return chunks

def embed_chunks(chunks: list):
    """Generate embeddings for each chunk."""
    model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL)
    for chunk in chunks:
        embedding = model.get_embeddings([chunk["text"]])[0].values
        chunk["embedding"] = embedding
    return chunks