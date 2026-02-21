from embeddings import chunk_article, embed_chunks
from retrieval import retrieve_relevant_chunks
from generation import generate_campaign_kit
from config import GCP_PROJECT, GCP_LOCATION, EMBEDDING_MODEL


# Test article (WHO flooding article)
article_text = """Intense rainfall and severe flooding since mid-December 2025 have affected around 1.3 million people in southern Africa, destroyed houses and critical infrastructure and disrupted access to health services, heightening risks of water- and mosquito-borne diseases.

About half of the people affected are in Mozambique, according to preliminary assessments by the World Health Organization (WHO). The floods have also affected parts of Malawi, South Africa, Tanzania, Zambia and Zimbabwe. Urgent humanitarian needs include shelter, safe water and access to essential health services.

Water-borne diseases, particularly acute watery diarrhoea and cholera are serious threats in sites hosting people displaced by the deluge due to overcrowding, poor access to hygiene and sanitation services as well as inadequate safe water.

WHO and partners are supporting national authorities in the disaster response. Activities include pre-positioning cholera and other essential health supplies, establishing health response coordination at provincial and district levels and strengthening active disease surveillance and prevention measures.

Establishing mobile clinics in flood-affected areas, ensuring functional emergency obstetric and newborn care services in displacement sites as well as intensifying diarrhoea and cholera prevention are among the immediate priority measures being undertaken."""

source_url = "https://www.afro.who.int/news/around-13-million-people-affected-severe-flooding-southern-africa"

# Step 1: Chunk
print("Chunking...")
chunks = chunk_article(
    article_text=article_text,
    source_url=source_url,
    title="Southern Africa Flooding",
    publish_date="2026-01-23",
    campaign_id="campaign_001"
)
print(f"Created {len(chunks)} chunks\n")

# Step 2: Embed
print("Embedding...")
chunks = embed_chunks(chunks)
print(f"All chunks embedded\n")

# Step 3: Retrieve
print("Retrieving relevant chunks...")
results = retrieve_relevant_chunks("flooding humanitarian aid africa", chunks, top_k=3)
for chunk, score in results:
    print(f"  {chunk['id']} (score: {score:.4f}): {chunk['text'][:70]}...")

# Step 4: Generate
print("\nGenerating campaign kit...")
source_urls = list(set([c["source_url"] for c, _ in results]))
campaign = generate_campaign_kit(results, source_urls)
print("\nGENERATED CAMPAIGN KIT:")
print(campaign)