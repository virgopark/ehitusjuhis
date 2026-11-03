# Ehituse abileht

Veebileht, mis aitab ehitusalase taustata inimestel teha lihtsamaid ehitisregistri (EHR) andmemuudatusi ja koostada lihtsamaid dokumente.

## Struktuur
- `index.html` – avaleht
- `style.css` – kujundus

Staatiline sait, build-sammu pole vaja.

## Avaldamine (Cloudflare Pages)
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → vali see repo.
2. Build command: *(tühi)*, Output directory: `/`
3. Iga push `main` harusse avaldab saidi automaatselt.
