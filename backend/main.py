from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
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
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            )
            results = await search_all_stores(q, browser)
            await browser.close()
            
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
