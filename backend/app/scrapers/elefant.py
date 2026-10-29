from urllib.parse import quote
import httpx
from bs4 import BeautifulSoup
from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

class ElefantScraper(BookStoreScraper):
    name = "elefant"

    async def search(self, query: str, browser=None) -> list[BookOffer]:
        offers: list[BookOffer] = []
        url = f"https://www.elefant.ro/search?SearchTerm={quote(query)}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                print(f"[Elefant] Status HTTP: {response.status_code}, Lungime HTML: {len(response.text)}")
                
                if response.status_code != 200:
                    return offers
                
                soup = BeautifulSoup(response.text, 'html.parser')
                items = soup.select('a.product-title, a[href*=".html"]')
                print(f"[Elefant] Elemente găsite: {len(items)}")

                for item in items:
                    title = item.get_text(strip=True) or item.get('title')
                    url_prod = item.get('href')

                    if not title or len(title) < 3:
                        continue
                    if "audiobook" in title.lower():
                        continue

                    if not self._is_relevant(title, None, query):
                        continue

                    if url_prod and not url_prod.startswith('http'):
                        url_prod = f"https://www.elefant.ro{url_prod}"

                    offers.append(BookOffer(
                        store=self.name,
                        title=title,
                        author=None,
                        price=None,
                        currency="RON",
                        available=True,
                        url=url_prod,
                    ))
        except Exception as e:
            print(f"[Elefant Error]: {e}")

        seen = set()
        unique_offers = []
        for o in offers:
            if o.url not in seen:
                seen.add(o.url)
                unique_offers.append(o)

        return unique_offers[:10]
