// Ehitusjuhis – tala sisejõudude ja ristlõike kontrolli kalkulaator
// Arvutus: Euler-Bernoulli tala jäikusmeetodil (FEM, konsistentsed sõlmekoormused),
// sisejõud lõikemeetodil toereaktsioonidest ja koormustest (täpsed, võrgust sõltumatud).
// Kontroll: EVS-EN 1993-1-1 (teras, I/H-profiilid), EVS-EN 1995-1-1 (saetud puit ja liimpuit).

(() => {
  "use strict";

  // =====================================================================
  //  ANDMED
  // =====================================================================

  // Valtsprofiilid: [nimi, h, b, tw, tf, r] mm
  const SEERIAD = {
    IPE: [
      ["IPE 80", 80, 46, 3.8, 5.2, 5], ["IPE 100", 100, 55, 4.1, 5.7, 7], ["IPE 120", 120, 64, 4.4, 6.3, 7],
      ["IPE 140", 140, 73, 4.7, 6.9, 7], ["IPE 160", 160, 82, 5.0, 7.4, 9], ["IPE 180", 180, 91, 5.3, 8.0, 9],
      ["IPE 200", 200, 100, 5.6, 8.5, 12], ["IPE 220", 220, 110, 5.9, 9.2, 12], ["IPE 240", 240, 120, 6.2, 9.8, 15],
      ["IPE 270", 270, 135, 6.6, 10.2, 15], ["IPE 300", 300, 150, 7.1, 10.7, 15], ["IPE 330", 330, 160, 7.5, 11.5, 18],
      ["IPE 360", 360, 170, 8.0, 12.7, 18], ["IPE 400", 400, 180, 8.6, 13.5, 21], ["IPE 450", 450, 190, 9.4, 14.6, 21],
      ["IPE 500", 500, 200, 10.2, 16.0, 21],
    ],
    HEA: [
      ["HEA 100", 96, 100, 5, 8, 12], ["HEA 120", 114, 120, 5, 8, 12], ["HEA 140", 133, 140, 5.5, 8.5, 12],
      ["HEA 160", 152, 160, 6, 9, 15], ["HEA 180", 171, 180, 6, 9.5, 15], ["HEA 200", 190, 200, 6.5, 10, 18],
      ["HEA 220", 210, 220, 7, 11, 18], ["HEA 240", 230, 240, 7.5, 12, 21], ["HEA 260", 250, 260, 7.5, 12.5, 24],
      ["HEA 280", 270, 280, 8, 13, 24], ["HEA 300", 290, 300, 8.5, 14, 27],
    ],
    HEB: [
      ["HEB 100", 100, 100, 6, 10, 12], ["HEB 120", 120, 120, 6.5, 11, 12], ["HEB 140", 140, 140, 7, 12, 12],
      ["HEB 160", 160, 160, 8, 13, 15], ["HEB 180", 180, 180, 8.5, 14, 15], ["HEB 200", 200, 200, 9, 15, 18],
      ["HEB 220", 220, 220, 9.5, 16, 18], ["HEB 240", 240, 240, 10, 17, 21], ["HEB 260", 260, 260, 10, 17.5, 24],
      ["HEB 280", 280, 280, 10.5, 18, 24], ["HEB 300", 300, 300, 11, 19, 27],
    ],
  };
  const TERAS = { S235: 235, S275: 275, S355: 355 };
  const E_TERAS = 210000, G_TERAS = 81000; // MPa

  // Puit: fm,k, fv,k, E0,mean, E0,05 (MPa), ρmean (kg/m³) – EVS-EN 338, EVS-EN 14080
  const PUIT = {
    C14: { fm: 14, fv: 3.0, E: 7000, E05: 4700, rho: 350 },
    C16: { fm: 16, fv: 3.2, E: 8000, E05: 5400, rho: 370 },
    C18: { fm: 18, fv: 3.4, E: 9000, E05: 6000, rho: 380 },
    C24: { fm: 24, fv: 4.0, E: 11000, E05: 7400, rho: 420 },
    C30: { fm: 30, fv: 4.0, E: 12000, E05: 8000, rho: 460 },
  };
  const LIIMPUIT = {
    GL24h: { fm: 24, fv: 3.5, E: 11500, E05: 9600, rho: 420 },
    GL28h: { fm: 28, fv: 3.5, E: 12600, E05: 10500, rho: 460 },
    GL30h: { fm: 30, fv: 3.5, E: 13600, E05: 11300, rho: 480 },
    GL32h: { fm: 32, fv: 3.5, E: 14200, E05: 11800, rho: 490 },
  };
  // kmod EVS-EN 1995-1-1 tabel 3.1 (saetud ja liimpuit), kasutusklass 1–2 / 3
  const KESTUS = {
    alaline: { nimi: "Alaline", k12: 0.6, k3: 0.5 },
    pikk: { nimi: "Pikaajaline (nt laoruumi kasuskoormus)", k12: 0.7, k3: 0.55 },
    keskmine: { nimi: "Keskmise kestusega (nt eluruumi kasuskoormus)", k12: 0.8, k3: 0.65 },
    luhike: { nimi: "Lühiajaline (nt lumi, vt rahvuslik lisa)", k12: 0.9, k3: 0.7 },
    hetk: { nimi: "Hetkeline (nt tuul, õnnetuskoormus)", k12: 1.1, k3: 0.9 },
  };
  const KDEF = { 1: 0.6, 2: 0.8, 3: 2.0 };
  const PUIT_H = [95, 120, 145, 170, 195, 220, 245, 270, 295, 315, 360, 405, 450, 495, 540, 585, 630];

  // =====================================================================
  //  RISTLÕIKED
  // =====================================================================

  // I/H-profiili omadused mõõtmetest (ümardustega), mm-ühikutes
  function iProfiil([nimi, h, b, tw, tf, r]) {
    const As = (1 - Math.PI / 4) * r * r; // ühe ümarduse pind
    const e = (r * (10 - 3 * Math.PI)) / (12 - 3 * Math.PI); // raskuskeskme kaugus servadest
    // ümarduse inertsimoment oma raskuskeskme suhtes
    const Aq = (Math.PI * r * r) / 4, cq = (4 * r) / (3 * Math.PI);
    const I0 = r ** 4 / 3 - (Math.PI * r ** 4 / 16 - Aq * cq * cq + Aq * (r - cq) ** 2);
    const Ios = I0 - As * e * e;
    const hw = h - 2 * tf;
    const dy = h / 2 - tf - e, dz = tw / 2 + e;
    const A = 2 * b * tf + hw * tw + 4 * As;
    const Iy = (b * h ** 3 - (b - tw) * hw ** 3) / 12 + 4 * (Ios + As * dy * dy);
    const Iz = (2 * tf * b ** 3 + hw * tw ** 3) / 12 + 4 * (Ios + As * dz * dz);
    const Wel = Iy / (h / 2);
    const Wpl = b * tf * (h - tf) + (tw * hw * hw) / 4 + 4 * As * dy;
    const Avz = Math.max(A - 2 * b * tf + (tw + 2 * r) * tf, hw * tw);
    const alfa = -0.042 + 0.2204 * tw / tf + 0.1355 * r / tf - 0.0865 * r * tw / tf ** 2 - 0.0725 * tw ** 2 / tf ** 2;
    const D = ((tf + r) ** 2 + tw * (r + tw / 4)) / (2 * r + tf);
    const It = 2 * b * tf ** 3 * (1 / 3 - 0.21 * (tf / b) * (1 - tf ** 4 / (12 * b ** 4))) + (hw * tw ** 3) / 3 + 2 * alfa * D ** 4;
    const Iw = (Iz * (h - tf) ** 2) / 4;
    return { nimi, h, b, tw, tf, r, A, Iy, Iz, Wel, Wpl, Avz, It, Iw, mass: A * 1e-6 * 7850 };
  }

  // =====================================================================
  //  ARVUTUS – jäikusmeetod
  // =====================================================================

  const EPS = 1e-9;
  const qAt = (l, x) => (l.b - l.a > EPS ? l.q1 + ((l.q2 - l.q1) * (x - l.a)) / (l.b - l.a) : l.q1);

  function vorguPunktid(L, toed, liigendid, koormused) {
    let key = [0, L];
    toed.forEach((s) => key.push(s.x));
    liigendid.forEach((h) => key.push(h.x));
    koormused.forEach((l) => (l.t === "q" ? key.push(l.a, l.b) : key.push(l.x)));
    key = key.map((x) => Math.min(L, Math.max(0, x))).sort((a, b) => a - b);
    const uk = [];
    key.forEach((x) => { if (!uk.length || x - uk[uk.length - 1] > 1e-7 * L) uk.push(x); });
    const xs = [uk[0]];
    const samm = L / 200;
    for (let i = 1; i < uk.length; i++) {
      const a = uk[i - 1], b = uk[i];
      const n = Math.max(1, Math.ceil((b - a) / samm - 1e-9));
      for (let j = 1; j <= n; j++) xs.push(j === n ? b : a + ((b - a) * j) / n);
    }
    return xs;
  }

  // Lahendab ühe koormusjuhu. EI kNm². Tagastab sõlmede läbipainded (m, üles +) ja toereaktsioonid.
  function lahenda(L, toed, liigendid, koormused, EI, xs) {
    const n = xs.length;
    const lahedal = (x) => { let best = 0; for (let i = 1; i < n; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i; return best; };
    const wD = [], thL = [], thR = [];
    const liigendSolm = new Set(liigendid.map((h) => lahedal(h.x)).filter((i) => i > 0 && i < n - 1));
    let nd = 0;
    for (let i = 0; i < n; i++) {
      wD[i] = nd++; thL[i] = nd++;
      thR[i] = liigendSolm.has(i) ? nd++ : thL[i];
    }
    const hb = 5, W = 2 * hb + 1;
    const K = new Float64Array(nd * W);
    const F = new Float64Array(nd);
    const kAdd = (i, j, v) => { K[i * W + (j - i + hb)] += v; };
    for (let e = 0; e < n - 1; e++) {
      const h = xs[e + 1] - xs[e];
      const d = [wD[e], thR[e], wD[e + 1], thL[e + 1]];
      const c = EI / h ** 3;
      const k = [
        [12, 6 * h, -12, 6 * h],
        [6 * h, 4 * h * h, -6 * h, 2 * h * h],
        [-12, -6 * h, 12, -6 * h],
        [6 * h, 2 * h * h, -6 * h, 4 * h * h],
      ];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) kAdd(d[i], d[j], c * k[i][j]);
      let pa = 0, pb = 0;
      koormused.forEach((l) => {
        if (l.t !== "q") return;
        if (xs[e] >= l.a - 1e-7 * L && xs[e + 1] <= l.b + 1e-7 * L) { pa -= qAt(l, xs[e]); pb -= qAt(l, xs[e + 1]); }
      });
      if (pa || pb) {
        F[d[0]] += (h * (7 * pa + 3 * pb)) / 20;
        F[d[1]] += (h * h * (3 * pa + 2 * pb)) / 60;
        F[d[2]] += (h * (3 * pa + 7 * pb)) / 20;
        F[d[3]] -= (h * h * (2 * pa + 3 * pb)) / 60;
      }
    }
    koormused.forEach((l) => {
      if (l.t === "P") F[wD[lahedal(l.x)]] -= l.P;
      if (l.t === "M") F[thR[lahedal(l.x)]] -= l.M; // M päripäeva + → vastupäeva -
    });
    const Korig = K.slice(), Forig = F.slice();
    const fix = new Set();
    const toeSolm = toed.map((s) => {
      const i = lahedal(s.x);
      fix.add(wD[i]);
      if (s.t === "jaik") fix.add(thL[i]);
      if (s.t === "jaik" && thR[i] !== thL[i]) fix.add(thR[i]);
      return i;
    });
    fix.forEach((dd) => {
      for (let j = Math.max(0, dd - hb); j <= Math.min(nd - 1, dd + hb); j++) {
        K[dd * W + (j - dd + hb)] = 0;
        K[j * W + (dd - j + hb)] = 0;
      }
      K[dd * W + hb] = 1; F[dd] = 0;
    });
    // Gaussi elimineerimine lintmaatriksil
    const diag0 = new Float64Array(nd);
    for (let i = 0; i < nd; i++) diag0[i] = Math.abs(K[i * W + hb]) || 1;
    for (let k = 0; k < nd; k++) {
      const piv = K[k * W + hb];
      if (!(Math.abs(piv) > 1e-9 * diag0[k])) return { labiilne: true };
      const jm = Math.min(nd - 1, k + hb);
      for (let i = k + 1; i <= jm; i++) {
        const f = K[i * W + (k - i + hb)] / piv;
        if (!f) continue;
        for (let j = k; j <= jm; j++) K[i * W + (j - i + hb)] -= f * K[k * W + (j - k + hb)];
        F[i] -= f * F[k];
      }
    }
    const u = new Float64Array(nd);
    for (let k = nd - 1; k >= 0; k--) {
      let s = F[k];
      for (let j = k + 1; j <= Math.min(nd - 1, k + hb); j++) s -= K[k * W + (j - k + hb)] * u[j];
      u[k] = s / K[k * W + hb];
    }
    const reakt = (dd) => {
      let s = -Forig[dd];
      for (let j = Math.max(0, dd - hb); j <= Math.min(nd - 1, dd + hb); j++) s += Korig[dd * W + (j - dd + hb)] * u[j];
      return s;
    };
    const reakts = toed.map((s, k) => {
      const i = toeSolm[k];
      let C = 0;
      if (s.t === "jaik") { C = reakt(thL[i]); if (thR[i] !== thL[i]) C += reakt(thR[i]); }
      return { x: xs[i], t: s.t, R: reakt(wD[i]), C };
    });
    return { w: Array.from(xs, (_, i) => u[wD[i]]), reakts };
  }

  // Lõikejõud ja paindemoment kohal x (side −1 = vasakult, +1 = paremalt). M > 0 = alumine kiud tõmmatud.
  function loige(x, side, koormused, reakts) {
    let V = 0, M = 0;
    const tol = 1e-9;
    const sees = (xi) => xi < x - tol || (Math.abs(xi - x) <= tol && side > 0);
    reakts.forEach((r) => { if (sees(r.x)) { V += r.R; M += r.R * (x - r.x) - r.C; } });
    koormused.forEach((l) => {
      if (l.t === "P" && sees(l.x)) { V -= l.P; M -= l.P * (x - l.x); }
      else if (l.t === "M" && sees(l.x)) { M += l.M; }
      else if (l.t === "q" && x > l.a + tol) {
        const c = Math.min(l.b, x), U = c - l.a, X = x - l.a;
        const k = l.b - l.a > tol ? (l.q2 - l.q1) / (l.b - l.a) : 0;
        V -= l.q1 * U + (k * U * U) / 2;
        M -= (l.q1 * (X * X - (x - c) * (x - c))) / 2 + k * ((X * U * U) / 2 - (U * U * U) / 3);
      }
    });
    return { V, M };
  }

  function sisejoud(xs, koormused, reakts) {
    const katk = new Set();
    reakts.forEach((r) => katk.add(r.x));
    koormused.forEach((l) => { if (l.t !== "q") katk.add(l.x); });
    const onKatk = (x) => [...katk].some((k) => Math.abs(k - x) < 1e-9);
    const out = [];
    xs.forEach((x) => {
      if (onKatk(x)) { out.push({ x, ...loige(x, -1, koormused, reakts) }); out.push({ x, ...loige(x, 1, koormused, reakts) }); }
      else out.push({ x, ...loige(x, 1, koormused, reakts) });
    });
    // täpsusta momendi ekstreemumid kohtades, kus V = 0
    const lisa = [];
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1], b = out[i];
      if (b.x - a.x > 1e-12 && a.V * b.V < 0) {
        const xz = a.x + ((b.x - a.x) * a.V) / (a.V - b.V);
        lisa.push({ i, p: { x: xz, ...loige(xz, 1, koormused, reakts) } });
      }
    }
    lisa.reverse().forEach(({ i, p }) => out.splice(i, 0, p));
    return out;
  }

  // Kombineerib koormusjuhtude tulemused teguritega
  function kombineeri(juhud, tegurid) {
    const koormused = [], reakts = juhud[0].tul.reakts.map((r) => ({ ...r, R: 0, C: 0 }));
    let w = juhud[0].tul.w.map(() => 0);
    juhud.forEach((j, k) => {
      const f = tegurid[k];
      if (!f) return;
      j.koormused.forEach((l) => koormused.push(skaleeri(l, f)));
      j.tul.reakts.forEach((r, i) => { reakts[i].R += f * r.R; reakts[i].C += f * r.C; });
      w = w.map((v, i) => v + f * j.tul.w[i]);
    });
    return { koormused, reakts, w };
  }
  function skaleeri(l, f) {
    if (l.t === "P") return { ...l, P: l.P * f };
    if (l.t === "M") return { ...l, M: l.M * f };
    return { ...l, q1: l.q1 * f, q2: l.q2 * f };
  }

  function arvutaSkeem(mudel, EI, lisaG) {
    const { L, toed, liigendid } = mudel;
    const G = mudel.koormused.filter((l) => l.cat !== "Q").concat(lisaG || []);
    const Q = mudel.koormused.filter((l) => l.cat === "Q");
    const kõik = G.concat(Q);
    const xs = vorguPunktid(L, toed, liigendid, kõik);
    const tG = lahenda(L, toed, liigendid, G, EI, xs);
    if (tG.labiilne) return { labiilne: true };
    const tQ = lahenda(L, toed, liigendid, Q, EI, xs);
    return { xs, juhud: [{ koormused: G, tul: tG }, { koormused: Q, tul: tQ }], onQ: Q.length > 0 };
  }

  function ekstreemumid(s, key) {
    let mx = s[0], mn = s[0];
    s.forEach((p) => { if (p[key] > mx[key]) mx = p; if (p[key] < mn[key]) mn = p; });
    return { mx, mn, abs: Math.max(Math.abs(mx[key]), Math.abs(mn[key])) };
  }

  // Avade ja üleulatuste läbipainde piirid
  function labipaindeKontroll(xs, w, toed, L, n) {
    const tp = [...new Set(toed.map((s) => s.x))].sort((a, b) => a - b);
    const lõigud = [];
    if (tp.length === 0) return [];
    if (tp[0] > 1e-6) lõigud.push({ a: 0, b: tp[0], konsool: true });
    for (let i = 1; i < tp.length; i++) lõigud.push({ a: tp[i - 1], b: tp[i], konsool: false });
    if (L - tp[tp.length - 1] > 1e-6) lõigud.push({ a: tp[tp.length - 1], b: L, konsool: true });
    return lõigud.map((s) => {
      let wm = 0, xm = s.a;
      xs.forEach((x, i) => { if (x >= s.a - 1e-9 && x <= s.b + 1e-9 && Math.abs(w[i]) > Math.abs(wm)) { wm = w[i]; xm = x; } });
      const pikk = s.b - s.a;
      const piir = ((s.konsool ? 2 : 1) * pikk * 1000) / n;
      return { ...s, w: Math.abs(wm), xm, piir, util: Math.abs(wm) / piir };
    });
  }

  // =====================================================================
  //  RISTLÕIKE KONTROLL
  // =====================================================================

  function kontrolliTeras(mudel, prm, sek) {
    const fy = TERAS[prm.teras];
    const p = sek;
    const EI = (E_TERAS * p.Iy) * 1e-9;
    const omakaal = prm.omakaal ? [{ t: "q", q1: p.mass * 9.81 / 1000, q2: p.mass * 9.81 / 1000, a: 0, b: mudel.L, cat: "G", oma: true }] : [];
    const sk = arvutaSkeem(mudel, EI, omakaal);
    if (sk.labiilne) return { labiilne: true };
    // ristlõike klass
    const eps = Math.sqrt(235 / fy);
    const cf = (p.b - p.tw - 2 * p.r) / 2 / p.tf, cw = (p.h - 2 * p.tf - 2 * p.r) / p.tw;
    const kf = cf <= 9 * eps ? 1 : cf <= 10 * eps ? 2 : cf <= 14 * eps ? 3 : 4;
    const kw = cw <= 72 * eps ? 1 : cw <= 83 * eps ? 2 : cw <= 124 * eps ? 3 : 4;
    const klass = Math.max(kf, kw);
    const Wy = klass <= 2 ? p.Wpl : p.Wel;
    const McRd = (Wy * fy) / 1e6; // kNm (γM0 = 1,0)
    const VplRd = (p.Avz * fy) / Math.sqrt(3) / 1000; // kN
    const hw = p.h - 2 * p.tf;
    // kiip
    let MbRd = null, kiip = null;
    if (!prm.kulg) {
      const Lcr = prm.lcr * 1000;
      const Mcr = ((prm.c1 * Math.PI ** 2 * E_TERAS * p.Iz) / Lcr ** 2) *
        Math.sqrt(p.Iw / p.Iz + (Lcr ** 2 * G_TERAS * p.It) / (Math.PI ** 2 * E_TERAS * p.Iz)) / 1e6;
      const lam = Math.sqrt((Wy * fy) / 1e6 / Mcr);
      const aLT = p.h / p.b <= 2 ? 0.34 : 0.49, lam0 = 0.4, beta = 0.75;
      let chi = 1;
      if (lam > lam0) {
        const Phi = 0.5 * (1 + aLT * (lam - lam0) + beta * lam * lam);
        chi = Math.min(1, 1 / (lam * lam), 1 / (Phi + Math.sqrt(Phi * Phi - beta * lam * lam)));
      }
      MbRd = chi * McRd; // γM1 = 1,0
      kiip = { Mcr, lam, chi, kõver: aLT === 0.34 ? "b" : "c" };
    }
    const kombod = [{ nimi: `${fmt(prm.gG, 2)}·G + ${fmt(prm.gQ, 2)}·Q`, t: [prm.gG, prm.gQ] }];
    if (sk.onQ) kombod.push({ nimi: `${fmt(prm.gG, 2)}·G`, t: [prm.gG, 0] });
    let halvim = null;
    const kontrollid = {};
    const pane = (k, o) => { if (!kontrollid[k] || o.util > kontrollid[k].util) kontrollid[k] = o; };
    kombod.forEach((kb) => {
      const c = kombineeri(sk.juhud, kb.t);
      const s = sisejoud(sk.xs, c.koormused, c.reakts);
      const eM = ekstreemumid(s, "M"), eV = ekstreemumid(s, "V");
      pane("M", { nimi: "Paine", Ed: eM.abs, Rd: McRd, yhik: "kNm", util: eM.abs / McRd, kombo: kb.nimi,
        selg: `M<sub>c,Rd</sub> = W<sub>${klass <= 2 ? "pl" : "el"},y</sub>·f<sub>y</sub>/γ<sub>M0</sub> (klass ${klass})` });
      pane("V", { nimi: "Nihe", Ed: eV.abs, Rd: VplRd, yhik: "kN", util: eV.abs / VplRd, kombo: kb.nimi,
        selg: "V<sub>pl,Rd</sub> = A<sub>v</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>)" });
      let mv = 0, mvx = null;
      s.forEach((q) => {
        if (Math.abs(q.V) > 0.5 * VplRd) {
          const rho = (2 * Math.abs(q.V) / VplRd - 1) ** 2;
          const MV = Math.max(0, McRd * (1 - (rho * hw * hw * p.tw) / 4 / Wy));
          const u = Math.abs(q.M) / MV;
          if (u > mv) { mv = u; mvx = { M: Math.abs(q.M), MV }; }
        }
      });
      if (mvx) pane("MV", { nimi: "Paine + nihe", Ed: mvx.M, Rd: mvx.MV, yhik: "kNm", util: mv, kombo: kb.nimi, selg: "V<sub>Ed</sub> > 0,5·V<sub>pl,Rd</sub> → vähendatud M<sub>V,Rd</sub>" });
      if (MbRd) pane("LT", { nimi: "Kiip", Ed: eM.abs, Rd: MbRd, yhik: "kNm", util: eM.abs / MbRd, kombo: kb.nimi,
        selg: `M<sub>b,Rd</sub> = χ<sub>LT</sub>·M<sub>c,Rd</sub>; M<sub>cr</sub> = ${fmt(kiip.Mcr, 1)} kNm, λ̄<sub>LT</sub> = ${fmt(kiip.lam, 2)}, χ<sub>LT</sub> = ${fmt(kiip.chi, 2)} (kõver ${kiip.kõver})` });
      if (!halvim || eM.abs > ekstreemumid(halvim.s, "M").abs) halvim = { s, c, kb };
    });
    const sls = kombineeri(sk.juhud, [1, 1]);
    const wmm = sls.w.map((v) => v * 1000);
    const lp = labipaindeKontroll(sk.xs, wmm, mudel.toed, mudel.L, prm.piir);
    const lpH = lp.reduce((a, b) => (!a || b.util > a.util ? b : a), null);
    if (lpH) kontrollid.W = { nimi: "Läbipaine", Ed: lpH.w, Rd: lpH.piir, yhik: "mm", util: lpH.util, kombo: "G + Q (normväärtused)",
      selg: `${lpH.konsool ? "konsool, piir 2·L" : "ava"}/${prm.piir}, ava ${fmt((lpH.b - lpH.a), 2)} m` };
    return { sk, halvim, kontrollid, wPlot: wmm, klass, omakaal: omakaal[0], sek: p, fy, McRd, VplRd };
  }

  function kontrolliPuit(mudel, prm) {
    const liim = prm.mat === "liimpuit";
    const m = (liim ? LIIMPUIT : PUIT)[prm.klass];
    const b = prm.b, h = prm.h;
    const A = b * h, I = (b * h ** 3) / 12, Wm = (b * h * h) / 6;
    const EI = m.E * I * 1e-9;
    const gk = (m.rho * 9.81 / 1e6) * A / 1000; // kN/m
    const omakaal = prm.omakaal ? [{ t: "q", q1: gk, q2: gk, a: 0, b: mudel.L, cat: "G", oma: true }] : [];
    const sk = arvutaSkeem(mudel, EI, omakaal);
    if (sk.labiilne) return { labiilne: true };
    const gM = liim ? 1.25 : 1.3;
    const kh = liim ? (h < 600 ? Math.min((600 / h) ** 0.1, 1.1) : 1) : h < 150 ? Math.min((150 / h) ** 0.2, 1.3) : 1;
    let kcrit = 1, lamRel = null;
    if (!prm.kulg) {
      const lef = prm.lcr * 1000;
      const sCrit = (0.78 * b * b * m.E05) / (h * lef);
      lamRel = Math.sqrt(m.fm / sCrit);
      kcrit = lamRel <= 0.75 ? 1 : lamRel <= 1.4 ? 1.56 - 0.75 * lamRel : 1 / lamRel ** 2;
    }
    const kk = prm.kk;
    const kmodOf = (kest) => (kk === 3 ? KESTUS[kest].k3 : KESTUS[kest].k12);
    const kombod = [];
    if (sk.onQ) kombod.push({ nimi: `${fmt(prm.gG, 2)}·G + ${fmt(prm.gQ, 2)}·Q`, t: [prm.gG, prm.gQ], kmod: kmodOf(prm.kestus) });
    kombod.push({ nimi: `${fmt(prm.gG, 2)}·G`, t: [prm.gG, 0], kmod: kmodOf("alaline") });
    const kontrollid = {};
    let halvim = null;
    const pane = (k, o) => { if (!kontrollid[k] || o.util > kontrollid[k].util) kontrollid[k] = o; };
    kombod.forEach((kb) => {
      const c = kombineeri(sk.juhud, kb.t);
      const s = sisejoud(sk.xs, c.koormused, c.reakts);
      const eM = ekstreemumid(s, "M"), eV = ekstreemumid(s, "V");
      const sm = (eM.abs * 1e6) / Wm;
      const fmd = (kb.kmod * m.fm * kh) / gM;
      pane("M", { nimi: prm.kulg ? "Paine" : "Paine + kiip", Ed: sm, Rd: kcrit * fmd, yhik: "MPa", util: sm / (kcrit * fmd), kombo: kb.nimi,
        selg: `σ<sub>m,d</sub> ≤ ${prm.kulg ? "" : "k<sub>crit</sub>·"}f<sub>m,d</sub>; k<sub>mod</sub> = ${fmt(kb.kmod, 2)}, k<sub>h</sub> = ${fmt(kh, 2)}${prm.kulg ? "" : `, k<sub>crit</sub> = ${fmt(kcrit, 2)} (λ<sub>rel,m</sub> = ${fmt(lamRel, 2)})`}, γ<sub>M</sub> = ${fmt(gM, 2)}` });
      const tau = (1.5 * eV.abs * 1000) / (0.67 * b * h);
      const fvd = (kb.kmod * m.fv) / gM;
      pane("V", { nimi: "Nihe", Ed: tau, Rd: fvd, yhik: "MPa", util: tau / fvd, kombo: kb.nimi,
        selg: `τ<sub>d</sub> = 1,5·V<sub>d</sub>/(k<sub>cr</sub>·b·h), k<sub>cr</sub> = 0,67; k<sub>mod</sub> = ${fmt(kb.kmod, 2)}` });
      const u = Math.max(sm / (kcrit * fmd), tau / fvd);
      if (!halvim || u > halvim.u) halvim = { s, c, kb, u };
    });
    const kdef = KDEF[kk];
    const wG = sk.juhud[0].tul.w, wQ = sk.juhud[1].tul.w;
    const wfin = wG.map((v, i) => (v * (1 + kdef) + wQ[i] * (1 + prm.psi2 * kdef)) * 1000);
    const winst = wG.map((v, i) => (v + wQ[i]) * 1000);
    const lp = labipaindeKontroll(sk.xs, wfin, mudel.toed, mudel.L, prm.piir);
    const lpH = lp.reduce((a, b2) => (!a || b2.util > a.util ? b2 : a), null);
    const wiMax = Math.max(...winst.map(Math.abs));
    if (lpH) kontrollid.W = { nimi: "Läbipaine w<sub>fin</sub>", Ed: lpH.w, Rd: lpH.piir, yhik: "mm", util: lpH.util, kombo: "lõplik (roomega)",
      selg: `w<sub>fin</sub> = w<sub>G</sub>(1+k<sub>def</sub>) + w<sub>Q</sub>(1+ψ<sub>2</sub>k<sub>def</sub>), k<sub>def</sub> = ${fmt(kdef, 1)}; ${lpH.konsool ? "konsool, piir 2·L" : "ava"}/${prm.piir}; w<sub>inst</sub> = ${fmt(wiMax, 1)} mm` };
    return { sk, halvim, kontrollid, wPlot: wfin, omakaal: omakaal[0], sek: { b, h, A, I, Wm }, m };
  }

  // =====================================================================
  //  ABI
  // =====================================================================

  function fmt(x, k = 2) {
    if (x == null || !isFinite(x)) return "–";
    const v = Math.abs(x) < 0.5 * 10 ** -k ? 0 : x;
    return v.toFixed(k).replace("-", "−").replace(".", ",");
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (v) => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : NaN; };

  // Node-testide jaoks
  if (typeof document === "undefined") {
    module.exports = { iProfiil, SEERIAD, lahenda, sisejoud, arvutaSkeem, kombineeri, ekstreemumid, kontrolliTeras, kontrolliPuit, vorguPunktid };
    return;
  }

  // =====================================================================
  //  OLEK JA KASUTAJALIIDES
  // =====================================================================

  const $ = (s) => document.querySelector(s);
  let uid = 0;
  const olek = {
    L: 5,
    toed: [{ id: ++uid, t: "liigend", x: 0 }, { id: ++uid, t: "rull", x: 5 }],
    liigendid: [],
    koormused: [{ id: ++uid, t: "q", q1: 3, q2: 3, a: 0, b: 5, cat: "G", uh: true }, { id: ++uid, t: "q", q1: 2, q2: 2, a: 0, b: 5, cat: "Q", uh: true }],
  };

  const TOE_NIMI = { liigend: "Liikumatu liigend", rull: "Liikuv liigend (rull)", jaik: "Jäik kinnitus" };
  const KOORM_NIMI = { P: "Koondatud jõud", q: "Ühtlane lauskoormus", trap: "Muutuv lauskoormus", M: "Moment" };

  const r1 = (x) => Math.round(x * 1000) / 1000;
  const SKEEMID = {
    lihttala: { nimi: "Lihttala", f: (L) => [["liigend", 0], ["rull", L]] },
    konsool: { nimi: "Konsool", f: () => [["jaik", 0]] },
    yleulatus: { nimi: "Üleulatusega tala", f: (L) => [["liigend", 0], ["rull", r1(Math.round(L * 0.75 * 10) / 10)]] },
    jaikjaik: { nimi: "Mõlemast otsast jäik", f: (L) => [["jaik", 0], ["jaik", L]] },
    jaikliig: { nimi: "Jäik + liigend", f: (L) => [["jaik", 0], ["rull", L]] },
    jatk2: { nimi: "Jätkuvtala, 2 ava", f: (L) => [["liigend", 0], ["rull", r1(L / 2)], ["rull", L]] },
    jatk3: { nimi: "Jätkuvtala, 3 ava", f: (L) => [["liigend", 0], ["rull", r1(L / 3)], ["rull", r1((2 * L) / 3)], ["rull", L]] },
  };

  function reziim() { return document.querySelector('input[name="reziim"]:checked').value; }
  function materjal() { return document.querySelector('input[name="mat"]:checked').value; }

  // ---------- Loendid ----------
  function joonistaToed() {
    $("#toed").innerHTML = olek.toed.map((s) => `
      <div class="item" data-id="${s.id}" data-kind="tugi">
        <select data-f="t">${Object.entries(TOE_NIMI).map(([k, v]) => `<option value="${k}"${k === s.t ? " selected" : ""}>${v}</option>`).join("")}</select>
        <label class="fld"><span>Asukoht x, m</span><input type="number" step="any" data-f="x" value="${s.x}"></label>
        <button type="button" class="del" data-del title="Eemalda">✕</button>
      </div>`).join("") || `<p class="hint">Toed puuduvad – lisa vähemalt üks tugi.</p>`;
  }
  function joonistaLiigendid() {
    $("#liigendid").innerHTML = olek.liigendid.map((h) => `
      <div class="item" data-id="${h.id}" data-kind="liigend">
        <span class="item-name">Sisemine liigend</span>
        <label class="fld"><span>Asukoht x, m</span><input type="number" step="any" data-f="x" value="${h.x}"></label>
        <button type="button" class="del" data-del title="Eemalda">✕</button>
      </div>`).join("");
  }
  function koormuseValjad(l) {
    const catSel = (l) => `<label class="fld only-b"><span>Liik</span><select data-f="cat">
        <option value="G"${l.cat === "G" ? " selected" : ""}>Alaline (G)</option>
        <option value="Q"${l.cat === "Q" ? " selected" : ""}>Muutuv (Q)</option></select></label>`;
    const fld = (lbl, f, v) => `<label class="fld"><span>${lbl}</span><input type="number" step="any" data-f="${f}" value="${v}"></label>`;
    let f = "";
      if (l.t === "P") f = fld("P, kN (↓ +)", "P", l.P) + fld("Asukoht x, m", "x", l.x);
      if (l.t === "M") f = fld("M, kNm", "M", l.M) + fld("Asukoht x, m", "x", l.x) +
        `<label class="fld"><span>Suund</span><select data-f="dir"><option value="1"${l.dir > 0 ? " selected" : ""}>↻ päripäeva</option><option value="-1"${l.dir < 0 ? " selected" : ""}>↺ vastupäeva</option></select></label>`;
      if (l.t === "q" && l.uh) f = fld("q, kN/m (↓ +)", "q1", l.q1) + fld("Algus a, m", "a", l.a) + fld("Lõpp b, m", "b", l.b);
      if (l.t === "q" && !l.uh) f = fld("q algus, kN/m", "q1", l.q1) + fld("q lõpp, kN/m", "q2", l.q2) + fld("Algus a, m", "a", l.a) + fld("Lõpp b, m", "b", l.b);
    return f + catSel(l);
  }
  const koormuseNimi = (l) => KOORM_NIMI[l.t === "q" ? (l.uh ? "q" : "trap") : l.t];
  function joonistaKoormused() {
    $("#koormused").innerHTML = olek.koormused.map((l) => `<div class="item load" data-id="${l.id}" data-kind="koormus">
        <div class="item-head"><span class="item-name">${koormuseNimi(l)}</span><button type="button" class="del" data-del title="Eemalda">✕</button></div>
        <div class="item-fields">${koormuseValjad(l)}</div>
      </div>`).join("") || `<p class="hint">Koormusi pole lisatud.</p>`;
  }
  function joonistaKõik() { joonistaToed(); joonistaLiigendid(); joonistaKoormused(); }

  function leiaObj(el) {
    const it = el.closest(".item");
    if (!it) return null;
    const id = +it.dataset.id;
    const kind = it.dataset.kind;
    const arr = kind === "tugi" ? olek.toed : kind === "liigend" ? olek.liigendid : olek.koormused;
    return { arr, obj: arr.find((o) => o.id === id), kind };
  }

  function onSisend(e) {
    const el = e.target;
    $("#leia-teade").textContent = "";
    if (el.id === "L" || el.dataset.f === "L") {
      const uus = num(el.value);
      if (el.id !== "L") $("#L").value = el.value;
      if (uus > 0) {
        const vana = olek.L;
        const liiguta = (x) => (Math.abs(x - vana) < 1e-9 ? uus : x);
        olek.toed.forEach((s) => (s.x = liiguta(s.x)));
        olek.koormused.forEach((l) => { if (l.t === "q") { l.a = liiguta(l.a); l.b = liiguta(l.b); } else l.x = liiguta(l.x); });
        olek.L = uus;
        if (Math.abs(vana - uus) > 1e-9) { joonistaToed(); joonistaKoormused(); }
      }
      return arvuta();
    }
    const o = leiaObj(el);
    if (o && o.obj && el.dataset.f) {
      const f = el.dataset.f;
      if (f === "t" || f === "cat") o.obj[f] = el.value;
      else if (f === "dir") o.obj.dir = +el.value;
      else {
        o.obj[f] = num(el.value);
        if (f === "q1" && o.obj.uh) o.obj.q2 = o.obj.q1;
      }
    }
    if (el.closest("#pop")) joonistaKõik();
    if (el.name === "mat") seadistaMaterjal();
    if (el.name === "reziim") document.body.classList.toggle("mode-b", reziim() === "kontroll");
    if (el.id === "kulg") $("#lcr-wrap").hidden = el.checked;
    arvuta();
  }

  function onKlikk(e) {
    const el = e.target;
    if (el.closest("button") && el.id !== "leia") $("#leia-teade").textContent = "";
    if (el.closest("[data-sulge]")) return sulgePop();
    if (el.closest("[data-del]")) {
      const o = leiaObj(el);
      if (o) { o.arr.splice(o.arr.indexOf(o.obj), 1); joonistaKõik(); arvuta(); }
      return;
    }
    const sk = el.closest("[data-skeem]");
    if (sk) {
      const L = olek.L;
      olek.toed = SKEEMID[sk.dataset.skeem].f(L).map(([t, x]) => ({ id: ++uid, t, x }));
      olek.liigendid = [];
      document.querySelectorAll("[data-skeem]").forEach((b) => b.classList.toggle("on", b === sk));
      joonistaKõik(); arvuta();
      return;
    }
    const la = el.closest("[data-lisa]");
    if (la) {
      const L = olek.L, t = la.dataset.lisa;
      const cat = "G";
      if (t === "P") olek.koormused.push({ id: ++uid, t: "P", P: 10, x: r1(L / 2), cat });
      if (t === "q") olek.koormused.push({ id: ++uid, t: "q", q1: 5, q2: 5, a: 0, b: L, cat, uh: true });
      if (t === "trap") olek.koormused.push({ id: ++uid, t: "q", q1: 0, q2: 5, a: 0, b: L, cat, uh: false });
      if (t === "M") olek.koormused.push({ id: ++uid, t: "M", M: 10, dir: 1, x: r1(L / 2), cat });
      if (t === "tugi") olek.toed.push({ id: ++uid, t: "rull", x: r1(L / 2) });
      if (t === "liigend") olek.liigendid.push({ id: ++uid, x: r1(L / 2) });
      document.querySelectorAll("[data-skeem]").forEach((b) => b.classList.remove("on"));
      joonistaKõik(); arvuta();
      return;
    }
    const ch = el.closest("[data-mootmed]");
    if (ch) {
      const [b, h] = ch.dataset.mootmed.split("x");
      $("#b").value = b; $("#h").value = h; arvuta();
      return;
    }
    if (el.id === "leia") leiaSobiv();
  }

  // ---------- Profiili valikud ----------
  function seadistaMaterjal() {
    const m = materjal();
    document.querySelectorAll(".only-teras").forEach((el) => (el.hidden = m !== "teras"));
    document.querySelectorAll(".only-puit").forEach((el) => (el.hidden = m === "teras"));
    const kl = $("#klass");
    const tabel = m === "liimpuit" ? LIIMPUIT : PUIT;
    const vana = kl.value;
    kl.innerHTML = Object.keys(tabel).map((k) => `<option>${k}</option>`).join("");
    kl.value = tabel[vana] ? vana : m === "liimpuit" ? "GL30h" : "C24";
  }

  function loeParameetrid() {
    return {
      mat: materjal(),
      seeria: $("#seeria").value, suurus: +$("#suurus").value, teras: $("#teras").value,
      klass: $("#klass").value, b: num($("#b").value), h: num($("#h").value),
      kk: +$("#kk").value, kestus: $("#kestus").value, psi2: num($("#psi2").value),
      piir: +$("#piir").value, gG: num($("#gG").value), gQ: num($("#gQ").value),
      omakaal: $("#omakaal").checked, kulg: $("#kulg").checked, lcr: num($("#lcr").value), c1: num($("#c1").value) || 1,
    };
  }

  // ---------- Mudel ja valideerimine ----------
  function mudelOlekust() {
    const L = olek.L;
    const vead = [], hoiat = [];
    if (!(L > 0)) vead.push("Sisesta tala pikkus L (m).");
    const sees = (x) => isFinite(x) && x >= -1e-9 && x <= L + 1e-9;
    olek.toed.forEach((s, i) => { if (!sees(s.x)) vead.push(`Toe ${i + 1} asukoht peab olema vahemikus 0…${fmt(L, 2)} m.`); });
    olek.liigendid.forEach((h, i) => {
      if (!sees(h.x) || h.x <= 1e-9 || h.x >= L - 1e-9) vead.push(`Sisemine liigend ${i + 1} peab olema tala sees (0 < x < L).`);
      if (olek.toed.some((s) => s.t === "jaik" && Math.abs(s.x - h.x) < 1e-9)) vead.push(`Sisemine liigend ${i + 1} on jäiga kinnituse kohal – see ei ole võimalik.`);
    });
    const xs = olek.toed.map((s) => s.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - xs[i - 1]) < 1e-9) vead.push("Kaks tuge on samas kohas – eemalda üks.");
    const koormused = [];
    olek.koormused.forEach((l, i) => {
      const nr = i + 1;
      if (l.t === "P") { if (!isFinite(l.P) || !sees(l.x)) vead.push(`Koormus ${nr}: kontrolli väärtust ja asukohta.`); else koormused.push({ id: l.id, t: "P", P: l.P, x: l.x, cat: l.cat }); }
      if (l.t === "M") { if (!isFinite(l.M) || !sees(l.x)) vead.push(`Koormus ${nr}: kontrolli väärtust ja asukohta.`); else koormused.push({ id: l.id, t: "M", M: l.M * l.dir, x: l.x, cat: l.cat }); }
      if (l.t === "q") {
        const q2 = l.uh ? l.q1 : l.q2;
        if (!isFinite(l.q1) || !isFinite(q2) || !sees(l.a) || !sees(l.b) || l.b <= l.a) vead.push(`Koormus ${nr}: kontrolli väärtusi; lõpp b peab olema suurem kui algus a ja tala piires.`);
        else koormused.push({ id: l.id, t: "q", q1: l.q1, q2, a: l.a, b: l.b, cat: l.cat });
      }
    });
    if (!olek.toed.length) vead.push("Lisa vähemalt üks tugi.");
    // staatiline määratus
    const r = olek.toed.reduce((s, t) => s + (t.t === "rull" ? 1 : t.t === "liigend" ? 2 : 3), 0);
    const nL = olek.liigendid.length;
    const maar = r - 3 - nL;
    if (olek.toed.length && !olek.toed.some((s) => s.t !== "rull")) hoiat.push("Kõik toed on liikuvad (rullid) – tala on horisontaalsuunas labiilne. Päris tarindis peab vähemalt üks tugi takistama ka horisontaalset liikumist (liikumatu liigend või jäik kinnitus). Vertikaalkoormuste sisejõud on siiski arvutatud.");
    return { mudel: { L, toed: olek.toed.map((s) => ({ id: s.id, t: s.t, x: s.x })), liigendid: olek.liigendid.map((h) => ({ id: h.id, x: h.x })), koormused }, vead, hoiat, maar };
  }

  // =====================================================================
  //  JOONISED
  // =====================================================================

  const VB_W = 760, ML = 46, MR = 46;
  const X = (x, L) => ML + (x / L) * (VB_W - ML - MR);

  function skeemSvg(mudel, reakts, opts = {}) {
    const { L, toed, liigendid, koormused } = mudel;
    const H = reakts ? 230 : 195, Yb = 115;
    let g = "";
    // lauskoormused (virnastatult)
    const qL = koormused.filter((l) => l.t === "q");
    const qMax = Math.max(1e-9, ...qL.map((l) => Math.max(Math.abs(l.q1), Math.abs(l.q2))));
    const tasemed = [];
    qL.forEach((l) => {
      let alus = Yb - 5;
      tasemed.forEach((t) => { if (t.a < l.b - 1e-9 && t.b > l.a + 1e-9) alus = Math.min(alus, t.top - 4); });
      const h1 = (Math.abs(l.q1) / qMax) * 32, h2 = (Math.abs(l.q2) / qMax) * 32;
      const x1 = X(l.a, L), x2 = X(l.b, L);
      const kat = l.cat === "Q" && opts.cat ? "q-var" : "q-perm";
      g += elAlgus("koormus", l.id, opts);
      g += `<rect class="hit" x="${x1}" y="${alus - Math.max(h1, h2) - 16}" width="${Math.max(6, x2 - x1)}" height="${Math.max(h1, h2) + 18}"/>`;
      g += `<polygon class="${kat}" points="${x1},${alus} ${x1},${alus - h1} ${x2},${alus - h2} ${x2},${alus}"/>`;
      const nA = Math.max(2, Math.round((x2 - x1) / 22));
      for (let i = 0; i <= nA; i++) {
        const xx = x1 + ((x2 - x1) * i) / nA;
        const hh = h1 + ((h2 - h1) * i) / nA;
        const qv = l.q1 + ((l.q2 - l.q1) * i) / nA;
        if (hh < 3) continue;
        g += qv >= 0 ? arrow(xx, alus - hh, xx, alus, "arr-q") : arrow(xx, alus, xx, alus - hh, "arr-q");
      }
      const lbl = Math.abs(l.q1 - l.q2) < 1e-9 ? `${fmt(l.q1, 2)} kN/m` : `${fmt(l.q1, 2)}…${fmt(l.q2, 2)} kN/m`;
      g += `<text class="lbl" x="${(x1 + x2) / 2}" y="${alus - Math.max(h1, h2) - 4}" text-anchor="middle">${lbl}${opts.cat ? ` (${l.cat})` : ""}</text>`;
      g += elLopp(l.id);
      tasemed.push({ a: l.a, b: l.b, top: alus - Math.max(h1, h2) - 14 });
    });
    // tala
    g += `<line class="beam" x1="${X(0, L)}" y1="${Yb}" x2="${X(L, L)}" y2="${Yb}"/>`;
    // toed
    toed.forEach((s) => {
      const px = X(s.x, L);
      g += elAlgus("tugi", s.id, opts) + `<rect class="hit" x="${px - 18}" y="${Yb - 22}" width="36" height="52"/>`;
      if (s.t === "jaik") {
        const pool = s.x < 1e-9 ? -1 : s.x > L - 1e-9 ? 1 : 0;
        if (pool) {
          g += `<line class="sup" x1="${px}" y1="${Yb - 20}" x2="${px}" y2="${Yb + 20}"/>`;
          for (let i = -20; i < 20; i += 6) g += `<line class="hatch" x1="${px}" y1="${Yb + i + 6}" x2="${px + pool * 7}" y2="${Yb + i}"/>`;
        } else {
          g += `<rect class="sup-fill" x="${px - 8}" y="${Yb - 14}" width="16" height="28"/>`;
        }
      } else {
        const t = s.t === "rull" ? 13 : 16;
        g += `<polygon class="sup" points="${px},${Yb + 2} ${px - 10},${Yb + t + 2} ${px + 10},${Yb + t + 2}"/>`;
        let base = Yb + t + 2;
        if (s.t === "rull") { g += `<circle class="sup" cx="${px - 5}" cy="${base + 3}" r="3"/><circle class="sup" cx="${px + 5}" cy="${base + 3}" r="3"/>`; base += 6; }
        g += `<line class="sup" x1="${px - 15}" y1="${base}" x2="${px + 15}" y2="${base}"/>`;
        for (let i = -14; i < 15; i += 6) g += `<line class="hatch" x1="${px + i}" y1="${base + 6}" x2="${px + i + 5}" y2="${base}"/>`;
      }
      g += elLopp(s.id);
    });
    liigendid.forEach((h) => { g += elAlgus("liigend", h.id, opts) + `<rect class="hit" x="${X(h.x, L) - 9}" y="${Yb - 9}" width="18" height="18"/><circle class="hinge" cx="${X(h.x, L)}" cy="${Yb}" r="4.5"/>` + elLopp(h.id); });
    // koondatud jõud ja momendid
    const qTop = Math.min(Yb - 62, ...tasemed.map((t) => t.top + 4));
    koormused.forEach((l) => {
      const px = X(l.x ?? 0, L);
      if (l.t === "P") g += elAlgus("koormus", l.id, opts) + `<rect class="hit" x="${px - 9}" y="${qTop}" width="18" height="${Yb - qTop}"/><rect class="hit" x="${px - 4}" y="${qTop - 16}" width="90" height="16"/>`;
      if (l.t === "M") g += elAlgus("koormus", l.id, opts) + `<rect class="hit" x="${px - 22}" y="${Yb - 44}" width="44" height="44"/>`;
      if (l.t === "P") {
        g += l.P >= 0 ? arrow(px, qTop, px, Yb - 3, "arr-p") : arrow(px, Yb - 3, px, qTop, "arr-p");
        g += `<text class="lbl strong" x="${px + 5}" y="${qTop - 2}">${fmt(Math.abs(l.P), 2)} kN${opts.cat ? ` (${l.cat})` : ""}</text>`;
      }
      if (l.t === "M") {
        const r = 17, cw = l.M >= 0;
        const a0 = cw ? Math.PI * 0.95 : Math.PI * 0.05, a1 = cw ? Math.PI * 0.05 : Math.PI * 0.95;
        const p0 = [px + r * Math.cos(a0), Yb - r * Math.sin(a0)], p1 = [px + r * Math.cos(a1), Yb - r * Math.sin(a1)];
        g += `<path class="arr-m" d="M${p0[0]},${p0[1]} A${r},${r} 0 0 ${cw ? 1 : 0} ${p1[0]},${p1[1]}"/>`;
        const dir = cw ? 1 : -1;
        g += `<polygon class="head-m" points="${p1[0]},${p1[1] + 1} ${p1[0] - 4 * dir},${p1[1] - 7} ${p1[0] + 4 * dir},${p1[1] - 5}"/>`;
        g += `<text class="lbl strong" x="${px}" y="${Yb - r - 6}" text-anchor="middle">${fmt(Math.abs(l.M), 2)} kNm${opts.cat ? ` (${l.cat})` : ""}</text>`;
      }
      if (l.t !== "q") g += elLopp(l.id);
    });
    // mõõtjoon
    const yd = Yb + 44;
    let key = [0, L, ...toed.map((s) => s.x), ...liigendid.map((h) => h.x)];
    koormused.forEach((l) => (l.t === "q" ? key.push(l.a, l.b) : key.push(l.x)));
    key = [...new Set(key.map((x) => Math.round(x * 1e6) / 1e6))].filter((x) => x >= 0 && x <= L).sort((a, b) => a - b);
    g += `<line class="dim" x1="${X(0, L)}" y1="${yd}" x2="${X(L, L)}" y2="${yd}"/>`;
    key.forEach((x, i) => {
      g += `<line class="dim" x1="${X(x, L)}" y1="${yd - 4}" x2="${X(x, L)}" y2="${yd + 4}"/>`;
      if (i > 0) {
        const a = key[i - 1];
        if (X(x, L) - X(a, L) > 26) g += `<text class="ax" x="${(X(a, L) + X(x, L)) / 2}" y="${yd - 4}" text-anchor="middle">${fmt(x - a, 2)}</text>`;
      }
    });
    g += (opts.ia ? `<g class="el el-L${opts.sel === "L" ? " sel" : ""}" data-kind="pikkus" data-id="L"><rect class="hit" x="${(X(0, L) + X(L, L)) / 2 - 45}" y="${yd + 3}" width="90" height="18"/>` : "") +
      `<text class="ax${opts.ia ? " editable" : ""}" x="${(X(0, L) + X(L, L)) / 2}" y="${yd + 16}" text-anchor="middle">L = ${fmt(L, 2)} m${opts.ia ? " ✎" : ""}</text>` + (opts.ia ? "</g>" : "");
    // reaktsioonid
    if (reakts) {
      reakts.forEach((r) => {
        const px = X(r.x, L);
        const anch = r.x < 1e-9 ? "start" : r.x > L - 1e-9 ? "end" : "middle";
        const dx = anch === "start" ? -8 : anch === "end" ? 8 : 0;
        g += `<text class="react" x="${px + dx}" y="${yd + 34}" text-anchor="${anch}">R = ${fmt(r.R, 2)} kN</text>`;
        if (r.t === "jaik") g += `<text class="react" x="${px + dx}" y="${yd + 49}" text-anchor="${anch}">M = ${fmt(-r.C, 2)} kNm</text>`;
      });
    }
    return `<svg class="chart scheme" viewBox="0 0 ${VB_W} ${H}" role="img" aria-label="Arvutusskeem">${defs()}${g}</svg>`;
  }

  let elAvatud = false;
  function elAlgus(kind, id, opts) {
    elAvatud = !!(opts.ia && id != null);
    return elAvatud ? `<g class="el${opts.sel === kind + id ? " sel" : ""}" data-kind="${kind}" data-id="${id}">` : "";
  }
  function elLopp() { const v = elAvatud ? "</g>" : ""; elAvatud = false; return v; }

  function defs() {
    return `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahead"/></marker></defs>`;
  }
  function arrow(x1, y1, x2, y2, cls) { return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#ah)"/>`; }

  // Epüür: andmed [{x, v}], positiivne üles (V) või alla (M, w)
  function epyyr(id, andmed, L, o) {
    const H = 170, Y0 = 92, amp = 56;
    const mx = Math.max(1e-12, ...andmed.map((p) => Math.abs(p.v)));
    const Y = (v) => Y0 + (o.alla ? 1 : -1) * (v / mx) * amp;
    const pts = andmed.map((p) => `${X(p.x, L).toFixed(2)},${Y(p.v).toFixed(2)}`).join(" ");
    const fill = `${X(andmed[0].x, L)},${Y0} ${pts} ${X(andmed[andmed.length - 1].x, L)},${Y0}`;
    let g = `<line class="zero" x1="${X(0, L)}" y1="${Y0}" x2="${X(L, L)}" y2="${Y0}"/>`;
    g += `<polygon class="fill-${o.cls}" points="${fill}"/><polyline class="line-${o.cls}" points="${pts}"/>`;
    // ekstreemumite sildid
    let pmx = andmed[0], pmn = andmed[0];
    andmed.forEach((p) => { if (p.v > pmx.v) pmx = p; if (p.v < pmn.v) pmn = p; });
    const silt = (p) => {
      if (Math.abs(p.v) < mx * 0.02) return "";
      const px = X(p.x, L), py = Y(p.v);
      const anch = px < 90 ? "start" : px > VB_W - 90 ? "end" : "middle";
      const dy = py > Y0 ? 14 : -6;
      return `<circle class="dot-${o.cls}" cx="${px}" cy="${py}" r="3"/><text class="val" x="${px}" y="${py + dy}" text-anchor="${anch}">${fmt(p.v, o.k ?? 2)}</text>`;
    };
    g += silt(pmx);
    if (Math.abs(pmn.v - pmx.v) > 1e-9) g += silt(pmn);
    g += `<text class="ttl" x="6" y="14">${o.pealkiri}</text>`;
    g += `<line class="cursor" x1="0" x2="0" y1="6" y2="${H - 6}" visibility="hidden"/>`;
    return `<svg class="chart diagram" id="${id}" viewBox="0 0 ${VB_W} ${H}" role="img" aria-label="${o.pealkiri}">${g}<rect class="hover" x="${ML}" y="0" width="${VB_W - ML - MR}" height="${H}"/></svg>`;
  }

  function interp(andmed, x, key) {
    // viimane punkt, mille x ≤ otsitav (paremalt pool katkestust)
    let i = 1;
    while (i < andmed.length - 1 && andmed[i].x < x) i++;
    const a = andmed[i - 1], b = andmed[i];
    if (b.x - a.x < 1e-12) return b[key];
    return a[key] + ((b[key] - a[key]) * (x - a.x)) / (b.x - a.x);
  }

  function seoHover(L, s, w, xs) {
    const svgs = [...document.querySelectorAll("#tulemus svg.diagram")];
    const out = $("#lugem");
    const nait = (x) => {
      const px = X(x, L);
      svgs.forEach((sv) => { const c = sv.querySelector(".cursor"); c.setAttribute("x1", px); c.setAttribute("x2", px); c.setAttribute("visibility", "visible"); });
      let t = `x = ${fmt(x, 2)} m · V = ${fmt(interp(s, x, "V"), 2)} kN · M = ${fmt(interp(s, x, "M"), 2)} kNm`;
      if (w) t += ` · w = ${fmt(interp(xs.map((xx, i) => ({ x: xx, w: w[i] })), x, "w"), 1)} mm`;
      out.textContent = t;
    };
    svgs.forEach((sv) => {
      const r = sv.querySelector(".hover");
      const liigu = (ev) => {
        const pt = sv.createSVGPoint();
        const e = ev.touches ? ev.touches[0] : ev;
        pt.x = e.clientX; pt.y = e.clientY;
        const p = pt.matrixTransform(sv.getScreenCTM().inverse());
        nait(Math.min(L, Math.max(0, ((p.x - ML) / (VB_W - ML - MR)) * L)));
      };
      r.addEventListener("mousemove", liigu);
      r.addEventListener("touchmove", (ev) => { liigu(ev); ev.preventDefault(); }, { passive: false });
    });
  }

  // =====================================================================
  //  TULEMUS
  // =====================================================================

  function arvuta() {
    const { mudel, vead, hoiat, maar } = mudelOlekust();
    const modeB = reziim() === "kontroll";
    if (mudel.L > 0) { $("#skeem-svg").innerHTML = skeemSvg(mudel, null, { cat: modeB, ia: true, sel: valitud ? valitud.kind + valitud.id : null }); paigutaPop(); }
    const res = $("#tulemus");
    if (vead.length) {
      res.className = "result calc-result warn";
      res.innerHTML = `<p class="result-label">Kontrolli sisendit</p><ul>${vead.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`;
      return;
    }
    const maarTxt = maar === 0 ? "staatikaga määratud" : maar > 0 ? `${maar} korda staatikaga määramatu` : "labiilne";
    let o, s, reakts, wPlot = null, xs;
    if (!modeB) {
      const sk = arvutaSkeem({ ...mudel, koormused: mudel.koormused.map((l) => ({ ...l, cat: "G" })) }, 1);
      if (sk.labiilne) return labiilne(res);
      const c = kombineeri(sk.juhud, [1, 0]);
      s = sisejoud(sk.xs, c.koormused, c.reakts); reakts = c.reakts; xs = sk.xs;
    } else {
      const prm = loeParameetrid();
      if (prm.mat !== "teras" && !(prm.b > 0 && prm.h > 0)) {
        res.className = "result calc-result warn";
        res.innerHTML = `<p class="result-label">Kontrolli sisendit</p><p>Sisesta puittala laius b ja kõrgus h (mm).</p>`;
        return;
      }
      if (!prm.kulg && !(prm.lcr > 0)) {
        res.className = "result calc-result warn";
        res.innerHTML = `<p class="result-label">Kontrolli sisendit</p><p>Sisesta külgtugede vahekaugus (m) või märgi tala külgsuunas toetatuks.</p>`;
        return;
      }
      o = prm.mat === "teras" ? kontrolliTeras(mudel, prm, iProfiil(SEERIAD[prm.seeria][prm.suurus])) : kontrolliPuit(mudel, prm);
      if (o.labiilne) return labiilne(res);
      o.prm = prm;
      s = o.halvim.s; reakts = o.halvim.c.reakts; wPlot = o.wPlot; xs = o.sk.xs;
    }
    const eM = ekstreemumid(s, "M"), eV = ekstreemumid(s, "V");
    const kirj = (p, yh) => `${fmt(p.v ?? 0, 2)} ${yh} (x = ${fmt(p.x, 2)} m)`;
    const skeemMudel = o && o.omakaal ? { ...mudel, koormused: mudel.koormused.concat([{ ...o.omakaal }]) } : mudel;
    let html = `
      <p class="result-label">${modeB ? `Arvutuslikud sisejõud – kombinatsioon ${o.halvim.kb.nimi}` : "Sisejõud"}</p>
      <p class="small">Skeem on ${maarTxt}. ${modeB ? "Koormused on sisestatud normväärtustena; sisejõud on arvutatud osateguritega." : "Koormused on arvestatud nii, nagu need on sisestatud (osateguriteta)."}</p>
      ${hoiat.map((h) => `<p class="extra warn-box">${esc(h)}</p>`).join("")}
      ${skeemSvg(skeemMudel, reakts, { cat: modeB })}
      <p class="lugem" id="lugem">Liiguta kursorit epüüril, et näha väärtusi suvalises kohas.</p>
      ${epyyr("ep-v", s.map((p) => ({ x: p.x, v: p.V })), mudel.L, { cls: "v", pealkiri: "Lõikejõud V, kN" })}
      ${epyyr("ep-m", s.map((p) => ({ x: p.x, v: p.M })), mudel.L, { cls: "m", alla: true, pealkiri: "Paindemoment M, kNm (joonistatud tõmmatud kiu poolele)" })}
      ${wPlot ? epyyr("ep-w", xs.map((x, i) => ({ x, v: -wPlot[i] })), mudel.L, { cls: "w", alla: true, k: 1, pealkiri: o.prm.mat === "teras" ? "Läbipaine w, mm (normkoormus G + Q)" : "Läbipaine w,fin, mm (lõplik, roomega)" }) : ""}
      <div class="table-wrap"><table class="layers-table">
        <tr><th>Suurus</th><th>Väärtus</th></tr>
        <tr><td>Suurim paindemoment M<sub>max</sub></td><td>${kirj({ v: eM.mx.M, x: eM.mx.x }, "kNm")}</td></tr>
        <tr><td>Väikseim paindemoment M<sub>min</sub></td><td>${kirj({ v: eM.mn.M, x: eM.mn.x }, "kNm")}</td></tr>
        <tr><td>Suurim lõikejõud |V|<sub>max</sub></td><td>${kirj({ v: eV.abs, x: Math.abs(eV.mx.V) >= Math.abs(eV.mn.V) ? eV.mx.x : eV.mn.x }, "kN")}</td></tr>
        ${reakts.map((r, i) => `<tr><td>Tugi ${i + 1} (${TOE_NIMI[r.t].toLowerCase()}, x = ${fmt(r.x, 2)} m)</td><td>R = ${fmt(r.R, 2)} kN ↑${r.t === "jaik" ? `; M<sub>tugi</sub> = ${fmt(-r.C, 2)} kNm` : ""}</td></tr>`).join("")}
      </table></div>
      <p class="small">Märgid: lõikejõud on positiivne, kui lõikest vasakule jäävate jõudude summa on üles suunatud; positiivne moment tõmbab alumist kiudu (läbipaindega tala keskel). Toe moment on positiivne vastupäeva.</p>`;
    if (modeB) html += kontrolliHtml(o);
    res.className = "result calc-result" + (modeB ? (Object.values(o.kontrollid).some((k) => k.util > 1) ? " warn" : " ok") : "");
    res.innerHTML = html;
    seoHover(mudel.L, s, wPlot, xs);
  }

  function labiilne(res) {
    res.className = "result calc-result warn";
    res.innerHTML = `<p class="result-label">Skeem on labiilne</p><h2>Tala ei püsi paigal</h2>
      <p>Valitud toed ja liigendid ei hoia tala paigal – mõni osa saab vabalt liikuda või pöörduda (mehhanism). Lisa tugi, muuda toe tüüpi või eemalda sisemine liigend.</p>
      <p class="small">Näiteks konsool vajab jäika kinnitust, lihttala kahte tuge ja iga sisemine liigend vajab lisatuge.</p>`;
  }

  function kontrolliHtml(o) {
    const p = o.prm;
    const k = Object.values(o.kontrollid);
    const max = Math.max(...k.map((x) => x.util));
    const ok = max <= 1;
    let sek = "";
    if (p.mat === "teras") {
      const q = o.sek;
      sek = `${esc(q.nimi)}, ${p.teras} · A = ${fmt(q.A / 100, 1)} cm², I<sub>y</sub> = ${fmt(q.Iy / 1e4, 0)} cm⁴, W<sub>pl,y</sub> = ${fmt(q.Wpl / 1e3, 1)} cm³, W<sub>el,y</sub> = ${fmt(q.Wel / 1e3, 1)} cm³, A<sub>v,z</sub> = ${fmt(q.Avz / 100, 1)} cm², mass ${fmt(q.mass, 1)} kg/m · ristlõike klass ${o.klass}`;
    } else {
      sek = `${p.mat === "liimpuit" ? "Liimpuit" : "Saetud puit"} ${p.klass}, ${fmt(p.b, 0)}×${fmt(p.h, 0)} mm · W = ${fmt(o.sek.Wm / 1e3, 1)} cm³, I = ${fmt(o.sek.I / 1e4, 0)} cm⁴ · kasutusklass ${p.kk}`;
    }
    const rida = (c) => {
      const pct = Math.round(c.util * 100);
      const cls = c.util > 1 ? "warn" : c.util > 0.9 ? "info" : "ok";
      return `<tr><td><strong>${c.nimi}</strong><br><small>${c.selg}</small></td>
        <td>${fmt(c.Ed, c.yhik === "mm" ? 1 : 2)} ${c.yhik}</td><td>${fmt(c.Rd, c.yhik === "mm" ? 1 : 2)} ${c.yhik}</td>
        <td><div class="util ${cls}"><span style="width:${Math.min(100, pct)}%"></span></div><strong class="u-${cls}">${pct} %</strong><br><small>${c.kombo}</small></td></tr>`;
    };
    return `
      <h3>Ristlõike kontroll</h3>
      <div class="u-verdict ${ok ? "ok" : "warn"}">${ok ? `Ristlõige sobib – suurim kasutusaste ${Math.round(max * 100)} %.` : `Ristlõige ei sobi – suurim kasutusaste ${Math.round(max * 100)} %. Vali suurem profiil või vajuta „Leia väikseim sobiv“.`}</div>
      <p class="small">${sek}${o.omakaal ? ` · omakaal ${fmt(o.omakaal.q1, 3)} kN/m lisatud alalise koormusena` : ""}</p>
      <div class="table-wrap"><table class="layers-table checks">
        <tr><th>Kontroll</th><th>Mõju</th><th>Kandevõime / piir</th><th>Kasutusaste</th></tr>
        ${k.map(rida).join("")}
      </table></div>
      <p class="small">Kontrollimata: toetuspinna muljumine${p.mat === "teras" ? ", seina lokaalne stabiilsus koondatud jõu all, ühendused" : " (k<sub>c,90</sub>), ühendused, võnkumine"}, tulepüsivus. Pidevtala puhul ei ole arvestatud muutuva koormuse ebasoodsat paigutust (ainult osa avasid koormatud).</p>`;
  }

  // ---------- Väikseima sobiva otsimine ----------
  function leiaSobiv() {
    const { mudel, vead } = mudelOlekust();
    if (vead.length) return arvuta();
    const prm = loeParameetrid();
    const ok = (o) => !o.labiilne && Object.values(o.kontrollid).every((k) => k.util <= 1);
    const teade = $("#leia-teade");
    if (prm.mat === "teras") {
      const sar = SEERIAD[prm.seeria];
      for (let i = 0; i < sar.length; i++) {
        const o = kontrolliTeras(mudel, prm, iProfiil(sar[i]));
        if (o.labiilne) return arvuta();
        if (ok(o) && o.klass <= 3) { $("#suurus").value = i; teade.textContent = `Väikseim sobiv: ${sar[i][0]}.`; return arvuta(); }
      }
      teade.textContent = `Seeria ${prm.seeria} ükski profiil ei sobi – proovi teist seeriat, tugevamat terast või lisa vahetugi.`;
    } else {
      for (const h of PUIT_H) {
        const o = kontrolliPuit(mudel, { ...prm, h });
        if (o.labiilne) return arvuta();
        if (ok(o)) { $("#h").value = h; teade.textContent = `Väikseim sobiv kõrgus laiusel ${fmt(prm.b, 0)} mm: ${h} mm.`; return arvuta(); }
      }
      teade.textContent = `Laiusel ${fmt(prm.b, 0)} mm ei sobi ükski kõrgus kuni ${PUIT_H[PUIT_H.length - 1]} mm – suurenda laiust või vali tugevam klass.`;
    }
    arvuta();
  }

  // ---------- Interaktiivne skeem ----------
  let valitud = null; // { kind, id }
  let lohis = null;

  function popSisu() {
    if (!valitud) return "";
    const { kind, id } = valitud;
    const pea = (nimi, del) => `<div class="pop-head"><strong>${nimi}</strong><span>${del ? `<button type="button" class="del" data-del title="Eemalda">🗑</button>` : ""}<button type="button" class="del" data-sulge title="Sulge">✕</button></span></div>`;
    const xf = (v) => `<label class="fld"><span>Asukoht x, m</span><input type="number" step="any" data-f="x" value="${v}"></label>`;
    if (kind === "pikkus") return pea("Tala pikkus", false) + `<div class="item-fields"><label class="fld"><span>L, m</span><input type="number" step="any" min="0" data-f="L" value="${olek.L}"></label></div>`;
    const arr = kind === "tugi" ? olek.toed : kind === "liigend" ? olek.liigendid : olek.koormused;
    const o = arr.find((q) => q.id === +id);
    if (!o) return null;
    if (kind === "tugi") return pea("Tugi", true) + `<div class="item-fields"><label class="fld"><span>Tüüp</span><select data-f="t">${Object.entries(TOE_NIMI).map(([k, v]) => `<option value="${k}"${k === o.t ? " selected" : ""}>${v}</option>`).join("")}</select></label>${xf(o.x)}</div>`;
    if (kind === "liigend") return pea("Sisemine liigend", true) + `<div class="item-fields">${xf(o.x)}</div>`;
    return pea(koormuseNimi(o), true) + `<div class="item-fields">${koormuseValjad(o)}</div>`;
  }
  function avaPop(kind, id) {
    valitud = { kind, id: String(id) };
    const p = $("#pop");
    p.dataset.kind = kind; p.dataset.id = id;
    p.innerHTML = popSisu() || "";
    p.hidden = false;
    arvuta();
    const i = p.querySelector("input");
    if (i) { i.focus(); i.select(); }
  }
  function sulgePop() { if (!valitud) return; valitud = null; $("#pop").hidden = true; arvuta(); }
  function paigutaPop() {
    const p = $("#pop");
    if (!valitud) { p.hidden = true; return; }
    const g = $("#skeem-svg").querySelector(`.el[data-kind="${valitud.kind}"][data-id="${valitud.id}"]`);
    if (!g) { if (p.contains(document.activeElement)) return; valitud = null; p.hidden = true; return; }
    if (!p.contains(document.activeElement)) { const sisu = popSisu(); if (sisu === null) { valitud = null; p.hidden = true; return; } p.innerHTML = sisu; }
    p.hidden = false;
    const cr = $("#eelvaade").getBoundingClientRect(), br = g.getBoundingClientRect();
    const w = p.offsetWidth;
    const sr = $("#skeem-svg").getBoundingClientRect();
    p.style.top = `${sr.bottom - cr.top + 4}px`;
    p.style.left = `${Math.max(0, Math.min(cr.width - w, br.left + br.width / 2 - cr.left - w / 2))}px`;
  }

  function lohistaAlgus(e) {
    const g = e.target.closest(".el");
    if (!g) return;
    const kind = g.dataset.kind, id = g.dataset.id;
    let obj = null;
    if (kind !== "pikkus") {
      const arr = kind === "tugi" ? olek.toed : kind === "liigend" ? olek.liigendid : olek.koormused;
      obj = arr.find((q) => q.id === +id);
    }
    lohis = { kind, id, obj, x0: e.clientX, liikus: false, orig: obj ? { x: obj.x, a: obj.a, b: obj.b } : null };
    $("#skeem-svg").setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function lohistaLiigu(e) {
    if (!lohis || !lohis.obj) return;
    const dx = e.clientX - lohis.x0;
    if (!lohis.liikus && Math.abs(dx) < 4) return;
    lohis.liikus = true;
    const svg = $("#skeem-svg svg");
    const L = olek.L;
    const mPx = L / ((VB_W - ML - MR) * svg.getBoundingClientRect().width / VB_W);
    const samm = L <= 10 ? 0.05 : 0.1;
    const snap = (v) => Math.round(Math.min(L, Math.max(0, v)) / samm) * samm;
    const o = lohis.obj, d = dx * mPx;
    if (o.t === "q") {
      const pikk = lohis.orig.b - lohis.orig.a;
      let a = snap(lohis.orig.a + d);
      if (a + pikk > L + 1e-9) a = L - pikk;
      o.a = r1(Math.max(0, a)); o.b = r1(o.a + pikk);
    } else o.x = r1(snap(lohis.orig.x + d));
    document.querySelectorAll("[data-skeem]").forEach((b) => b.classList.remove("on"));
    joonistaKõik(); arvuta();
  }
  function lohistaLopp() {
    if (!lohis) return;
    const l = lohis; lohis = null;
    if (!l.liikus) avaPop(l.kind, l.id);
    else if (valitud) { $("#pop").innerHTML = popSisu() || ""; paigutaPop(); }
  }

  // ---------- Käivitus ----------
  function init() {
    $("#kestus").innerHTML = Object.entries(KESTUS).map(([k, v]) => `<option value="${k}"${k === "keskmine" ? " selected" : ""}>${v.nimi}</option>`).join("");
    $("#seeria").innerHTML = Object.keys(SEERIAD).map((k) => `<option>${k}</option>`).join("");
    $("#suurus").innerHTML = SEERIAD.IPE.map((p, i) => `<option value="${i}">${p[0]}</option>`).join("");
    $("#suurus").value = 6;
    $("#seeria").addEventListener("change", () => { const i = Math.min(+$("#suurus").value || 0, SEERIAD[$("#seeria").value].length - 1); $("#suurus").innerHTML = SEERIAD[$("#seeria").value].map((p, j) => `<option value="${j}">${p[0]}</option>`).join(""); $("#suurus").value = i; arvuta(); });
    seadistaMaterjal();
    $("#L").value = olek.L;
    joonistaKõik();
    document.body.classList.toggle("mode-b", reziim() === "kontroll");
    $("#lcr-wrap").hidden = $("#kulg").checked;
    const vorm = $(".checker");
    vorm.addEventListener("input", (e) => { if (e.target.id !== "seeria") onSisend(e); });
    vorm.addEventListener("click", onKlikk);
    const sv = $("#skeem-svg");
    sv.addEventListener("pointerdown", lohistaAlgus);
    sv.addEventListener("pointermove", lohistaLiigu);
    sv.addEventListener("pointerup", lohistaLopp);
    sv.addEventListener("pointercancel", () => { lohis = null; });
    document.addEventListener("pointerdown", (e) => { if (valitud && !e.target.closest("#pop") && !e.target.closest("#skeem-svg .el")) sulgePop(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") sulgePop(); });
    window.addEventListener("resize", paigutaPop);
    arvuta();
  }
  init();
})();
