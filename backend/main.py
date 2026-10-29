from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.search import search_all_stores

app = FastAPI(title="Book Finder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Book Finder API is running!"}

@app.get("/api/search")
async def search_books(q: str = Query(..., min_length=2)):
    try:
        results = await search_all_stores(q, None)
        return {
            "query": q,
            "count": len(results),
            "results": results
        }
    except Exception as e:
        print(f"[EROARE CRITICĂ LA CĂUTARE]: {e}")
        return {
            "query": q,
            "count": 0,
            "results": []
        }
