from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from app.search import search_all_stores

@asynccontextmanager
async def lifespan(app: FastAPI):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    app.state.browser = browser
    yield
    await browser.close()
    await playwright.stop()

app = FastAPI(title="Book Finder", lifespan=lifespan)

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
async def search_books(request: Request, q: str = Query(..., min_length=2)):
    browser = request.app.state.browser
    results = await search_all_stores(q, browser)
    return {"query": q, "count": len(results), "results": results}
