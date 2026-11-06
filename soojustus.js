// Ehitusjuhis – soojustuse kalkulaator
// U-arv EVS-EN ISO 6946 järgi (sh mittehomogeensed kihid ülem-/alampiiri meetodil),
// temperatuurijaotus ja lihtsustatud kondensatsioonikontroll (Glaseri meetod, EVS-EN ISO 13788 põhimõttel).
// Materjalide väärtused on üldised arvutuslikud väärtused, mitte tootepõhised.

(() => {
  "use strict";

  // ---------- Materjalid ----------
  // tyyp: "tavaline" | "membraan" (sd fikseeritud) | "ohk" (suletud õhkvahe) | "tuulutatud"
  const MATERJALID = [
    { grupp: "Soojustus", id: "klaasvill", nimi: "Klaasvill (plaat/rull)", l: 0.037, mu: 1, d: 150, v: "#f4d35e" },
    { grupp: "Soojustus", id: "kivivill", nimi: "Kivivill (plaat)", l: 0.036, mu: 1, d: 150, v: "#e9c46a" },
    { grupp: "Soojustus", id: "puistevill", nimi: "Puistevill (tselluloos)", l: 0.040, mu: 1.5, d: 300, v: "#d9c3a0" },
    { grupp: "Soojustus", id: "mpuistevill", nimi: "Puistevill (mineraal)", l: 0.045, mu: 1, d: 300, v: "#efd88f" },
    { grupp: "Soojustus", id: "puitkiudsoojustus", nimi: "Puitkiudsoojustus (plaat)", l: 0.040, mu: 3, d: 100, v: "#c8a36b" },
    { grupp: "Soojustus", id: "eps", nimi: "EPS (vahtpolüstüreen)", l: 0.036, mu: 40, d: 100, v: "#f1f1f1" },
    { grupp: "Soojustus", id: "eps_gr", nimi: "Grafiidiga EPS", l: 0.031, mu: 40, d: 100, v: "#9aa0a6" },
    { grupp: "Soojustus", id: "xps", nimi: "XPS (ekstrudeeritud vahtpolüstüreen)", l: 0.035, mu: 100, d: 100, v: "#a8d0e6" },
    { grupp: "Soojustus", id: "pir", nimi: "PIR/PUR plaat", l: 0.023, mu: 60, d: 100, v: "#e0e0b8" },
    { grupp: "Soojustus", id: "saepuru", nimi: "Saepuru (vana täide)", l: 0.09, mu: 2, d: 200, v: "#d4b483" },
    { grupp: "Soojustus", id: "kergkruus", nimi: "Kergkruus (puiste)", l: 0.11, mu: 2, d: 200, v: "#b5651d" },

    { grupp: "Puit ja plaadid", id: "puit", nimi: "Okaspuit (laudis, prussid, palk)", l: 0.13, mu: 40, d: 22, v: "#c19a6b" },
    { grupp: "Puit ja plaadid", id: "vineer", nimi: "Vineer", l: 0.13, mu: 100, d: 12, v: "#d2a86e" },
    { grupp: "Puit ja plaadid", id: "osb", nimi: "OSB-plaat", l: 0.13, mu: 150, d: 12, v: "#caa472" },
    { grupp: "Puit ja plaadid", id: "laastplaat", nimi: "Puitlaastplaat", l: 0.14, mu: 50, d: 16, v: "#d8b98c" },
    { grupp: "Puit ja plaadid", id: "kiudtuuletoke", nimi: "Puitkiud-tuuletõkkeplaat", l: 0.050, mu: 5, d: 25, v: "#a47148" },
    { grupp: "Puit ja plaadid", id: "kips", nimi: "Kipsplaat", l: 0.25, mu: 10, d: 13, v: "#e6e6e6" },
    { grupp: "Puit ja plaadid", id: "kipstuuletoke", nimi: "Tuuletõkke-kipsplaat", l: 0.25, mu: 10, d: 9, v: "#d6d0c4" },
    { grupp: "Puit ja plaadid", id: "kipskiud", nimi: "Kipskiudplaat", l: 0.32, mu: 13, d: 12.5, v: "#ddd" },

    { grupp: "Müüritis ja betoon", id: "raudbetoon", nimi: "Raudbetoon", l: 2.5, mu: 100, d: 150, v: "#9e9e9e" },
    { grupp: "Müüritis ja betoon", id: "betoon", nimi: "Betoon", l: 2.0, mu: 100, d: 150, v: "#a9a9a9" },
    { grupp: "Müüritis ja betoon", id: "gaasbetoon", nimi: "Gaasbetoonplokk (~400 kg/m³)", l: 0.12, mu: 6, d: 300, v: "#e8e4dc" },
    { grupp: "Müüritis ja betoon", id: "kergkruusplokk", nimi: "Kergkruusbetoonplokk", l: 0.25, mu: 6, d: 250, v: "#a1887f" },
    { grupp: "Müüritis ja betoon", id: "tellis", nimi: "Keraamiline täistellis", l: 0.65, mu: 10, d: 250, v: "#b5533c" },
    { grupp: "Müüritis ja betoon", id: "silikaat", nimi: "Silikaattellis", l: 0.9, mu: 20, d: 250, v: "#e0dbd0" },
    { grupp: "Müüritis ja betoon", id: "maakivi", nimi: "Maakivi (graniit)", l: 2.8, mu: 10000, d: 400, v: "#7d7d7d" },

    { grupp: "Krohv", id: "lubikrohv", nimi: "Lubikrohv", l: 0.8, mu: 10, d: 15, v: "#f3efe6" },
    { grupp: "Krohv", id: "tsementkrohv", nimi: "Lubi-tsementkrohv", l: 1.0, mu: 25, d: 15, v: "#dcd8cf" },
    { grupp: "Krohv", id: "savikrohv", nimi: "Savikrohv", l: 0.8, mu: 8, d: 20, v: "#c9a27e" },

    { grupp: "Kiled ja membraanid", id: "aurutoke", nimi: "Aurutõkkekile (PE)", tyyp: "membraan", l: 0.4, sd: 80, d: 0.2, v: "#4a7bd0" },
    { grupp: "Kiled ja membraanid", id: "tuuletoke", nimi: "Tuuletõkkemembraan (difusioonavatud)", tyyp: "membraan", l: 0.4, sd: 0.02, d: 0.5, v: "#5fa8d3" },
    { grupp: "Kiled ja membraanid", id: "aluskate", nimi: "Katuse aluskate (difusioonavatud)", tyyp: "membraan", l: 0.4, sd: 0.05, d: 0.5, v: "#3a6ea5" },

    { grupp: "Õhkvahe", id: "ohk", nimi: "Suletud (tuulutamata) õhkvahe", tyyp: "ohk", l: null, mu: 1, d: 25, v: "#ffffff" },
    { grupp: "Õhkvahe", id: "tuulutatud", nimi: "Tuulutatud õhkvahe", tyyp: "tuulutatud", l: null, mu: 1, d: 25, v: "#ffffff" },

    { grupp: "Muu", id: "oma", nimi: "Oma materjal (sisesta ise)", l: 0.1, mu: 10, d: 50, v: "#cfd8dc" },
  ];
  const MAT = Object.fromEntries(MATERJALID.map((m) => [m.id, m]));

  // Karkassi materjalid (mittehomogeenne kiht)
  const KARKASS = {
    puit: { nimi: "Puit (karkass)", l: 0.13, mu: 40 },
    terasprofiil: { nimi: "Õhuke teras­profiil (umbkaudne)", l: 2.0, mu: 1e6 },
  };

  // ---------- Tarindi tüübid ----------
  // Rsi, Rse – EVS-EN ISO 6946 tabel 7
  const TYYBID = {
    sein: { nimi: "Välissein", rsi: 0.13, rse: 0.04, suund: "h", siht: [0.12, 0.22] },
    katus: { nimi: "Katus või pööningulagi", rsi: 0.10, rse: 0.04, suund: "y", siht: [0.10, 0.15] },
    porand: { nimi: "Põrand välisõhu kohal", rsi: 0.17, rse: 0.04, suund: "a", siht: [0.10, 0.15] },
  };

  // Suletud õhkvahe soojustakistus (EVS-EN ISO 6946 tabel 8), d mm -> R
  const OHK_TABEL = {
    h: [[0, 0], [5, 0.11], [7, 0.13], [10, 0.15], [15, 0.17], [25, 0.18], [300, 0.18]],
    y: [[0, 0], [5, 0.11], [7, 0.13], [10, 0.15], [15, 0.16], [25, 0.16], [300, 0.16]],
    a: [[0, 0], [5, 0.11], [7, 0.13], [10, 0.15], [15, 0.17], [25, 0.19], [50, 0.21], [100, 0.22], [300, 0.23]],
  };
  function ohkR(dmm, suund) {
    const t = OHK_TABEL[suund];
    if (dmm >= t[t.length - 1][0]) return t[t.length - 1][1];
    for (let i = 1; i < t.length; i++) {
      if (dmm <= t[i][0]) {
        const [x0, y0] = t[i - 1], [x1, y1] = t[i];
        return y0 + ((y1 - y0) * (dmm - x0)) / (x1 - x0);
      }
    }
    return 0;
  }

  // ---------- Näited ----------
  const NAITED = {
    karkass: {
      nimi: "Puitkarkass-sein 200 mm",
      tyyp: "sein",
      kihid: [
        { m: "kips", d: 13 },
        { m: "puit", d: 22, nimi: "Paigalduslaud", karkass: { m: "puit", laius: 22, samm: 600 }, alus: "ohk" },
        { m: "aurutoke", d: 0.2 },
        { m: "klaasvill", d: 200, karkass: { m: "puit", laius: 45, samm: 600 } },
        { m: "kipstuuletoke", d: 9 },
        { m: "tuulutatud", d: 25 },
        { m: "puit", d: 22 },
      ],
    },
    gaasbetoon: {
      nimi: "Gaasbetoonsein + 100 mm lisasoojustus",
      tyyp: "sein",
      kihid: [
        { m: "lubikrohv", d: 10 },
        { m: "gaasbetoon", d: 300 },
        { m: "kivivill", d: 100 },
        { m: "tsementkrohv", d: 10 },
      ],
    },
    poonin: {
      nimi: "Pööningulagi puistevillaga",
      tyyp: "katus",
      kihid: [
        { m: "kips", d: 13 },
        { m: "aurutoke", d: 0.2 },
        { m: "klaasvill", d: 200, karkass: { m: "puit", laius: 50, samm: 600 } },
        { m: "puistevill", d: 200 },
        { m: "tuulutatud", d: 100 },
      ],
    },
  };

  // ---------- Olek ----------
  let tyyp = "sein";
  let kihid = [];
  let uid = 0;

  function uusKiht(mid, d, lisa = {}) {
    const m = MAT[mid];
    return {
      id: ++uid,
      m: mid,
      d: d ?? m.d,
      l: m.l,
      mu: m.mu ?? null,
      sd: m.sd ?? null,
      karkass: lisa.karkass ? { m: lisa.karkass.m, laius: lisa.karkass.laius, samm: lisa.karkass.samm } : null,
      alus: lisa.alus || null, // karkassi vahe täide: kui "ohk", siis karkassi vahel on õhk
    };
  }

  function laadiNaide(key) {
    const n = NAITED[key];
    tyyp = n.tyyp;
    kihid = n.kihid.map((k) => {
      if (k.alus === "ohk") {
        // karkassiga õhkvahe (paigaldusvahe): põhimaterjal = suletud õhkvahe, karkass puit
        return uusKiht("ohk", k.d, { karkass: k.karkass });
      }
      return uusKiht(k.m, k.d, k);
    });
    document.querySelector(`input[name="tyyp"][value="${tyyp}"]`).checked = true;
    joonistaKihid();
    arvuta();
  }

  // ---------- Abifunktsioonid ----------
  const $ = (s, el = document) => el.querySelector(s);
  const num = (v) => {
    const x = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(x) ? x : NaN;
  };
  const fmt = (x, k = 2) =>
    Number.isFinite(x) ? x.toLocaleString("et-EE", { minimumFractionDigits: k, maximumFractionDigits: k }) : "–";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Küllastusrõhk Pa (EVS-EN ISO 13788)
  function psat(t) {
    return t >= 0 ? 610.5 * Math.exp((17.269 * t) / (237.3 + t)) : 610.5 * Math.exp((21.875 * t) / (265.5 + t));
  }
  // Kastepunkt (pöördfunktsioon)
  function kastepunkt(p) {
    const a = Math.log(p / 610.5);
    const t = (237.3 * a) / (17.269 - a);
    if (t >= 0) return t;
    return (265.5 * a) / (21.875 - a);
  }

  // ---------- Kihi füüsikalised suurused ----------
  function kihiAndmed(k) {
    const m = MAT[k.m];
    const dm = k.d / 1000;
    let R;
    if (m.tyyp === "ohk") R = ohkR(k.d, TYYBID[tyyp].suund);
    else R = k.l > 0 ? dm / k.l : NaN;

    let sd;
    if (m.tyyp === "membraan") sd = k.sd;
    else sd = (k.mu ?? 1) * dm;

    let f = 0, Rk = null, sdK = null;
    if (k.karkass && k.karkass.samm > 0 && k.karkass.laius > 0) {
      f = Math.min(1, k.karkass.laius / k.karkass.samm);
      const km = KARKASS[k.karkass.m];
      Rk = dm / km.l;
      sdK = km.mu * dm;
    }
    // Ekvivalentne kiht (alampiir): paralleelsed juhtivused
    const Req = f > 0 ? 1 / ((1 - f) / R + f / Rk) : R;
    return { m, R, Rk, f, Req, sd, sdK };
  }

  // ---------- Põhiarvutus ----------
  function arvutaTulemus(ti, phii, te, phie) {
    const T = TYYBID[tyyp];
    const vigu = [];
    if (!kihid.length) return { viga: "Lisa vähemalt üks kiht." };

    // Tuulutatud õhkvahe: sellest väljapoole jäävad kihid jäetakse arvestamata, Rse = Rsi (ISO 6946 p 6.9)
    let vIdx = kihid.findIndex((k) => MAT[k.m].tyyp === "tuulutatud");
    const tuulutus = vIdx >= 0;
    const eff = tuulutus ? kihid.slice(0, vIdx) : kihid.slice();
    const rse = tuulutus ? T.rsi : T.rse;
    if (!eff.length) return { viga: "Tuulutatud õhkvahe on kõige siseküljel – lisa selle sisse soojustavad kihid." };

    const andmed = eff.map(kihiAndmed);
    for (let i = 0; i < eff.length; i++) {
      const a = andmed[i];
      if (!(eff[i].d > 0)) return { viga: `Kihi ${i + 1} paksus peab olema suurem kui 0.` };
      if (!Number.isFinite(a.R)) return { viga: `Kihi ${i + 1} soojuserijuhtivus λ peab olema suurem kui 0.` };
    }

    // Alampiir R'' (kihtide kaupa ekvivalentne)
    const Rlow = T.rsi + andmed.reduce((s, a) => s + a.Req, 0) + rse;

    // Ülempiir R' (paralleelsed lõiked; karkassid eeldatakse joondatuks ühest servast)
    const piirid = [...new Set([0, 1, ...andmed.filter((a) => a.f > 0).map((a) => a.f)])].sort((x, y) => x - y);
    let Uup = 0;
    for (let s = 0; s < piirid.length - 1; s++) {
      const a0 = piirid[s], a1 = piirid[s + 1];
      if (a1 - a0 <= 0) continue;
      let R = T.rsi + rse;
      for (const a of andmed) R += a.f > a0 ? a.Rk : a.R;
      Uup += (a1 - a0) / R;
    }
    const Rup = 1 / Uup;
    const RT = (Rup + Rlow) / 2;
    const U = 1 / RT;
    const veaPiir = (Rup - Rlow) / (2 * RT);

    // Temperatuurijaotus (ekvivalentsete kihtide järgi)
    const q = (ti - te) / Rlow;
    const piirTemp = [ti - q * T.rsi]; // sisepind
    let x = 0;
    const xPiir = [0]; // mm
    for (const [i, a] of andmed.entries()) {
      piirTemp.push(piirTemp[piirTemp.length - 1] - q * a.Req);
      x += eff[i].d;
      xPiir.push(x);
    }
    const tsi = piirTemp[0];
    const tse = piirTemp[piirTemp.length - 1];

    // Glaser (soojustuse vahelt; karkassi sd ei arvestata)
    const sdPiir = [0];
    for (const a of andmed) sdPiir.push(sdPiir[sdPiir.length - 1] + a.sd);
    const sdTot = sdPiir[sdPiir.length - 1];
    const pi = phii / 100 * psat(ti);
    const pe = phie / 100 * psat(te);
    const ps = piirTemp.map(psat);

    // p-joon: "pingul nöör" küllastusrõhu all
    const p = new Array(ps.length).fill(null);
    p[0] = Math.min(pi, ps[0]);
    const kondPinnad = [];
    let c = 0;
    let pc = p[0];
    const pinnaKond = pi > ps[0];
    while (c < ps.length - 1) {
      let best = -1, bestSlope = Infinity;
      for (let j = c + 1; j < ps.length; j++) {
        const dx = sdPiir[j] - sdPiir[c];
        const target = j === ps.length - 1 ? Math.min(pe, ps[j]) : ps[j];
        if (dx <= 1e-9) {
          if (target < pc) { best = j; bestSlope = -Infinity; break; }
          continue;
        }
        const sl = (target - pc) / dx;
        if (sl < bestSlope - 1e-12 || (Math.abs(sl - bestSlope) < 1e-12 && j > best)) { bestSlope = sl; best = j; }
      }
      if (best < 0) best = ps.length - 1;
      const target = best === ps.length - 1 ? Math.min(pe, ps[best]) : ps[best];
      // täida vahepealsed punktid lineaarselt sd järgi
      for (let j = c + 1; j <= best; j++) {
        const dx = sdPiir[best] - sdPiir[c];
        p[j] = dx > 1e-9 ? pc + ((target - pc) * (sdPiir[j] - sdPiir[c])) / dx : target;
      }
      if (best < ps.length - 1) kondPinnad.push(best);
      c = best;
      pc = target;
    }

    // Kondensaadi hulk tasanditel g = δ0·(Δp_sisse/sd − Δp_välja/sd)
    const d0 = 2e-10; // kg/(m·s·Pa)
    const kond = kondPinnad.map((j) => {
      // leia eelmine ja järgmine "murdepunkt"
      const eel = [0, ...kondPinnad].filter((k) => k < j).pop();
      const jarg = [...kondPinnad, ps.length - 1].find((k) => k > j);
      const sisse = (p[eel] - p[j]) / Math.max(sdPiir[j] - sdPiir[eel], 1e-9);
      const valja = (p[j] - p[jarg]) / Math.max(sdPiir[jarg] - sdPiir[j], 1e-9);
      const g = d0 * (sisse - valja) * 86400 * 1000; // g/(m²·ööpäev)
      return { j, g, t: piirTemp[j] };
    });

    // Sise- ja väliskeskkonna sd suhe
    const sdSise = andmed.slice(0, Math.ceil(andmed.length / 2)).reduce((s, a) => s + a.sd, 0);

    if (tuulutus && vIdx < kihid.length - 1) {
      vigu.push("Tuulutatud õhkvahe ja sellest väljapoole jäävad kihid (nt voodrilaud) U-arvu ei arvestata – nii näeb ette ISO 6946.");
    }

    return {
      U, RT, Rup, Rlow, veaPiir, rse, rsi: T.rsi, tuulutus, eff, andmed,
      piirTemp, xPiir, tsi, tse, ps, p, pi, pe, sdPiir, sdTot, kond, pinnaKond, sdSise, vigu,
      kastep: kastepunkt(pi), ti, te,
    };
  }

  // ---------- UI: kihid ----------
  function materjalSelect(sel) {
    let html = "";
    let grupp = null;
    for (const m of MATERJALID) {
      if (m.grupp !== grupp) {
        if (grupp) html += "</optgroup>";
        html += `<optgroup label="${esc(m.grupp)}">`;
        grupp = m.grupp;
      }
      html += `<option value="${m.id}"${m.id === sel ? " selected" : ""}>${esc(m.nimi)}</option>`;
    }
    return html + "</optgroup>";
  }

  function joonistaKihid() {
    const box = $("#kihid");
    box.innerHTML = kihid
      .map((k, i) => {
        const m = MAT[k.m];
        const onMembraan = m.tyyp === "membraan";
        const onOhk = m.tyyp === "ohk" || m.tyyp === "tuulutatud";
        const muVali = onMembraan
          ? `<label class="fld"><span>s<sub>d</sub>, m</span><input type="number" step="any" min="0" data-f="sd" value="${k.sd}"></label>`
          : `<label class="fld"><span>μ</span><input type="number" step="any" min="0" data-f="mu" value="${k.mu ?? ""}"${onOhk ? " disabled" : ""}></label>`;
        const lVali = onOhk
          ? `<label class="fld"><span>λ, W/(m·K)</span><input type="text" value="${m.tyyp === "ohk" ? "tabelist" : "–"}" disabled></label>`
          : `<label class="fld"><span>λ, W/(m·K)</span><input type="number" step="any" min="0" data-f="l" value="${k.l}"></label>`;
        const kk = k.karkass;
        return `
        <div class="layer" data-id="${k.id}" style="--sw:${m.v}">
          <div class="layer-top">
            <span class="layer-no">${i + 1}</span>
            <select data-f="m" aria-label="Materjal">${materjalSelect(k.m)}</select>
            <div class="layer-btns">
              <button type="button" data-a="ules" title="Liiguta siseküljele" ${i === 0 ? "disabled" : ""}>↑</button>
              <button type="button" data-a="alla" title="Liiguta välisküljele" ${i === kihid.length - 1 ? "disabled" : ""}>↓</button>
              <button type="button" data-a="kopeeri" title="Kopeeri">⧉</button>
              <button type="button" data-a="kustuta" title="Kustuta">✕</button>
            </div>
          </div>
          <div class="layer-fields">
            <label class="fld"><span>Paksus, mm</span><input type="number" step="any" min="0" data-f="d" value="${k.d}"></label>
            ${lVali}
            ${muVali}
            <div class="fld out"><span>R, m²K/W</span><output data-o="R">–</output></div>
          </div>
          ${m.tyyp === "tuulutatud" ? "" : `
          <label class="frame-toggle"><input type="checkbox" data-f="karkass" ${kk ? "checked" : ""}> Kihis on karkass (nt puitpostid soojustuse vahel)</label>
          ${kk ? `
          <div class="layer-fields frame">
            <label class="fld"><span>Karkass</span><select data-f="km">${Object.entries(KARKASS).map(([id, x]) => `<option value="${id}"${id === kk.m ? " selected" : ""}>${esc(x.nimi)}</option>`).join("")}</select></label>
            <label class="fld"><span>Posti laius, mm</span><input type="number" step="any" min="0" data-f="kl" value="${kk.laius}"></label>
            <label class="fld"><span>Samm (telgede vahe), mm</span><input type="number" step="any" min="0" data-f="ks" value="${kk.samm}"></label>
            <div class="fld out"><span>Karkassi osa</span><output data-o="f">–</output></div>
          </div>` : ""}`}
        </div>`;
      })
      .join("");
  }

  function kihtElemendist(el) {
    const id = +el.closest(".layer").dataset.id;
    return kihid.findIndex((k) => k.id === id);
  }

  function onSisend(e) {
    const t = e.target;
    const f = t.dataset.f;
    if (!f) return;
    const i = kihtElemendist(t);
    const k = kihid[i];
    if (f === "m") {
      const m = MAT[t.value];
      const vana = MAT[k.m];
      k.m = t.value;
      k.l = m.l;
      k.mu = m.mu ?? null;
      k.sd = m.sd ?? null;
      // paksus: säilita, kui tüüp sama ja paksus mõistlik; muidu vaikimisi
      if (m.tyyp === "membraan" || vana.tyyp === "membraan" || vana.grupp !== m.grupp) k.d = m.d;
      if (m.tyyp === "tuulutatud") k.karkass = null;
      joonistaKihid();
    } else if (f === "karkass") {
      k.karkass = t.checked ? { m: "puit", laius: 45, samm: 600 } : null;
      joonistaKihid();
    } else if (f === "km") {
      k.karkass.m = t.value;
    } else if (f === "kl") {
      k.karkass.laius = num(t.value);
    } else if (f === "ks") {
      k.karkass.samm = num(t.value);
    } else {
      k[f] = num(t.value);
    }
    arvuta();
  }

  function onKlikk(e) {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const i = kihtElemendist(b);
    const a = b.dataset.a;
    if (a === "kustuta") kihid.splice(i, 1);
    if (a === "ules" && i > 0) [kihid[i - 1], kihid[i]] = [kihid[i], kihid[i - 1]];
    if (a === "alla" && i < kihid.length - 1) [kihid[i + 1], kihid[i]] = [kihid[i], kihid[i + 1]];
    if (a === "kopeeri") {
      const c = JSON.parse(JSON.stringify(kihid[i]));
      c.id = ++uid;
      kihid.splice(i + 1, 0, c);
    }
    joonistaKihid();
    arvuta();
  }

  // ---------- Tulemuste kuvamine ----------
  function arvuta() {
    const ti = num($("#ti").value), phii = num($("#phii").value);
    const te = num($("#te").value), phie = num($("#phie").value);
    const box = $("#tulemus");
    const r = arvutaTulemus(ti, phii, te, phie);

    // kihtide R väljad
    const effIds = r.eff ? new Set(r.eff.map((k) => k.id)) : new Set();
    document.querySelectorAll(".layer").forEach((el) => {
      const id = +el.dataset.id;
      const k = kihid.find((x) => x.id === id);
      const a = kihiAndmed(k);
      const o = el.querySelector('[data-o="R"]');
      const valjas = r.eff && !effIds.has(id);
      el.classList.toggle("ignored", !!valjas);
      if (o) o.textContent = valjas ? "ei arvestata" : MAT[k.m].tyyp === "tuulutatud" ? "Rse = Rsi" : fmt(a.Req, 3);
      const of = el.querySelector('[data-o="f"]');
      if (of) of.textContent = a.f > 0 ? fmt(a.f * 100, 1) + " %" : "–";
    });

    if (r.viga) {
      box.innerHTML = `<p class="form-error">${esc(r.viga)}</p>`;
      return;
    }
    if (![ti, phii, te, phie].every(Number.isFinite) || ti <= te) {
      box.innerHTML = `<p class="form-error">Kontrolli sise- ja välistingimusi: sisetemperatuur peab olema kõrgem kui välistemperatuur.</p>`;
      return;
    }

    const T = TYYBID[tyyp];
    const [s0, s1] = T.siht;
    let hinnang, klass;
    if (r.U <= s0) { hinnang = `Väga hea soojapidavus – parem kui suunisvahemik (${fmt(s0)}–${fmt(s1)}).`; klass = "ok"; }
    else if (r.U <= s1) { hinnang = `Jääb elamute suunisvahemikku ${fmt(s0)}–${fmt(s1)} W/(m²·K).`; klass = "ok"; }
    else if (r.U <= s1 * 1.5) { hinnang = `Nõrgem kui elamute suunisvahemik ${fmt(s0)}–${fmt(s1)} W/(m²·K). Kaalu paksemat soojustust.`; klass = "info"; }
    else { hinnang = `Tunduvalt nõrgem kui elamute suunisvahemik ${fmt(s0)}–${fmt(s1)} W/(m²·K).`; klass = "warn"; }

    // niiskus
    let niiskus, nKlass;
    if (r.pinnaKond) {
      niiskus = "Sisepinnal on kondensaadi oht – sisepinna temperatuur on madalam kui siseõhu kastepunkt.";
      nKlass = "warn";
    } else if (r.kond.length) {
      const kokku = r.kond.reduce((s, k) => s + k.g, 0);
      niiskus = `Valitud talvetingimustes tekib tarindis kondensaat (umbes ${fmt(kokku, 1)} g/m² ööpäevas). ` +
        r.kond.map((k) => `Kondensatsioonitasand: ${tasandiNimi(r, k.j)} (${fmt(k.t, 1)} °C).`).join(" ");
      nKlass = kokku > 5 ? "warn" : "info";
    } else {
      niiskus = "Valitud talvetingimustes tarindisse kondensaati ei teki (lihtsustatud Glaseri arvutus).";
      nKlass = "ok";
    }

    const fRsi = (r.tsi - r.te) / (r.ti - r.te);

    box.innerHTML = `
      <div class="u-head ${klass}">
        <div>
          <p class="result-label">Soojusläbivus</p>
          <p class="u-big">U = ${fmt(r.U, 3)} <span>W/(m²·K)</span></p>
          <p class="u-sub">Soojustakistus R<sub>T</sub> = ${fmt(r.RT, 2)} m²·K/W</p>
        </div>
        <div class="u-scale">${skaala(r.U, T.siht)}</div>
      </div>
      <p class="u-verdict ${klass}">${esc(hinnang)}</p>
      ${r.veaPiir > 0.0005 ? `<p class="small">Mittehomogeensete kihtide tõttu arvutati ISO 6946 ülem- ja alampiiri keskmine: R′ = ${fmt(r.Rup, 2)}, R″ = ${fmt(r.Rlow, 2)} m²·K/W, suurim suhteline viga ${fmt(r.veaPiir * 100, 1)} %${r.veaPiir > 0.2 ? " – üle 20 %, tulemus on umbkaudne" : ""}.</p>` : ""}
      ${r.vigu.map((v) => `<p class="small">${esc(v)}</p>`).join("")}

      <h3>Temperatuur tarindis</h3>
      ${graafik(r, "t")}
      <p class="small">Sisepinna temperatuur ${fmt(r.tsi, 1)} °C (temperatuuritegur f<sub>Rsi</sub> = ${fmt(fRsi, 2)}), siseõhu kastepunkt ${fmt(r.kastep, 1)} °C.</p>

      <h3>Niiskus (veeaur)</h3>
      <p class="u-verdict ${nKlass}">${esc(niiskus)}</p>
      ${graafik(r, "p")}
      <p class="small">Sinine joon: veeauru osarõhk, punktiir: küllastusrõhk. Kui sinine joon puudutab punktiirjoont, tekib seal kondensaat. Arvutus kehtib ainult valitud püsivates tingimustes – aastane niiskusbilanss ja kuivamine ei ole arvesse võetud. Karkassi kaudu liikuvat niiskust ei arvestata.</p>

      <h3>Kihid</h3>
      ${tabel(r)}
    `;
  }

  function tasandiNimi(r, j) {
    const sise = r.eff[j - 1], valis = r.eff[j];
    const n = (k) => (k ? MAT[k.m].nimi.split(" (")[0].toLowerCase() : "");
    if (sise && valis) return `kihtide ${j} (${n(sise)}) ja ${j + 1} (${n(valis)}) vahel`;
    return `kihi ${j} juures`;
  }

  function skaala(U, [s0, s1]) {
    const max = 0.6;
    const pos = (v) => Math.min(100, (v / max) * 100);
    return `
      <div class="scale" role="img" aria-label="U-arvu asukoht skaalal">
        <div class="scale-bar">
          <div class="zone z-good" style="left:0;width:${pos(s0)}%"></div>
          <div class="zone z-ok" style="left:${pos(s0)}%;width:${pos(s1) - pos(s0)}%"></div>
          <div class="zone z-weak" style="left:${pos(s1)}%;width:${100 - pos(s1)}%"></div>
          <div class="marker" style="left:${pos(U)}%"></div>
        </div>
        <div class="scale-lbl"><span style="left:0">0</span><span style="left:${pos(s0)}%">${fmt(s0)}</span><span style="left:${pos(s1)}%">${fmt(s1)}</span><span style="left:100%">${fmt(max, 1)}+</span></div>
      </div>`;
  }

  function tabel(r) {
    let rows = `<tr class="film"><td></td><td>Sisepinna takistus R<sub>si</sub></td><td></td><td></td><td>${fmt(r.rsi, 2)}</td><td></td><td>${fmt(r.ti, 1)} → ${fmt(r.piirTemp[0], 1)}</td></tr>`;
    r.eff.forEach((k, i) => {
      const a = r.andmed[i];
      const m = MAT[k.m];
      rows += `<tr>
        <td><span class="nr-badge" style="--sw:${m.v}">${i + 1}</span></td>
        <td>${esc(m.nimi)}${a.f > 0 ? ` <small>+ ${esc(KARKASS[k.karkass.m].nimi.toLowerCase())} ${fmt(a.f * 100, 1)} %</small>` : ""}</td>
        <td>${fmt(k.d, k.d < 1 ? 1 : 0)}</td>
        <td>${m.tyyp === "ohk" ? "–" : fmt(k.l, 3)}</td>
        <td>${fmt(a.Req, 3)}</td>
        <td>${fmt(a.sd, a.sd < 1 ? 2 : 1)}</td>
        <td>${fmt(r.piirTemp[i], 1)} → ${fmt(r.piirTemp[i + 1], 1)}</td>
      </tr>`;
    });
    rows += `<tr class="film"><td></td><td>Välispinna takistus R<sub>se</sub>${r.tuulutus ? " (tuulutatud vahe tõttu = R<sub>si</sub>)" : ""}</td><td></td><td></td><td>${fmt(r.rse, 2)}</td><td></td><td>${fmt(r.tse, 1)} → ${fmt(r.te, 1)}</td></tr>`;
    const dTot = r.eff.reduce((s, k) => s + k.d, 0);
    rows += `<tr class="sum"><td></td><td>Kokku</td><td>${fmt(dTot, 0)}</td><td></td><td>${fmt(r.RT, 2)}</td><td>${fmt(r.sdTot, 1)}</td><td></td></tr>`;
    return `<div class="table-wrap"><table class="layers-table">
      <thead><tr><th>#</th><th>Kiht (seest välja)</th><th>d, mm</th><th>λ</th><th>R</th><th>s<sub>d</sub>, m</th><th>Temp, °C</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  // Kihi lühinimi joonisele
  function luhiNimi(k) {
    const m = MAT[k.m];
    if (m.tyyp === "ohk" || m.tyyp === "tuulutatud") return "Õhkvahe";
    return m.nimi.split(" (")[0];
  }
  let _ctx = null;
  function tekstiLaius(t) {
    try {
      if (!_ctx) { _ctx = document.createElement("canvas").getContext("2d"); _ctx.font = "11px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"; }
      return _ctx.measureText(t).width;
    } catch (e) {
      return t.length * 6.2;
    }
  }

  // SVG-graafik: x-telg = paksus (mm), kihid värviliste ribadena
  function graafik(r, liik) {
    const W = 720, padL = 46, padR = 14, padT = 14;
    const film = 30; // pinnatakistuste ala px
    const dTot = r.xPiir[r.xPiir.length - 1];
    const plotW = W - padL - padR - 2 * film;
    // minimaalne nähtav laius õhukestele kihtidele
    const minW = 4;
    const raw = r.eff.map((k) => k.d);
    const scaleW = raw.map((d) => (d / dTot) * plotW);
    const lisa = scaleW.reduce((s, w) => s + Math.max(0, minW - w), 0);
    const suured = scaleW.reduce((s, w) => s + (w > minW ? w : 0), 0);
    const ww = scaleW.map((w) => (w < minW ? minW : w - (lisa * w) / suured));
    const X = [padL + film];
    ww.forEach((w) => X.push(X[X.length - 1] + w));
    const x0 = padL, x1 = W - padR;

    // Kihtide sildid: nimi, kui mahub; muidu number ringis (kattumisel teises reas)
    const R0 = 8, rida1 = 14, rida2 = 34;
    // rea 1 hõivatud lõigud: "sees" ja "väljas" sildid
    const hoivatud = [
      [padL + film / 2 - tekstiLaius("sees") / 2, padL + film / 2 + tekstiLaius("sees") / 2],
      [x1 - film / 2 - tekstiLaius("väljas") / 2, x1 - film / 2 + tekstiLaius("väljas") / 2],
    ];
    const vaba = (a, b) => hoivatud.every(([c, d]) => b + 2 <= c || a - 2 >= d);
    let teineRida = false;
    const sildid = r.eff.map((k, i) => {
      const nimi = luhiNimi(k);
      const laius = X[i + 1] - X[i];
      const kesk = (X[i] + X[i + 1]) / 2;
      const tl = tekstiLaius(nimi);
      if (tl + 6 <= laius && vaba(kesk - tl / 2, kesk + tl / 2)) {
        hoivatud.push([kesk - tl / 2, kesk + tl / 2]);
        return { tyyp: "nimi", x: kesk, tekst: nimi };
      }
      return { tyyp: "ring", x: kesk, nr: i + 1, i };
    });
    // ringid: rida 1, kui vaba; muidu rida 2
    const hoivatud2 = [];
    sildid.filter((sl) => sl.tyyp === "ring").forEach((sl) => {
      const a = sl.x - R0, b = sl.x + R0;
      if (vaba(a, b)) { sl.rida = 1; hoivatud.push([a, b]); }
      else { sl.rida = 2; teineRida = true; hoivatud2.push([a, b]); }
    });
    const padB = teineRida ? 50 : 30;
    const H = 230 + padB;

    let ymin, ymax, yfmt, unit;
    let series = [];
    if (liik === "t") {
      ymin = Math.min(r.te, 0); ymax = Math.max(r.ti, 0);
      unit = "°C"; yfmt = (v) => fmt(v, 0);
    } else {
      ymin = 0; ymax = Math.max(...r.ps, r.pi) * 1.05;
      unit = "Pa"; yfmt = (v) => Math.round(v).toString();
    }
    const pad = (ymax - ymin) * 0.06;
    ymin -= liik === "t" ? pad : 0; ymax += pad;
    const Y = (v) => padT + (H - padT - padB) * (1 - (v - ymin) / (ymax - ymin));

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${liik === "t" ? "Temperatuurijaotus" : "Veeauru rõhk"} tarindis">`;
    // kihid
    r.eff.forEach((k, i) => {
      const m = MAT[k.m];
      svg += `<rect x="${X[i]}" y="${padT}" width="${X[i + 1] - X[i]}" height="${H - padT - padB}" fill="${m.v}" opacity="${m.tyyp === "ohk" ? 0.25 : 0.55}" stroke="#bbb" stroke-width="0.5"/>`;
    });
    const yAll = H - padB;
    sildid.forEach((sl) => {
      if (sl.tyyp === "nimi") {
        svg += `<text x="${sl.x}" y="${yAll + rida1}" class="ax lbl" text-anchor="middle">${esc(sl.tekst)}</text>`;
      } else {
        const cy = yAll + (sl.rida === 1 ? rida1 - 4 : rida2 - 4);
        if (sl.rida === 2) svg += `<line x1="${sl.x}" x2="${sl.x}" y1="${yAll}" y2="${cy - R0}" class="lead"/>`;
        svg += `<circle cx="${sl.x}" cy="${cy}" r="${R0}" class="nr-ring"/><text x="${sl.x}" y="${cy + 3.5}" class="nr-t" text-anchor="middle">${sl.nr}</text>`;
      }
    });
    svg += `<text x="${padL + film / 2}" y="${H - padB + 13}" class="ax" text-anchor="middle">sees</text>`;
    svg += `<text x="${x1 - film / 2}" y="${H - padB + 13}" class="ax" text-anchor="middle">väljas</text>`;
    // y-telg
    const steps = 5;
    for (let s = 0; s <= steps; s++) {
      const v = ymin + ((ymax - ymin) * s) / steps;
      const y = Y(v);
      svg += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" class="grid"/><text x="${x0 - 6}" y="${y + 4}" class="ax" text-anchor="end">${yfmt(v)}</text>`;
    }
    svg += `<text x="6" y="${padT + 4}" class="ax">${unit}</text>`;
    if (liik === "t" && ymin < 0 && ymax > 0) svg += `<line x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>`;

    if (liik === "t") {
      const pts = [[x0, r.ti], [X[0], r.piirTemp[0]]];
      r.piirTemp.slice(1).forEach((t, i) => pts.push([X[i + 1], t]));
      pts.push([x1, r.te]);
      svg += `<polyline points="${pts.map(([x, t]) => `${x},${Y(t)}`).join(" ")}" class="line-t"/>`;
      // kastepunkt
      svg += `<line x1="${x0}" x2="${x1}" y1="${Y(r.kastep)}" y2="${Y(r.kastep)}" class="dew"/><text x="${x1 - 4}" y="${Y(r.kastep) - 4}" class="ax dew-t" text-anchor="end">siseõhu kastepunkt ${fmt(r.kastep, 1)} °C</text>`;
      pts.slice(1, -1).forEach(([x, t]) => (svg += `<circle cx="${x}" cy="${Y(t)}" r="2.5" class="dot-t"/>`));
    } else {
      // küllastusrõhk – kihi sees temperatuur lineaarne, psat kõver
      const sat = [[x0, psat(r.ti)], [X[0], r.ps[0]]];
      r.eff.forEach((k, i) => {
        const n = 8;
        for (let s = 1; s <= n; s++) {
          const t = r.piirTemp[i] + ((r.piirTemp[i + 1] - r.piirTemp[i]) * s) / n;
          sat.push([X[i] + ((X[i + 1] - X[i]) * s) / n, psat(t)]);
        }
      });
      sat.push([x1, psat(r.te)]);
      svg += `<polyline points="${sat.map(([x, v]) => `${x},${Y(v)}`).join(" ")}" class="line-sat"/>`;
      const pp = [[x0, r.pi], ...r.p.map((v, i) => [X[i], v]), [x1, r.pe]];
      svg += `<polyline points="${pp.map(([x, v]) => `${x},${Y(v)}`).join(" ")}" class="line-p"/>`;
      r.kond.forEach((k) => (svg += `<circle cx="${X[k.j]}" cy="${Y(r.p[k.j])}" r="6" class="dot-k"/>`));
      if (r.pinnaKond) svg += `<circle cx="${X[0]}" cy="${Y(r.p[0])}" r="6" class="dot-k"/>`;
    }
    svg += `<line x1="${X[0]}" x2="${X[0]}" y1="${padT}" y2="${H - padB}" class="edge"/><line x1="${X[X.length - 1]}" x2="${X[X.length - 1]}" y1="${padT}" y2="${H - padB}" class="edge"/>`;
    return svg + "</svg>";
  }

  // ---------- Algus ----------
  function init() {
    $("#kihid").addEventListener("input", onSisend);
    $("#kihid").addEventListener("change", (e) => {
      if (["m", "karkass", "km"].includes(e.target.dataset.f)) return; // input-sündmus juba käsitles
      onSisend(e);
    });
    $("#kihid").addEventListener("click", onKlikk);
    $("#lisa").addEventListener("click", () => {
      kihid.push(uusKiht("klaasvill"));
      joonistaKihid();
      arvuta();
    });
    document.querySelectorAll('input[name="tyyp"]').forEach((el) =>
      el.addEventListener("change", () => { tyyp = el.value; joonistaKihid(); arvuta(); })
    );
    ["ti", "phii", "te", "phie"].forEach((id) => $("#" + id).addEventListener("input", arvuta));
    document.querySelectorAll("[data-naide]").forEach((b) => b.addEventListener("click", () => laadiNaide(b.dataset.naide)));
    laadiNaide("karkass");
  }

  // ekspordi testimiseks
  if (typeof window !== "undefined") {
    window.__soojustus = { arvutaTulemus, setKihid: (k, t) => { kihid = k; tyyp = t; }, uusKiht, NAITED, psat };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
