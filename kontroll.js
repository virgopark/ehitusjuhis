// Ehitusseadustik, lisa 1 – hoonete tabel (RT I, 11.07.2026, 3, jõust. 01.08.2026)
// "-" = puudub, "E" = ehitusteatis, "EP" = ehitusteatis ja ehitusprojekt, "L" = ehitusluba
const TEGEVUSED = ["pystitamine", "tehno", "kuni33", "yle33", "asendamine", "lammutamine"];

const TABEL = {
  elamu: {
    A: ["-", "-", "-", "-", "-", "-"],
    B: ["EP", "E", "E", "EP", "-", "EP"],
    C: ["L", "EP", "EP", "L", "-", "EP"],
    D: ["L", "EP", "EP", "L", "-", "EP"],
  },
  muu: {
    A: ["-", "-", "-", "-", "-", "-"],
    B: ["EP", "EP", "EP", "EP", "-", "EP"],
    C: ["L", "EP", "EP", "L", "-", "L"],
    D: ["L", "EP", "L", "L", "-", "L"],
  },
};

const KATEGOORIA = {
  A: "ehitisealune pind 0–20 m² ja kuni 5 m kõrge",
  B: "ehitisealune pind 20–60 m² ja kuni 5 m kõrge",
  C: "ehitisealune pind 0–60 m² ja üle 5 m kõrge",
  D: "ehitisealune pind üle 60 m²",
};

const LIIK = {
  elamu: "üksik- või kaksikelamu (kood 11100 ja 11210) või selle abihoone",
  muu: "muu elamu või mitteelamu",
};

const TEGEVUS_NIMI = {
  pystitamine: "püstitamine",
  tehno: "ümberehitamine ainult tehnosüsteemi osas",
  kuni33: "ümberehitamine või laiendamine kuni 33%",
  yle33: "laiendamine üle 33%",
  asendamine: "üksiku osa asendamine samaväärsega",
  lammutamine: "lammutamine",
};

const TULEMUS = {
  "-": {
    klass: "ok",
    pealkiri: "Ehitusteatist ega ehitusluba pole vaja",
    selgitus: `
      <p>Lisa 1 järgi ei pea selle töö jaoks esitama ehitusteatist ega ehitusprojekti ega taotlema ehitusluba. Seda nimetatakse sageli <em>vabaks ehitustegevuseks</em>.</p>
      <p><strong>Mida see tähendab:</strong> kohalikku omavalitsust ei pea teavitama, kuid ehitis peab ikkagi vastama nõuetele: olema ohutu, järgima planeeringut (nt hoonestusala, kõrgus), tuleohutuskaugusi ja naabrite õigusi. Kui ala on muinsus- või looduskaitse all või jääb ranna- või kaldaalale, võivad teised seadused nõuda eraldi kooskõlastust või luba.</p>`,
    sammud: [
      "Kontrolli planeeringust (detail- või üldplaneering), kas hoone sobib kavandatud kohta.",
      "Hoia naaberhoonetest tuleohutuskaugus või kasuta vastavaid tuleohutuslahendusi.",
      "Kui sa pole kindel, kas alal kehtivad lisapiirangud, küsi enne alustamist omavalitsuselt.",
    ],
  },
  E: {
    klass: "info",
    pealkiri: "Vaja on ehitusteatist",
    selgitus: `
      <p><strong>Ehitusteatis</strong> on kohalikule omavalitsusele esitatav teade ehitamise kohta. See esitatakse ehitisregistri kaudu enne tööde algust (ehitusseadustik § 36).</p>
      <p><strong>Mida see tähendab:</strong> luba ei pea ootama. Kui omavalitsus ei teata 10 päeva jooksul pärast teatise esitamist, et tal on vaja andmeid täiendavalt kontrollida, võib ehitamisega alustada. Omavalitsus võib vajadusel seada töödele nõudeid. Ehitusprojekti selle tegevuse puhul lisama ei pea.</p>`,
    sammud: [
      "Esita ehitusteatis ehitisregistris (ehr.ee), sisenedes ID-kaardi, Mobiil-ID või Smart-ID-ga.",
      "Kirjelda teatises lühidalt, mida ja kus teed.",
      "Oota 10 päeva. Kui omavalitsus ei võta ühendust, võid alustada.",
    ],
  },
  EP: {
    klass: "info",
    pealkiri: "Vaja on ehitusteatist ja ehitusprojekti",
    selgitus: `
      <p><strong>Ehitusteatis</strong> esitatakse kohalikule omavalitsusele ehitisregistri kaudu enne tööde algust. Selle juurde lisatakse <strong>ehitusprojekt</strong>, mis kirjeldab joonistel ja tekstis, mida ehitatakse (ehitusseadustik § 36 ja lisa 1).</p>
      <p><strong>Mida see tähendab:</strong> luba ei pea ootama. Kui omavalitsus ei teata 10 päeva jooksul, et tal on vaja andmeid täiendavalt kontrollida, võib alustada. Ehitusteatise juurde käiva projekti võib omanik koostada ka ise. Projekt peab sel juhul olema asjatundlik ja vastama ehitusprojektile esitatavatele nõuetele (asendiplaan, plaanid, vaated, lõige ja lühike seletuskiri).</p>`,
    sammud: [
      "Koosta või telli ehitusprojekt: asendiplaan, korruseplaan, vaated, lõige ja seletuskiri.",
      "Esita ehitusteatis koos projektiga ehitisregistris (ehr.ee).",
      "Oota 10 päeva. Kui omavalitsus ei võta ühendust, võid alustada.",
    ],
  },
  L: {
    klass: "warn",
    pealkiri: "Vaja on ehitusluba",
    selgitus: `
      <p><strong>Ehitusluba</strong> on kohaliku omavalitsuse otsus, mis annab õiguse ehitada ehitusloa aluseks oleva ehitusprojekti järgi (ehitusseadustik § 38). Luba taotletakse ehitisregistri kaudu ja taotlusele lisatakse ehitusprojekt.</p>
      <p><strong>Mida see tähendab:</strong> enne loa saamist ehitada ei tohi. Omavalitsus peab loa andma 30 päeva jooksul nõuetekohase taotluse esitamisest (§ 42 lg 5). Projekt peab olema põhjalikum ja selle koostab tavaliselt pädev projekteerija. Kui alal puudub detailplaneering, võib enne projekteerimist olla vaja taotleda projekteerimistingimusi. Taotluse eest tasutakse riigilõivu.</p>`,
    sammud: [
      "Uuri omavalitsusest, kas alal kehtib detailplaneering või on vaja projekteerimistingimusi.",
      "Telli ehitusprojekt pädevalt projekteerijalt.",
      "Esita ehitisregistris ehitusloa taotlus koos projektiga ja tasu riigilõiv.",
      "Alusta ehitamist alles pärast ehitusloa saamist.",
    ],
  },
};

