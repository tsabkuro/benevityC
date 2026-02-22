GCP_PROJECT = "proj-benevity-c"
GCP_LOCATION = "us-central1"

# Models
GENERATION_MODEL = "gemini-2.5-pro"
EMBEDDING_MODEL = "text-embedding-005"

# Vector Search
INDEX_RESOURCE_NAME = "projects/1000716781297/locations/us-central1/indexes/4392955772267397120"
ENDPOINT_RESOURCE_NAME = "projects/1000716781297/locations/us-central1/indexEndpoints/5636617772491341824"
DEPLOYED_INDEX_ID = "campaign_news_deployed"

# Campaign kit response schema for Vertex AI structured output
CAMPAIGN_KIT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "location": {"type": "string"},
        "event_type": {
            "type": "string",
            "enum": ["earthquake", "flood", "hurricane", "wildfire", "tsunami", "other"],
        },
        "summary": {"type": "string"},
        "key_claims": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "claim": {"type": "string"},
                    "source_url": {"type": "string"},
                },
                "required": ["claim", "source_url"],
            },
        },
        "confidence_score": {
            "type": "number",
        },
        "image_url": {
            "type": "string",
        },
    },
    "required": ["title", "location", "event_type", "summary", "key_claims", "confidence_score", "image_url"],
}