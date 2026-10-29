from urllib.parse import quote
import httpx
from bs4 import BeautifulSoup
from app.models import BookOffer
from app.scrapers.base import BookStoreScraper

class CarturestiScraper(BookStoreScraper):
    name = "carturesti"

    async def search(self, query: str, browser=None) -> list[BookOffer]:
        offers: list[BookOffer] = []
        url = f"https://carturesti.ro/product/search/{quote(query)}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    return offers
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                cards = soup.select('div.card, div[class*="prod"], article, li.product, .md-card')
                if not cards:
                    cards = soup.find_all(lambda tag: tag.name in ['div', 'article'] and tag.find('h5') and tag.find('a'))

                for card in cards:
                    title_el = card.select_one('h5, h4, h3, .title, a[title]')
                    author_el = card.select_one('a[href*="/autor/"], .author, .subtitlu-produs')
                    price_el = card.select_one('.suma, .price, span[content]')
                    link_el = card.select_one('a[href*="/carte/"], a.select-item-event, a')

                    title = title_el.get_text(strip=True) if title_el else None
                    if not title or len(title) < 2:
                        continue

                    author = author_el.get_text(strip=True) if author_el else None
                    
                    price = None
                    if price_el:
                        try:
                            raw = price_el.get('content') or price_el.get_text(strip=True)
                            raw_clean = ''.join(c for c in raw if c.isdigit() or c == '.')
                            price = float(raw_clean) if raw_clean else None
                        except:
                            pass

                    url_prod = link_el.get('href') if link_el else None
                    if url_prod and not url_prod.startswith('http'):
                        url_prod = f"https://carturesti.ro{url_prod}"

                    if not self._is_relevant(title, author, query):
                        continue

                    offers.append(BookOffer(
                        store=self.name,
                        title=title,
                        author=author,
                        price=price,
                        currency="RON",
                        available=True,
                        url=url_prod,
                    ))
        except Exception as e:
            print(f"[Cărturești Error]: {e}")

        seen = set()
        unique_offers = []
        for o in offers:
            if o.url not in seen:
                seen.add(o.url)
                unique_offers.append(o)

        unique_offers.sort(key=lambda o: (o.price is None, o.price))
        return unique_offers