function kategooria(pind, yle5) {
  if (yle5) return pind <= 60 ? "C" : "D";
  if (pind <= 20) return "A";
  if (pind <= 60) return "B";
  return "D";
}

const vorm = document.getElementById("kontroll");
const tulemus = document.getElementById("tulemus");
const viga = document.getElementById("viga");
const pindHint = document.getElementById("pind-hint");

vorm.addEventListener("change", (e) => {
  if (e.target.name === "tegevus") {
    pindHint.innerHTML = e.target.value === "lammutamine"
      ? "Lammutatava hoone praegune pind maapinnal koos välisseintega (välismõõtude järgi), m²."
      : "Hoone pind maapinnal koos välisseintega (välismõõtude järgi), m². Ehitamise korral sisesta pind <strong>pärast töid</strong>.";
  }
});

vorm.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(vorm);
  const liik = d.get("liik");
  const tegevus = d.get("tegevus");
  const korgus = d.get("korgus");
  const pindStr = String(d.get("pind") || "").replace(",", ".");
  const pind = parseFloat(pindStr);

  const puudu = [];
  if (!liik) puudu.push("hoone liik");
  if (!tegevus) puudu.push("tegevus");
  if (!pindStr || isNaN(pind) || pind < 0) puudu.push("ehitisealune pind");
  if (!korgus) puudu.push("kõrgus");
  if (puudu.length) {
    viga.textContent = "Palun täida: " + puudu.join(", ") + ".";
    viga.hidden = false;
    tulemus.hidden = true;
    return;
  }
  viga.hidden = true;

  const kat = kategooria(pind, korgus === "yle5");
  const kood = TABEL[liik][kat][TEGEVUSED.indexOf(tegevus)];
  const t = TULEMUS[kood];

  let lisa = "";
  if (tegevus === "lammutamine" && kood === "EP") {
    lisa = `<p class="extra">Lammutamise puhul on ehitusprojektiks lammutamise kirjeldus: mida ja kuidas lammutatakse, kuidas tagatakse ohutus ning kuhu lähevad jäätmed.</p>`;
  }
  if (tegevus === "asendamine") {
    lisa = `<p class="extra">Kui asendus muudab hoone kandekonstruktsioone, välisilmet või tehnosüsteemi omadusi, ei ole tegu samaväärse asendusega. Siis vali „Ümberehitamine“.</p>`;
  }
  if (tegevus === "kuni33" || tegevus === "yle33") {
    lisa += `<p class="extra">Kontrolli ka piiri 33% juures: kui laiendus on 33% lähedal, arvuta see hoolikalt või küsi omavalitsuselt, kumba kategooriasse töö kuulub.</p>`;
  }

  tulemus.className = "result " + t.klass;
  tulemus.innerHTML = `
    <p class="result-label">Tulemus</p>
    <h2>${t.pealkiri}</h2>
    <p class="result-basis">Sinu valik: <strong>${LIIK[liik]}</strong>, ${KATEGOORIA[kat]} · tegevus: <strong>${TEGEVUS_NIMI[tegevus]}</strong></p>
    ${t.selgitus}
    ${lisa}
    <h3>Järgmised sammud</h3>
    <ol>${t.sammud.map((s) => `<li>${s}</li>`).join("")}</ol>
    <p class="result-foot">See on seaduse tabelil põhinev üldine hinnang, mitte ametlik otsus. Kahtluse korral küsi oma kohaliku omavalitsuse ehitusspetsialistilt.</p>`;
  tulemus.hidden = false;
  tulemus.scrollIntoView({ behavior: "smooth", block: "start" });
});
