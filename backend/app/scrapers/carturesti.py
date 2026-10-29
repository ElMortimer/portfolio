from urllib.parse import quote
from playwright.async_api import Browser

from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

EXTRACT_JS = """
() => {
  const cards = document.querySelectorAll('prod-list-box, prod-grid-box');

  return Array.from(cards).map(card => {
    const titleEl = card.querySelector('h5.md-title');
    const authorEl = card.querySelector('div.subtitlu-produs a[href*="/autor/"]');
    const priceEl = card.querySelector('span.suma');
    const stockEl = card.querySelector('.productStock');
    const linkEl = card.querySelector('a.select-item-event');

    let stockStatus = 'unknown';
    if (stockEl) {
      const cls = [...stockEl.classList];
      stockStatus = cls.find(c => ['in-stoc', 'limitat', 'indisponibil'].includes(c)) || 'unknown';
    }

    return {
      title: titleEl?.innerText.trim() || null,
      author: authorEl?.innerText.trim() || null,
      price: priceEl ? parseFloat(priceEl.getAttribute('content')) : null,
      stock_status: stockStatus,
      url: linkEl?.href || null
    };
  });
}
"""

class CarturestiScraper(BookStoreScraper):
    name = "carturesti"

    async def search(self, query: str, browser: Browser) -> list[BookOffer]:
        offers: list[BookOffer] = []
        
        page = await browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )

        try:
            url = f"https://carturesti.ro/product/search/{quote(query)}"
            await page.goto(url, wait_until="networkidle")

            try:
                await page.wait_for_selector("h5.md-title", timeout=8000)
            except Exception:
                return offers
                
            raw_items = await page.evaluate(EXTRACT_JS)
            
        finally:
            await page.close()

        for item in raw_items:
            if not item.get("title"):
                continue
            if not self._is_relevant(item["title"], item.get("author"), query):
                continue
            if item.get("url") and "/carte/" not in item["url"]:
                continue

            offers.append(BookOffer(
                store=self.name,
                title=item["title"],
                author=item.get("author"),
                price=item.get("price"),
                currency="RON",
                available=item.get("stock_status") in ("in-stoc", "limitat"),
                url=item.get("url"),
            ))

        offers.sort(key=lambda o: (o.price is None, o.price))
        return offers
