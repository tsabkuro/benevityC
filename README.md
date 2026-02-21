# benevityC

### backend

cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8001

#### window:

cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

### Front end

cd frontend
npm run dev

### Example query to test:

POST: {{URL}}/api/scrape
{
"query": "earthquake Japan",
"max_articles": 3
}
