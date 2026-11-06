# Ehitusjuhis

Iseseisev infoleht, mis selgitab lihtsas keeles, kuidas ehitise andmeid korrastada ja väikeehituse dokumente ette valmistada. Ei ole seotud ehitisregistri ega riigiasutustega.

## Struktuur
- `index.html` – avaleht
- `kontroll.html`, `kontroll.js` – loakontroll (EhS lisa 1)
- `soojustus.html`, `soojustus.js` – soojustuse kalkulaator (U-arv EVS-EN ISO 6946, temperatuurijaotus, Glaseri kondensaadikontroll)
- `tala.html`, `tala.js` – tala kalkulaator (sisejõud jäikusmeetodiga, teras EVS-EN 1993-1-1, puit EVS-EN 1995-1-1)
- `style.css` – kujundus
- `img/` – logo, favicon ja avalehe kaanepilt (WebP + JPG, 960 ja 1920 px)

Staatiline sait, build-sammu pole vaja.

## Avaldamine (Cloudflare Pages)
Iga push `main` harusse avaldab saidi automaatselt.
