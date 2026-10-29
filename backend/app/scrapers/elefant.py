from urllib.parse import quote
from playwright.async_api import Browser

from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

EXTRACT_LIST_JS = """
() => {
  const cards = document.querySelectorAll('div.product-tile:not(.js-product-sold-out)');

  return Array.from(cards).map(card => {
    const titleEl = card.querySelector('a.product-title');
    const authorEl = card.querySelector('a.product-manufacturer');
    const priceEl = card.querySelector('.current-price');
    const stockEl = card.querySelector('.shipping-info');

    let price = null;
    if (priceEl) {
      const raw = priceEl.textContent.replace(/[^0-9,]/g, '').replace(',', '.');
      price = raw ? parseFloat(raw) : null;
    }

    let stockClass = null;
    let stockText = null;
    if (stockEl) {
      const cls = [...stockEl.classList];
      const match = cls.find(c => c.startsWith('shipping-info--'));
      stockClass = match ? match.replace('shipping-info--', '') : null;
      stockText = stockEl.querySelector('.shipping-info-title')?.innerText.trim() || null;
    }

    const available = stockClass === 'in-stoc' || stockText === 'În stoc';
    const isAudiobook = stockClass === 'audiobook' || stockText === 'Audiobook';

    return {
      title: titleEl?.innerText.trim() || null,
      author: authorEl?.innerText.trim() || null,
      price,
      available,
      is_audiobook: isAudiobook,
      url: titleEl?.href || null
    };
  });
}
"""

EXTRACT_SINGLE_PRODUCT_JS = """
() => {
  const titleEl = document.querySelector('h1.product-title');
  const authorEl = document.querySelector('h2.product-brand a');
  const priceEl = document.querySelector('span.current-price');

  let price = null;
  if (priceEl) {
    const raw = priceEl.textContent.replace(/[^0-9,]/g, '').replace(',', '.');
    price = raw ? parseFloat(raw) : null;
  }

  let stockEl = null;
  let node = priceEl;
  while (node && !stockEl) {
    stockEl = node.querySelector ? node.querySelector('.shipping-info') : null;
    node = node.parentElement;
  }

  let stockClass = null;
  let stockText = null;
  if (stockEl) {
    const cls = [...stockEl.classList];
    const match = cls.find(c => c.startsWith('shipping-info--'));
    stockClass = match ? match.replace('shipping-info--', '') : null;
    stockText = stockEl.querySelector('.shipping-info-title')?.innerText.trim() || null;
  }

  const available = stockClass === 'in-stoc' || stockText === 'În stoc';
  const isAudiobook = stockClass === 'audiobook' || stockText === 'Audiobook';

  return [{
    title: titleEl?.innerText.trim() || null,
    author: authorEl?.innerText.trim() || null,
    price,
    available,
    is_audiobook: isAudiobook,
    url: window.location.href
  }];
}
"""

class ElefantScraper(BookStoreScraper):
    name = "elefant"

    async def search(self, query: str, browser: Browser) -> list[BookOffer]:
        offers: list[BookOffer] = []

        page = await browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        
        try:
            url = f"https://www.elefant.ro/search?SearchTerm={quote(query)}"
            await page.goto(url, wait_until="networkidle")

            is_single_product = "/search" not in page.url

            if is_single_product:
                try:
                    await page.wait_for_selector(".shipping-info", timeout=8000)
                except Exception:
                    pass
                raw_items = await page.evaluate(EXTRACT_SINGLE_PRODUCT_JS)
            else:
                try:
                    await page.wait_for_selector(
                        "div.product-tile", state="attached", timeout=8000
                    )
                except Exception:
                    pass
                raw_items = await page.evaluate(EXTRACT_LIST_JS)

        finally:
            await page.close()

        for item in raw_items:
            if not item.get("title"):
                continue
            if item.get("is_audiobook"):
                continue
            if "audiobook" in item["title"].lower():
                continue
            if not self._is_relevant(item["title"], item.get("author"), query):
                continue

            offers.append(BookOffer(
                store=self.name,
                title=item["title"],
                author=item.get("author"),
                price=item.get("price"),
                currency="RON",
                available=bool(item.get("available")),
                url=item.get("url"),
            ))

        offers.sort(key=lambda o: (o.price is None, o.price))
        return offers
