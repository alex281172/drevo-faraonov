/* Схемы для сайта «Древо фараонов»: профили пирамид в едином масштабе, разрезы гробниц, планы, карты.
   Все цвета – через CSS-классы sc-*, которые берут токены темы со страницы. */
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const f1 = n => (Math.round(n * 10) / 10).toString().replace(".", ",");
  const deg = a => { const d = Math.floor(a), m = Math.round((a - d) * 60); return m ? `${d}°${String(m).padStart(2, "0")}′` : `${d}°`; };
  const rad = a => a * Math.PI / 180;
  const svg = (w, h, body, label, cls = "") => `<svg class="scheme${cls ? " " + cls : ""}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || "Схема")}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  const txt = (x, y, s, cls = "sc-label", anchor = "start", extra = "") => `<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
  const f = n => Math.round(n * 10) / 10;
  const DEFS = `<defs>
    <pattern id="sc-brickpat" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" class="sc-brick"/><path d="M0 3H10M5 0V3M0 3V6M10 3V6" class="sc-brickline"/></pattern>
    <pattern id="sc-rockpat" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" class="sc-rock"/><path d="M0 9L9 0" class="sc-rockline"/></pattern>
    <marker id="sc-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="sc-arrowhead"/></marker>
  </defs>`;

  /* ---------- Профиль пирамиды в масштабе ---------- */
  const S = 1.55;            // пикселей на метр – одинаково для всех пирамид
  const KHUFU = { base: 230.3, height: 146.6 };
  function pyramidShape(p, cx, g, s) {
    const b = p.base * s, h = (p.height || 0) * s;
    if (p.shape === "step") {
      const n = p.steps || 6, top = b * (p.topRatio || 0.3), sh = h / n, parts = [];
      for (let i = 0; i < n; i++) {
        const w0 = b - (b - top) * i / n, w1 = b - (b - top) * (i + 1) / n + 6;
        const y0 = g - sh * i, y1 = g - sh * (i + 1);
        const bot = w0, topw = Math.max(w1 - 4, top);
        parts.push(`M${f(cx - bot / 2)} ${f(y0)}L${f(cx - topw / 2)} ${f(y1)}L${f(cx + topw / 2)} ${f(y1)}L${f(cx + bot / 2)} ${f(y0)}Z`);
      }
      return parts.join("");
    }
    if (p.shape === "bent") {
      const hb = p.bendAt * s, xb = b / 2 - hb / Math.tan(rad(p.angle));
      const apex = hb + xb * Math.tan(rad(p.angle2));
      return `M${f(cx - b / 2)} ${f(g)}L${f(cx - xb)} ${f(g - hb)}L${f(cx)} ${f(g - apex)}L${f(cx + xb)} ${f(g - hb)}L${f(cx + b / 2)} ${f(g)}Z`;
    }
    if (p.shape === "frustum") { // недостроенная или превращённая в мастабу
      const hb = p.built * s, ang = p.angle || 52, xt = b / 2 - hb / Math.tan(rad(ang));
      return `M${f(cx - b / 2)} ${f(g)}L${f(cx - xt)} ${f(g - hb)}L${f(cx + xt)} ${f(g - hb)}L${f(cx + b / 2)} ${f(g)}Z`;
    }
    if (p.shape === "ruin") {
      const hn = (p.now || 10) * s;
      return `M${f(cx - b / 2)} ${f(g)}C${f(cx - b / 3)} ${f(g - hn)} ${f(cx + b / 3)} ${f(g - hn)} ${f(cx + b / 2)} ${f(g)}Z`;
    }
    return `M${f(cx - b / 2)} ${f(g)}L${f(cx)} ${f(g - h)}L${f(cx + b / 2)} ${f(g)}Z`;
  }

  function pyramidProfile(m, opt = {}) {
    const p = m.dims || {};
    const isKhufu = m.id === "m-khufu";
    const W = 560, g = 258, cx = W / 2;
    let body = DEFS;
    // земля
    body += `<rect x="0" y="${g}" width="${W}" height="62" class="sc-ground"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    // Великая пирамида для сравнения
    if (!isKhufu && !opt.noGhost) body += `<path d="${pyramidShape({ base: KHUFU.base, height: KHUFU.height }, cx, g, S)}" class="sc-ghost"/>`;
    // задуманная форма
    if (p.planned) body += `<path d="${pyramidShape({ base: p.base, height: p.planned, shape: "true" }, cx, g, S)}" class="sc-planned"/>`;
    // сама пирамида
    const fillCls = p.core === "brick" ? "sc-brickfill" : "sc-stone";
    body += `<path d="${pyramidShape(p, cx, g, S)}" class="${fillCls}"/>`;
    if (p.core === "brick" && p.shape !== "ruin" && p.shape !== "frustum") body += `<path d="${pyramidShape(p, cx, g, S)}" class="sc-casing"/>`;
    // подземная камера
    if (p.chamber) {
      const d = p.chamber * S, x = cx + (p.chamberX || 0) * S;
      body += `<path d="M${f(x)} ${g}V${f(g + d - 6)}" class="sc-shaft"/><rect x="${f(x - 9)}" y="${f(g + d - 6)}" width="18" height="9" class="sc-room"/>`;
      body += txt(x + 14, g + d + 2, `камера на глубине ≈${f1(p.chamber)} м`, "sc-small");
    }
    // размеры
    const b = p.base * S, h = (p.shape === "frustum" ? p.built : p.shape === "ruin" ? (p.now || 0) : (p.height || 0)) * S;
    const x0 = cx - b / 2, x1 = cx + b / 2;
    body += `<path d="M${f(x0)} ${g + 16}H${f(x1)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>`;
    body += txt(cx, g + 31, `основание ${f1(p.base)} м`, "sc-dimtext", "middle");
    if (h > 0) {
      const hx = Math.min(x1 + 18, W - 70);
      body += `<path d="M${f(hx)} ${g}V${f(g - h)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>`;
      const hl = p.shape === "frustum" ? `${f1(p.built)} м` : p.shape === "ruin" ? `≈${f1(p.now)} м` : `${f1(p.height)} м`;
      body += txt(hx + 6, g - h / 2 + 4, hl, "sc-dimtext");
    }
    if (p.planned) body += txt(cx, g - p.planned * S - 6, `задумано ≈${f1(p.planned)} м`, "sc-small", "middle");
    if (p.angle && p.shape !== "ruin") {
      body += txt(x0 + 6, g - 8, p.shape === "bent" ? `${deg(p.angle)} / ${deg(p.angle2)}` : deg(p.angle), "sc-small");
    }
    if (p.shape === "bent") body += txt(cx + 70, g - p.bendAt * S + 4, `излом на высоте ≈${f1(p.bendAt)} м`, "sc-small");
    // крошечную пирамиду дополнительно показываем крупно
    if (p.base < 30 && p.height) {
      const z = 6 * S, ix = 96, ig = 214, bx0 = 14, bx1 = 214;
      body += `<rect x="${bx0}" y="40" width="${bx1 - bx0}" height="${ig - 26}" rx="6" class="sc-inset-box"/>`;
      body += `<path d="${pyramidShape(p, ix, ig, z)}" class="${fillCls}"/>`;
      if (p.core === "brick") body += `<path d="${pyramidShape(p, ix, ig, z)}" class="sc-casing"/>`;
      body += `<path d="M${bx0 + 10} ${ig}H${bx1 - 10}" class="sc-groundline"/>`;
      body += txt(ix, ig + 16, `${f1(p.base)} м`, "sc-dimtext", "middle") + txt(ix + p.base * z / 2 + 8, ig - p.height * z / 2, `${f1(p.height)} м`, "sc-dimtext");
      body += txt((bx0 + bx1) / 2, 58, "та же пирамида крупнее в 6 раз", "sc-small", "middle");
      body += `<path d="M${f(cx - 6)} ${f(g - h - 4)}L${bx1} ${ig - 70}" class="sc-leader"/>`;
    }
    // масштаб
    body += `<path d="M14 ${g + 50}H${f(14 + 50 * S)}" class="sc-scale"/><path d="M14 ${g + 46}V${g + 54}M${f(14 + 50 * S)} ${g + 46}V${g + 54}" class="sc-scale"/>`;
    body += txt(14, g + 44, "50 м", "sc-small");
    if (!isKhufu && !opt.noGhost) body += txt(W - 10, 18, "пунктир – Великая пирамида Хуфу в том же масштабе", "sc-small", "end");
    if (p.planned) body += txt(W - 10, 34, "штрих – задуманная форма", "sc-small", "end");
    return svg(W, 322, body, `Профиль: ${m.name}`);
  }

  /* ---------- Разрез Великой пирамиды ---------- */
  function khufuSection() {
    const s = 2.0, W = 820, g = 330, cx = 420;
    const P = (x, y) => `${f(cx + x * s)} ${f(g - y * s)}`; // x – от центра к югу (вправо), y – высота
    let b = DEFS;
    b += `<rect x="0" y="${g}" width="${W}" height="90" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<path d="M${P(-115.15, 0)}L${P(0, 146.6)}L${P(115.15, 0)}Z" class="sc-stone"/>`;
    // проходы
    const ent = [-101.8, 17];
    b += `<path d="M${P(ent[0], ent[1])}L${P(-2, -30)}L${P(8, -30)}" class="sc-passage"/>`;
    b += `<path d="M${P(-73, -0.5)}L${P(-45, 21.5)}" class="sc-passage"/>`; // восходящий
    b += `<path d="M${P(-45, 21.5)}L${P(-3, 43)}" class="sc-gallery"/>`; // Большая галерея
    b += `<path d="M${P(-45, 21)}L${P(-2.5, 21)}" class="sc-passage"/>`;
    // камеры
    b += `<rect x="${f(cx - 2.6 * s)}" y="${f(g - 26.7 * s)}" width="${f(5.2 * s)}" height="${f(6.2 * s)}" class="sc-room"/>`; // камера царицы
    b += `<rect x="${f(cx - 0.5 * s)}" y="${f(g - 48.8 * s)}" width="${f(10.5 * s)}" height="${f(5.8 * s)}" class="sc-room"/>`; // камера царя
    for (let i = 0; i < 5; i++) b += `<rect x="${f(cx - 0.5 * s)}" y="${f(g - (51 + i * 3.3) * s)}" width="${f(10.5 * s)}" height="${f(1.2 * s)}" class="sc-relief"/>`;
    b += `<path d="M${P(-1, 64)}L${P(5.2, 68)}L${P(11, 64)}" class="sc-passage"/>`;
    b += `<rect x="${f(cx - 4 * s)}" y="${f(g + 27 * s)}" width="${f(14 * s)}" height="${f(5 * s)}" class="sc-room"/>`; // подземная камера
    // вентиляционные шахты
    b += `<path d="M${P(0, 46)}L${P(-60, 99)}M${P(10, 46)}L${P(70, 92)}" class="sc-airshaft"/>`;
    b += `<path d="M${P(-2.6, 23)}L${P(-38, 60)}M${P(2.6, 23)}L${P(38, 60)}" class="sc-airshaft"/>`;
    // подписи
    const L = (x, y, tx, ty, t, a = "start") => `<path d="M${P(x, y)}L${P(tx, ty)}" class="sc-leader"/>` + txt(cx + tx * s + (a === "end" ? -4 : 4), g - ty * s + 4, t, "sc-label", a);
    b += L(5, 50, 62, 120, "Камера царя с гранитным саркофагом");
    b += L(5, 61, 40, 136, "Разгрузочные камеры");
    b += L(0, 24, 58, 30, "«Камера царицы»");
    b += L(-25, 32, -70, 78, "Большая галерея", "end");
    b += L(-60, 8, -116, 46, "Восходящий коридор", "end");
    b += L(ent[0], ent[1], -132, 26, "Вход на высоте 17 м", "end");
    b += L(-50, -7, -112, -26, "Нисходящий коридор", "end");
    b += L(10, -28, 58, -28, "Подземная камера, ≈30 м под землёй");
    b += L(-40, 82, -88, 102, "Узкие шахты", "end");
    b += txt(cx, g - 146.6 * s - 8, "146,6 м", "sc-dimtext", "middle");
    b += txt(10, 18, "Разрез с севера (слева) на юг (справа), масштаб условный", "sc-small");
    return svg(W, 410, b, "Разрез Великой пирамиды Хуфу", "scheme-zoom");
  }

  /* ---------- Мастаба в разрезе ---------- */
  function mastaba(m) {
    const p = m.dims || {}, W = 560, g = 170;
    const L = p.length || 50, H = p.height || 8, D = p.depth || 12;
    const s = Math.min(380 / L, 90 / H, 7);
    const x0 = (W - L * s) / 2, x1 = x0 + L * s, top = g - H * s, bat = Math.min(H * s * 0.25, 14);
    let b = DEFS + `<rect x="0" y="${g}" width="${W}" height="150" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    const fill = p.material === "stone" ? "sc-stone" : "url(#sc-brickpat)";
    b += `<path d="M${f(x0)} ${g}L${f(x0 + bat)} ${f(top)}H${f(x1 - bat)}L${f(x1)} ${g}Z" fill="${fill.startsWith("url") ? fill : ""}" class="${fill.startsWith("url") ? "sc-outline" : fill}"/>`;
    if (p.niches) for (let x = x0 + 10; x < x1 - 10; x += 14) b += `<path d="M${f(x)} ${f(top + 3)}V${g - 2}" class="sc-niche"/>`;
    const sx = (x0 + x1) / 2, ds = Math.min(D * s, 110);
    b += `<rect x="${f(sx - 6)}" y="${f(top)}" width="12" height="${f(g - top + ds - 14)}" class="sc-shaftfill"/>`;
    b += `<rect x="${f(sx + 6)}" y="${f(g + ds - 22)}" width="44" height="22" class="sc-room"/>`;
    b += txt(sx + 56, g + ds - 7, "погребальная камера", "sc-label");
    b += txt(sx - 12, g + ds / 2, p.depth ? `шахта ≈${f1(D)} м` : "шахта", "sc-label", "end");
    if (p.chapel !== false) { b += `<rect x="${f(x1 - bat - 24)}" y="${f(g - Math.min(H * s, 40) + 4)}" width="16" height="${f(Math.min(H * s, 40) - 6)}" class="sc-chapel"/>`; b += x1 + 190 < W ? txt(x1 + 8, top + 12, "молельня с ложной дверью", "sc-label") : txt(x1, top - 8, "молельня с ложной дверью", "sc-label", "end"); }
    if (p.length) b += `<path d="M${f(x0)} ${g + 16}H${f(x1)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt((x0 + x1) / 2, g + 30, `≈${f1(L)} м`, "sc-dimtext", "middle");
    b += txt(x0, top - (p.chapel !== false && x1 + 190 >= W ? 26 : 8), p.material === "stone" ? "каменная мастаба" : "кирпичная мастаба", "sc-small");
    b += txt(10, 18, "Разрез, масштаб условный", "sc-small");
    return svg(W, 300, b, `Разрез мастабы: ${m.name}`);
  }

  /* ---------- Царская гробница Абидоса (план) ---------- */
  function abydos(m) {
    const p = m.dims || {}, W = 560, Hh = 320;
    const cw = Math.min((p.width || 12) * 9, 220), ch = Math.min((p.length || 10) * 9, 150);
    const cx = W / 2, cy = 150, x0 = cx - cw / 2, y0 = cy - ch / 2;
    let b = DEFS + `<rect x="0" y="0" width="${W}" height="${Hh}" class="sc-sand"/>`;
    b += `<rect x="${f(x0)}" y="${f(y0)}" width="${f(cw)}" height="${f(ch)}" class="sc-brickwall"/>`;
    b += `<rect x="${f(x0 + 10)}" y="${f(y0 + 10)}" width="${f(cw - 20)}" height="${f(ch - 20)}" class="sc-room"/>`;
    if (p.cells) { const n = p.cells; for (let i = 1; i < n; i++) b += `<path d="M${f(x0 + 10 + (cw - 20) * i / n)} ${f(y0 + 10)}V${f(y0 + 10 + (ch - 20) * 0.28)}" class="sc-cellwall"/>`; }
    b += txt(cx, cy + 4, "погребальная камера", "sc-label", "middle");
    const n = p.subsidiary || 0;
    if (n) {
      const ring = Math.min(n, 120), per = Math.ceil(ring / 4), gap = 16;
      const sides = [[x0 - gap, y0 - gap, x0 + cw + gap, y0 - gap], [x0 + cw + gap, y0 - gap, x0 + cw + gap, y0 + ch + gap], [x0 + cw + gap, y0 + ch + gap, x0 - gap, y0 + ch + gap], [x0 - gap, y0 + ch + gap, x0 - gap, y0 - gap]];
      let k = 0;
      sides.forEach(([ax, ay, bx, by]) => { for (let i = 0; i < per && k < ring; i++, k++) { const t = (i + 0.5) / per, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; b += `<rect x="${f(x - 3.5)}" y="${f(y - 3.5)}" width="7" height="7" class="sc-grave"/>`; } });
      b += txt(x0 - gap, y0 - gap - 12, `погребения слуг вокруг: ${n}${n > ring ? " (показана часть)" : ""}`, "sc-label");
    }
    if (p.stair) { b += `<path d="M${f(x0 + cw + 70)} ${f(cy)}H${f(x0 + cw + 2)}" class="sc-stair" marker-end="url(#sc-arr)"/>`; b += txt(x0 + cw + 74, cy + 4, "лестница", "sc-label"); }
    if (p.granite) b += txt(cx, cy + 20, "пол из красного гранита", "sc-small", "middle");
    b += `<path d="M20 ${Hh - 24}H${f(20 + 10 * 9)}" class="sc-scale"/>` + txt(20, Hh - 30, "10 м", "sc-small");
    b += txt(W - 10, 18, "План сверху", "sc-small", "end");
    return svg(W, Hh, b, `План гробницы: ${m.name}`);
  }

  /* ---------- Подземные галереи ---------- */
  function gallery(m) {
    const W = 560, H = 260, y = 130; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-rockfill"/>`;
    b += `<path d="M60 ${y}H500" class="sc-corridor"/>`;
    for (let x = 90; x < 480; x += 38) { b += `<path d="M${x} ${y}V${y - 42}M${x + 14} ${y}V${y + 46}" class="sc-corridor-thin"/>`; }
    b += `<rect x="470" y="${y - 22}" width="40" height="44" class="sc-room"/>` + txt(490, y + 40, "камера царя", "sc-label", "middle");
    b += `<path d="M30 ${y}H60" class="sc-stair" marker-end="url(#sc-arr)"/>` + txt(30, y - 10, "вход", "sc-label");
    b += txt(W / 2, 30, "План: длинный коридор с десятками кладовых, вырубленных в скале", "sc-small", "middle");
    b += txt(W / 2, H - 14, "≈120 м, масштаб условный", "sc-small", "middle");
    return svg(W, H, b, `План галерейной гробницы: ${m.name}`);
  }

  /* ---------- Ограда (план) ---------- */
  function enclosure(m) {
    const p = m.dims || {}, W = 560, H = 300, L = p.length || 124, Wd = p.width || 56, s = Math.min(460 / L, 200 / Wd);
    const x0 = (W - L * s) / 2, y0 = (H - Wd * s) / 2;
    let b = DEFS + `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="${f(x0)}" y="${f(y0)}" width="${f(L * s)}" height="${f(Wd * s)}" class="sc-brickwall-thick"/>`;
    for (let x = x0 + 6; x < x0 + L * s - 4; x += 8) b += `<path d="M${f(x)} ${f(y0 - 3)}V${f(y0 + 3)}M${f(x)} ${f(y0 + Wd * s - 3)}V${f(y0 + Wd * s + 3)}" class="sc-niche"/>`;
    b += `<rect x="${f(x0 + L * s * 0.15)}" y="${f(y0 + Wd * s * 0.35)}" width="${f(L * s * 0.08)}" height="${f(Wd * s * 0.3)}" class="sc-chapel"/>`;
    b += txt(W / 2, y0 - 14, `стены из сырцового кирпича, ${L} × ${Wd} м, высота до ${p.height || 11} м`, "sc-label", "middle");
    b += txt(W / 2, H - 14, "План сверху; стены украшены выступами-нишами, как фасад дворца", "sc-small", "middle");
    return svg(W, H, b, `План ограды: ${m.name}`);
  }

  /* ---------- Гробница-«саркофаг» ---------- */
  function sarcophagus(m) {
    const p = m.dims || {}, W = 560, g = 220, L = p.length || 99.6, H = p.height || 18, s = Math.min(420 / L, 6);
    const x0 = (W - L * s) / 2, x1 = x0 + L * s, top = g - H * s;
    let b = DEFS + `<rect x="0" y="${g}" width="${W}" height="80" class="sc-ground"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<path d="M${f(x0)} ${g}L${f(x0 + 6)} ${f(top + 12)}Q${f((x0 + x1) / 2)} ${f(top - 14)} ${f(x1 - 6)} ${f(top + 12)}L${f(x1)} ${g}Z" class="sc-stone"/>`;
    b += `<rect x="${f(x0 + 2)}" y="${f(top - 2)}" width="16" height="16" class="sc-stone"/><rect x="${f(x1 - 18)}" y="${f(top - 2)}" width="16" height="16" class="sc-stone"/>`;
    b += `<path d="M${f(x0)} ${g + 16}H${f(x1)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt(W / 2, g + 31, `${f1(L)} м`, "sc-dimtext", "middle");
    b += txt(W / 2, top - 22, `высота ≈${H} м; форма огромного саркофага со сводом и торцевыми выступами`, "sc-label", "middle");
    b += txt(10, 18, "Вид сбоку", "sc-small");
    return svg(W, 300, b, `Профиль: ${m.name}`);
  }

  /* ---------- Двухступенчатая гробница (Хенткаус I) ---------- */
  function stepMastaba(m) {
    const W = 560, g = 230, s = 6;
    const L = 45.5, H1 = 10, L2 = 28, H2 = 7.5, x0 = (W - L * s) / 2, x2 = (W - L2 * s) / 2;
    let b = DEFS + `<rect x="0" y="${g}" width="${W}" height="70" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<path d="M${f(x0)} ${g}L${f(x0 + 4)} ${f(g - H1 * s)}H${f(x0 + L * s - 4)}L${f(x0 + L * s)} ${g}Z" class="sc-rockfill-raised"/>`;
    b += `<path d="M${f(x2)} ${f(g - H1 * s)}L${f(x2 + 6)} ${f(g - (H1 + H2) * s)}H${f(x2 + L2 * s - 6)}L${f(x2 + L2 * s)} ${f(g - H1 * s)}Z" class="sc-stone"/>`;
    b += txt(x0 + L * s + 8, g - H1 * s / 2 - 4, "нижняя ступень –", "sc-label") + txt(x0 + L * s + 8, g - H1 * s / 2 + 12, "обтёсанная скала", "sc-label");
    b += txt(x2 + L2 * s + 8, g - (H1 + H2 / 2) * s - 8, "верхняя ступень –", "sc-label") + txt(x2 + L2 * s + 8, g - (H1 + H2 / 2) * s + 8, "каменная кладка", "sc-label");
    b += `<path d="M${f(x0)} ${g + 16}H${f(x0 + L * s)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt(W / 2, g + 31, "≈45 м", "sc-dimtext", "middle");
    b += txt(10, 18, "Вид сбоку, высота ≈17,5 м", "sc-small");
    return svg(W, 300, b, `Профиль: ${m.name}`);
  }

  /* ---------- Шахтная гробница ---------- */
  function shaft(m) {
    const p = m.dims || {}, W = 560, g = 60, D = p.depth || 20, s = Math.min(200 / D, 8);
    let b = DEFS + `<rect x="0" y="${g}" width="${W}" height="${300 - g}" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    const x = W / 2 - 60;
    b += `<rect x="${x - 10}" y="${g}" width="20" height="${f(D * s)}" class="sc-shaftfill"/>`;
    b += `<rect x="${x + 10}" y="${f(g + D * s - 30)}" width="70" height="30" class="sc-room"/>`;
    b += txt(x + 90, g + D * s - 10, p.room || "камера", "sc-label");
    if (p.depth) b += `<path d="M${x - 28} ${g}V${f(g + D * s)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt(x - 34, g + D * s / 2, `≈${f1(D)} м`, "sc-dimtext", "end");
    b += txt(10, 18, "Разрез, масштаб условный", "sc-small");
    return svg(W, 300, b, `Разрез: ${m.name}`);
  }

  /* ---------- Скальная гробница ---------- */
  function rock(m) {
    const p = m.dims || {}, W = 560, H = 300; let b = DEFS;
    b += `<path d="M0 90L150 90L190 70L560 70L560 300L0 300Z" class="sc-rockfill"/><path d="M0 90L150 90L190 70L560 70" class="sc-groundline"/>`;
    b += `<path d="M0 150H200" class="sc-groundline"/><rect x="0" y="150" width="200" height="150" class="sc-sand"/>`;
    b += `<rect x="200" y="96" width="${p.deep ? 200 : 150}" height="54" class="sc-room"/>`;
    for (let x = 230; x < (p.deep ? 390 : 340); x += 34) b += `<rect x="${x}" y="96" width="8" height="54" class="sc-pillar"/>`;
    b += `<rect x="${p.deep ? 360 : 300}" y="150" width="12" height="90" class="sc-shaftfill"/><rect x="${p.deep ? 372 : 312}" y="222" width="54" height="22" class="sc-room"/>`;
    b += txt(205, 90, p.hall || "молельня, вырубленная в скале", "sc-label");
    b += txt(p.deep ? 432 : 372, 238, "погребальная камера", "sc-label");
    b += txt(10, 18, "Разрез, масштаб условный", "sc-small");
    return svg(W, H, b, `Разрез: ${m.name}`);
  }

  /* ---------- Террасный храм-гробница Ментухотепа II ---------- */
  function terrace(m) {
    const W = 600, g = 250; let b = DEFS;
    b += `<path d="M420 ${g}L440 40L600 30L600 ${g}Z" class="sc-rockfill"/>`;
    b += `<rect x="0" y="${g}" width="${W}" height="70" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<rect x="160" y="${g - 34}" width="250" height="34" class="sc-stone"/>`;
    for (let x = 166; x < 404; x += 12) b += `<rect x="${x}" y="${g - 30}" width="4" height="26" class="sc-pillar"/>`;
    b += `<rect x="215" y="${g - 74}" width="150" height="40" class="sc-stone"/>`;
    for (let x = 220; x < 360; x += 10) b += `<rect x="${x}" y="${g - 70}" width="3" height="34" class="sc-pillar"/>`;
    b += `<path d="M260 ${g - 74}V${g - 112}H320V${g - 74}" class="sc-planned"/>`;
    b += `<rect x="410" y="${g - 60}" width="40" height="26" class="sc-room"/>`;
    b += `<path d="M300 ${g - 34}L330 ${g + 40}H470" class="sc-passage"/><rect x="470" y="${g + 30}" width="28" height="16" class="sc-room"/>`;
    b += `<path d="M40 ${g}L160 ${g - 30}" class="sc-ramp"/>`;
    b += txt(60, g - 30, "пандус", "sc-label");
    b += txt(40, g + 22, "нижняя терраса с портиком", "sc-label");
    b += txt(205, g - 120, "центральное сооружение – пирамида или холм? (спорно)", "sc-label");
    b += txt(410, g - 66, "зал в скале", "sc-label");
    b += txt(340, g + 64, "коридор ≈150 м к камере в скале", "sc-label");
    b += txt(10, 18, "Разрез с востока на запад, масштаб условный", "sc-small");
    return svg(W, 330, b, `Разрез: ${m.name}`);
  }

  /* ---------- Сафф-гробница (план) ---------- */
  function saff(m) {
    const W = 560, H = 300; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="70" y="90" width="420" height="150" class="sc-court"/>`;
    b += `<rect x="70" y="60" width="420" height="30" class="sc-rockfill"/>`;
    for (let x = 80; x < 485; x += 22) b += `<rect x="${x}" y="84" width="10" height="10" class="sc-pillar"/>`;
    b += `<rect x="265" y="40" width="30" height="22" class="sc-room"/>`;
    b += txt(280, 34, "погребальная камера", "sc-label", "middle");
    b += txt(280, 110, "ряд столбов (по-арабски «сафф» – «ряд»)", "sc-label", "middle");
    b += txt(280, 170, "огромный двор, вырубленный в склоне", "sc-label", "middle");
    b += txt(280, 270, "План сверху, масштаб условный; двор – до 300 м в длину", "sc-small", "middle");
    return svg(W, H, b, `План сафф-гробницы: ${m.name}`);
  }

  function unknownPyramid(m) {
    const W = 560, g = 200; let b = DEFS;
    b += `<rect x="0" y="${g}" width="${W}" height="60" class="sc-ground"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<path d="${pyramidShape(KHUFU, W / 2, g, S * 0.75)}" class="sc-ghost"/>`;
    b += `<path d="M${W / 2 - 70} ${g}L${W / 2} ${g - 80}L${W / 2 + 70} ${g}Z" class="sc-planned"/>`;
    b += txt(W / 2, g - 92, "?", "sc-dimtext", "middle");
    b += txt(W / 2, g + 26, (m.dims && m.dims.note) || "пирамида сильно разрушена, её размеры на схеме не показаны", "sc-small", "middle");
    b += txt(10, 18, "Контур Великой пирамиды – для сравнения", "sc-small sc-muted");
    return svg(W, 260, b, `Пирамида: ${m.name}`);
  }

  /* ---------- Сводчатая гробница Авариса (разрез) ---------- */
  const donkey = (x, y, s = 1, flip = false) => {
    const k = flip ? -1 : 1, X = d => f(x + d * s * k), Y = d => f(y + d * s);
    return `<path d="M${X(-22)} ${Y(-6)}Q${X(-20)} ${Y(-16)} ${X(0)} ${Y(-16)}Q${X(18)} ${Y(-16)} ${X(20)} ${Y(-8)}L${X(30)} ${Y(-20)}L${X(36)} ${Y(-17)}L${X(28)} ${Y(-4)}Q${X(22)} ${Y(-2)} ${X(18)} ${Y(-2)}L${X(18)} ${Y(12)}M${X(10)} ${Y(-2)}L${X(10)} ${Y(12)}M${X(-12)} ${Y(-4)}L${X(-12)} ${Y(12)}M${X(-19)} ${Y(-5)}L${X(-19)} ${Y(12)}M${X(-22)} ${Y(-6)}L${X(-28)} ${Y(4)}M${X(31)} ${Y(-20)}L${X(30)} ${Y(-27)}" class="sc-animal"/>`;
  };
  function vault(m) {
    const W = 560, H = 300, g = 96; let b = DEFS;
    b += `<rect x="0" y="${g}" width="${W}" height="${H - g}" class="sc-rockfill"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
    b += `<rect x="40" y="${g - 70}" width="22" height="70" class="sc-brickwall-face"/>` + txt(70, g - 52, "стена дома", "sc-small");
    b += txt(150, g - 10, "двор дома", "sc-small");
    // яма и сводчатая камера
    b += `<path d="M180 ${g}V${g + 150}H360V${g}" class="sc-pit"/>`;
    b += `<path d="M196 ${g + 146}V${g + 86}A74 50 0 0 1 344 ${g + 86}V${g + 146}Z" fill="url(#sc-brickpat)" class="sc-outline"/>`;
    b += `<path d="M206 ${g + 140}V${g + 90}A64 42 0 0 1 334 ${g + 90}V${g + 140}Z" class="sc-room"/>`;
    b += `<ellipse cx="260" cy="${g + 128}" rx="34" ry="8" class="sc-body"/><circle cx="296" cy="${g + 124}" r="7" class="sc-body"/>`;
    b += `<path d="M222 ${g + 136}q-6 -14 0 -22h6q6 8 0 22z" class="sc-jar"/><path d="M318 ${g + 136}q-5 -12 0 -18h5q5 6 0 18z" class="sc-jar"/>`;
    // ослы у входа
    b += `<rect x="390" y="${g + 6}" width="140" height="50" class="sc-pit"/>`;
    b += donkey(425, g + 36, 0.8) + donkey(492, g + 38, 0.8);
    b += txt(460, g + 74, "ослы, погребённые", "sc-label", "middle") + txt(460, g + 90, "у входа", "sc-label", "middle");
    b += txt(270, g + 176, "камера с кирпичным сводом", "sc-label", "middle");
    b += txt(270, g + 192, "внутри – умерший и кувшины", "sc-small", "middle");
    b += txt(10, 18, "Разрез, масштаб условный", "sc-small");
    return svg(W, H, b, `Разрез: ${m.name}`);
  }

  /* ---------- Гробница из нескольких камер (план) ---------- */
  function chamberTomb(m) {
    const W = 560, H = 280; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    const y = 110, h = 70, rooms = [[70, 80], [160, 70], [240, 70], [320, 150]];
    b += `<path d="M20 ${y + h / 2}H70" class="sc-passage"/>` + txt(20, y + h / 2 - 10, "вход", "sc-small");
    rooms.forEach(([x, w], i) => {
      const last = i === rooms.length - 1;
      b += `<rect x="${x}" y="${y}" width="${w - 8}" height="${h}" ${last ? 'class="sc-stone"' : 'fill="url(#sc-brickpat)" class="sc-outline"'}/>`;
      if (!last) b += `<rect x="${x + 6}" y="${y + 6}" width="${w - 20}" height="${h - 12}" class="sc-room"/>`;
    });
    const [lx, lw] = rooms[3];
    b += `<rect x="${lx + 10}" y="${y + 10}" width="${lw - 28}" height="${h - 20}" class="sc-room"/>`;
    b += `<rect x="${lx + lw - 46}" y="${y + 24}" width="20" height="22" class="sc-temple"/>`;
    [["Нут", lx + 30, true], ["Нефтида", lx + 80, true], ["Серкет", lx + 30, false], ["Исида", lx + 80, false]].forEach(([n, x, top]) => {
      b += `<circle cx="${x}" cy="${top ? y + 5 : y + h - 5}" r="4" class="sc-goddess"/>` + txt(x, top ? y - 8 : y + h + 18, n, "sc-small", "middle");
    });
    b += `<path d="M${lx + lw - 26} ${y + 35}H${lx + lw + 2}" class="sc-leader"/>` + txt(lx + lw + 4, y + 32, "ниша", "sc-small") + txt(lx + lw + 4, y + 46, "для каноп", "sc-small");
    b += txt(190, y - 30, "четыре камеры подряд", "sc-label", "middle");
    b += txt(lx + lw / 2 - 4, y + h + 50, "погребальная камера из известняка,", "sc-label", "middle");
    b += txt(lx + lw / 2 - 4, y + h + 66, "расписана изображениями богинь", "sc-label", "middle");
    b += txt(10, 18, "План, упрощённо, масштаб условный", "sc-small");
    return svg(W, H, b, `План: ${m.name}`);
  }

  function monument(m) {
    const t = m.type;
    if (t === "pyramid") { if (!m.dims || !m.dims.base) return unknownPyramid(m); return m.id === "m-khufu" ? pyramidProfile(m) + khufuSection() : pyramidProfile(m); }
    if (t === "mastaba") return mastaba(m);
    if (t === "abydos") return abydos(m);
    if (t === "gallery") return gallery(m);
    if (t === "enclosure") return enclosure(m);
    if (t === "sarcophagus") return sarcophagus(m);
    if (t === "stepmastaba") return stepMastaba(m);
    if (t === "shaft") return shaft(m);
    if (t === "rock") return rock(m);
    if (t === "terrace") return terrace(m);
    if (t === "saff") return saff(m);
    if (t === "vault") return vault(m);
    if (t === "chamber") return chamberTomb(m);
    if (t === "kv") return kvTomb(m);
    if (t === "tut") return tutPlan(m);
    if (t === "temple") return templePlan(m);
    return "";
  }

  /* ---------- Все пирамиды в одном масштабе ---------- */
  function compare(list) {
    const s = 0.9, g = 170, gap = 26;
    let x = 20, b = DEFS, labels = "";
    const items = list.filter(m => m.type === "pyramid" && m.dims && m.dims.base);
    items.forEach(m => {
      const p = m.dims, w = p.base * s, cx = x + w / 2;
      b += `<a href="#${esc(m.id)}"><path d="${pyramidShape(p, cx, g, s)}" class="${p.core === "brick" ? "sc-brickfill" : "sc-stone"}"><title>${esc(m.name)}</title></path></a>`;
      if (p.planned) b += `<path d="${pyramidShape({ base: p.base, height: p.planned }, cx, g, s)}" class="sc-planned"/>`;
      const hh = p.shape === "frustum" ? p.built : p.shape === "ruin" ? p.now : p.height;
      labels += txt(cx, g + 16, m.short || m.name, "sc-small", "middle") + txt(cx, g + 29, hh ? `${f1(hh)} м` : "", "sc-small sc-muted", "middle");
      x += w + gap;
    });
    const W = Math.max(600, x + 10);
    b = `<rect x="0" y="${g}" width="${W}" height="44" class="sc-ground"/><path d="M0 ${g}H${W}" class="sc-groundline"/>` + b + labels;
    return `<svg class="scheme scheme-wide" width="${f(W)}" height="210" viewBox="0 0 ${f(W)} 210" role="img" aria-label="Все пирамиды в одном масштабе">${b}</svg>`;
  }

  /* ---------- Пирамидный комплекс: общая схема ---------- */
  function complexPlan() {
    const W = 600, H = 300; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<path d="M560 0C540 80 590 180 560 300L600 300L600 0Z" class="sc-water"/>` + txt(574, 150, "Нил", "sc-label", "middle", `transform="rotate(90 574 150)"`);
    b += `<rect x="470" y="125" width="44" height="40" class="sc-temple"/>` + txt(492, 185, "нижний храм", "sc-small", "middle");
    b += `<path d="M470 145L250 145" class="sc-causeway"/>` + txt(360, 136, "крытая дорога", "sc-small", "middle");
    b += `<rect x="200" y="122" width="50" height="46" class="sc-temple"/>` + txt(225, 185, "заупокойный храм", "sc-small", "middle");
    b += `<path d="M60 70H200V220H60Z" class="sc-stone"/><path d="M60 70L130 145L200 70M60 220L130 145L200 220" class="sc-faces"/>` + txt(130, 240, "пирамида царя", "sc-label", "middle");
    b += `<path d="M212 196H244V228H212Z" class="sc-stone"/>` + txt(228, 246, "малая пирамида", "sc-small", "middle");
    b += `<path d="M30 20H58V48H30ZM70 20H98V48H70Z" class="sc-stone"/>` + txt(98, 14, "пирамиды цариц", "sc-small", "middle");
    b += `<path d="M260 60Q300 50 330 62" class="sc-boat"/><path d="M260 236Q300 246 330 232" class="sc-boat"/>` + txt(300, 44, "ямы с ладьями", "sc-small", "middle");
    b += `<path d="M40 60V230H260V60Z" class="sc-wall"/>`;
    b += txt(10, 290, "Вид сверху, без масштаба. Запад – слева, Нил – справа", "sc-small");
    return svg(W, H, b, "Схема пирамидного комплекса");
  }

  /* ---------- Фасад дворца (серех) ---------- */
  function palaceFacade() {
    const W = 560, H = 220; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="60" y="40" width="300" height="150" class="sc-brickwall-face"/>`;
    for (let x = 70; x < 355; x += 28) { b += `<rect x="${x}" y="50" width="14" height="140" class="sc-niche-deep"/><rect x="${x + 4}" y="60" width="6" height="130" class="sc-niche-deeper"/>`; }
    b += `<rect x="410" y="40" width="80" height="120" class="sc-serekh"/>`;
    for (let x = 416; x < 488; x += 12) b += `<rect x="${x}" y="122" width="6" height="34" class="sc-niche-deep"/>`;
    b += txt(450, 30, "серех", "sc-label", "middle") + txt(450, 90, "имя", "sc-label", "middle") + txt(450, 180, "внизу – фасад дворца", "sc-small", "middle");
    b += txt(210, 208, "стена с выступами и нишами", "sc-small", "middle");
    return svg(W, H, b, "Фасад дворца и серех");
  }

  /* ---------- Подписи на картах без наложений ---------- */
  function placeLabels(items, W, H, fixed = []) {
    const boxes = fixed.slice(), out = [];
    items.forEach(it => boxes.push([it.x - 6, it.y - 6, 12, 12]));
    const hit = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
    const order = items.slice().sort((a, b) => (b.on - a.on) || (a.rank - b.rank));
    order.forEach(it => {
      const w = it.text.length * (it.on ? 7.4 : 6.7) + 2, h = 14;
      let C = [[9, 4, "start"], [-9, 4, "end"], [7, -8, "start"], [7, 17, "start"], [-7, -8, "end"], [-7, 17, "end"], [0, -11, "middle"], [0, 21, "middle"]];
      if (it.left) C = [C[1], C[0], ...C.slice(2)];
      let best = null;
      C.forEach(([dx, dy, a], i) => {
        const x = it.x + dx, x0 = a === "end" ? x - w : a === "middle" ? x - w / 2 : x, box = [x0, it.y + dy - 11, w, h];
        if (x0 < 2 || x0 + w > W - 2 || box[1] < 2 || box[1] + h > H - 2) return;
        const own = [it.x - 6, it.y - 6, 12, 12];
        const cost = boxes.reduce((s, b) => s + (b === own ? 0 : hit(box, b)), 0) * 10 + i;
        if (!best || cost < best.cost) best = { cost, x, y: it.y + dy, a, box };
      });
      if (!best) best = { x: it.x + 9, y: it.y + 4, a: "start", box: [it.x + 9, it.y - 7, w, h] };
      boxes.push(best.box); out.push(Object.assign({}, it, best));
    });
    return out;
  }
  const RANK = { capital: 0, city: 1, necropolis: 2, mine: 3 };
  function mapDots(list, P, hi, W, H, fixed) {
    const items = list.filter(p => !p.minor || p.id === hi).map(p => { const [x, y] = P([p.lat, p.lon]); return { p, x, y, text: p.name, on: p.id === hi ? 1 : 0, rank: RANK[p.kind] ?? 4, left: !!p.labelLeft }; });
    let b = "";
    items.forEach(it => { b += `<a href="#pl-${esc(it.p.id)}"><circle cx="${f(it.x)}" cy="${f(it.y)}" r="${it.on ? 7 : 4.5}" class="sc-dot sc-dot-${esc(it.p.kind)}${it.on ? " sc-dot-on" : ""}"><title>${esc(it.p.name)}</title></circle></a>`; });
    placeLabels(items, W, H, fixed).forEach(it => { b += `<a href="#pl-${esc(it.p.id)}">${txt(it.x, it.y, it.text, it.on ? "sc-label sc-strong" : "sc-label", it.a)}</a>`; });
    return b;
  }

  /* ---------- Карты ---------- */
  const NILE = [[21.9, 31.3], [22.34, 31.63], [22.8, 32.1], [23.2, 32.6], [23.6, 32.85], [24.09, 32.90], [24.47, 32.95], [24.98, 32.87], [25.29, 32.55], [25.69, 32.64], [26.16, 32.72], [26.05, 32.24], [26.34, 31.89], [26.56, 31.70], [27.18, 31.18], [27.65, 30.86], [28.10, 30.75], [29.07, 31.10], [29.6, 31.25], [30.05, 31.23], [30.20, 31.12]];
  const ROSETTA = [[30.20, 31.12], [30.6, 30.9], [31.0, 30.6], [31.46, 30.37]];
  const DAMIETTA = [[30.20, 31.12], [30.6, 31.2], [31.0, 31.5], [31.52, 31.84]];
  const COAST = [[31.0, 29.3], [31.2, 29.9], [31.46, 30.37], [31.6, 30.9], [31.52, 31.84], [31.26, 32.30], [31.13, 33.80], [31.3, 34.25], [31.6, 35.6]];
  const REDSEA_W = [[29.97, 32.55], [29.6, 32.32], [29.11, 32.66], [28.36, 33.08], [27.25, 33.81], [26.75, 33.94], [26.10, 34.28], [25.07, 34.89], [24.0, 35.4], [23.4, 35.6]];
  const SINAI = [[29.97, 32.55], [29.58, 32.71], [28.24, 33.62], [27.73, 34.25], [28.49, 34.51], [29.49, 34.89]];
  function proj(b, W, H) {
    const [la0, la1, lo0, lo1] = b, k = Math.cos(rad((la0 + la1) / 2));
    const sx = W / ((lo1 - lo0) * k), sy = H / (la1 - la0), sc = Math.min(sx, sy);
    return ([la, lo]) => [(lo - lo0) * k * sc, (la1 - la) * sc];
  }
  const line = (pts, P) => pts.map((q, i) => (i ? "L" : "M") + P(q).map(f).join(" ")).join("");
  function egyptMap(places, hi, opt = {}) {
    const W = 520, H = 920, P = proj([21.9, 31.75, 29.3, 35.6], W, H);
    let b = `<rect width="${W}" height="${H}" class="sc-land"/>`;
    b += `<path d="${line(COAST, P)}L${P([31.75, 35.6]).map(f).join(" ")}L${P([31.75, 29.3]).map(f).join(" ")}Z" class="sc-sea"/>`;
    b += `<path d="${line(REDSEA_W, P)}L${P([21.9, 35.6]).map(f).join(" ")}L${P([28.0, 35.6]).map(f).join(" ")}L${P([29.53, 35.0]).map(f).join(" ")}${line(SINAI.slice().reverse(), P).replace(/^M/, "L")}Z" class="sc-sea"/>`;
    const [fx, fy] = P([29.47, 30.62]); b += `<ellipse cx="${f(fx)}" cy="${f(fy)}" rx="14" ry="6" class="sc-lake"/>`;
    b += `<path d="${line(NILE, P)}" class="sc-river"/><path d="${line(ROSETTA, P)}" class="sc-river-thin"/><path d="${line(DAMIETTA, P)}" class="sc-river-thin"/>`;
    b += txt(P([31.6, 30.1])[0], P([31.6, 30.1])[1], "Средиземное море", "sc-small sc-muted");
    b += txt(P([22.7, 31.2])[0], P([22.7, 31.2])[1], "Нубия", "sc-small sc-muted", "end");
    b += txt(P([26.4, 34.95])[0], P([26.4, 34.95])[1], "Красное море", "sc-small sc-muted", "middle");
    b += txt(P([29.6, 33.9])[0], P([29.6, 33.9])[1], "Синай", "sc-small sc-muted", "middle");
    b += txt(P([27.4, 31.55])[0], P([27.4, 31.55])[1], "Нил", "sc-small sc-muted");
    // врезка района Мемфиса
    const box = MEM, [bx0, by0] = P([box[1], box[2]]), [bx1, by1] = P([box[0], box[3]]);
    b += `<rect x="${f(bx0)}" y="${f(by0)}" width="${f(bx1 - bx0)}" height="${f(by1 - by0)}" class="sc-inset"/>` + txt(bx1 + 4, by0 + 10, "Мемфис и Файюм – на отдельной схеме", "sc-small");
    const ins = [bx1 + 2, by0, 225, 14], nile = P([27.4, 31.55]), rs = P([26.4, 34.95]), sn = P([29.6, 33.9]);
    b += mapDots(places.filter(p => !p.memphis && p.lat), P, hi, W, H, [ins, [nile[0], nile[1] - 11, 24, 14], [bx0, by0, bx1 - bx0, by1 - by0], [rs[0] - 44, rs[1] - 11, 88, 14], [sn[0] - 18, sn[1] - 11, 36, 14]]);
    return svg(W, H, b, "Карта Египта", "scheme-map");
  }
  const MEM = [29.0, 30.2, 30.72, 31.45];
  function memphisMap(places, hi) {
    const W = 520, H = 760, bnd = MEM, P = proj(bnd, W, H);
    let b = `<rect width="${W}" height="${H}" class="sc-land"/>`;
    b += `<path d="${line([[29.0, 31.08], [29.07, 31.10], [29.3, 31.2], [29.6, 31.25], [29.85, 31.27], [30.05, 31.23], [30.2, 31.15]], P)}" class="sc-river"/>`;
    b += `<path d="${line([[29.36, 31.07], [29.6, 31.12], [29.85, 31.15], [30.0, 31.12], [30.2, 31.05]], P)}" class="sc-desert-edge"/>`;
    b += txt(P([29.75, 30.9])[0], P([29.75, 30.9])[1], "Западная пустыня", "sc-small sc-muted");
    b += txt(P([29.5, 31.3])[0], P([29.5, 31.3])[1], "Нил", "sc-small sc-muted");
    const [fx, fy] = P([29.33, 30.72]); b += `<ellipse cx="${f(fx)}" cy="${f(fy)}" rx="60" ry="70" class="sc-field"/>` + txt(fx + 8, fy + 4, "оазис Файюм", "sc-small sc-muted");
    const ft = P([29.5, 31.3]);
    b += mapDots(places.filter(p => p.memphis && p.lat), P, hi, W, H, [[fx, fy - 8, 70, 14], [ft[0], ft[1] - 11, 24, 14]]);
    b += `<path d="M14 ${H - 20}H${f(14 + P([MEM[0], MEM[2] + 10 / (111 * Math.cos(rad(29.6)))])[0])}" class="sc-scale"/>` + txt(14, H - 26, "10 км", "sc-small");
    return svg(W, H, b, "Район Мемфиса", "scheme-map");
  }

  /* ---------- Планы мест ---------- */
  function gizaPlan() {
    const W = 560, H = 420, c = [29.9758, 31.1318], k = 0.36; // пикселей на метр
    const toXY = (la, lo) => [W / 2 - 80 + (lo - c[1]) * 96500 * k, H / 2 + 10 - (la - c[0]) * 111000 * k];
    let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    const sq = (x, y, s, cls = "sc-stone") => `<path d="M${f(x - s)} ${f(y - s)}H${f(x + s)}V${f(y + s)}H${f(x - s)}Z" class="${cls}"/><path d="M${f(x - s)} ${f(y - s)}L${f(x + s)} ${f(y + s)}M${f(x + s)} ${f(y - s)}L${f(x - s)} ${f(y + s)}" class="sc-faces"/>`;
    const pyr = (la, lo, base, name, dy = 0) => { const [x, y] = toXY(la, lo), s = base * k / 2; return sq(x, y, s) + txt(x + s + 6, y + 4 + dy, name, "sc-label"); };
    // поля мастаб
    const [w0x, w0y] = toXY(29.9800, 31.1262), [w1x, w1y] = toXY(29.9790, 31.1312);
    b += `<rect x="${f(w0x)}" y="${f(w0y)}" width="${f(w1x - w0x)}" height="${f(w1y - w0y)}" class="sc-field"/>` + txt((w0x + w1x) / 2, w0y - 6, "Западное кладбище мастаб", "sc-small", "middle");
    const [e0x, e0y] = toXY(29.9802, 31.1368), [e1x, e1y] = toXY(29.9772, 31.1392);
    b += `<rect x="${f(e0x)}" y="${f(e0y)}" width="${f(e1x - e0x)}" height="${f(e1y - e0y)}" class="sc-field"/>` + txt(e1x + 6, (e0y + e1y) / 2 - 4, "Восточное", "sc-small") + txt(e1x + 6, (e0y + e1y) / 2 + 10, "кладбище", "sc-small");
    b += pyr(29.9792, 31.1342, 230.3, "Хуфу");
    b += pyr(29.9761, 31.1308, 215.3, "Хафра", -12);
    b += pyr(29.9725, 31.1281, 103.4, "Менкаура");
    // пирамиды цариц у Хуфу и у Менкауры
    [29.9786, 29.9780, 29.9773].forEach(la => { const [x, y] = toXY(la, 31.1359); b += sq(x, y, 49 * k / 2); });
    [31.1272, 31.1278, 31.1284].forEach(lo => { const [x, y] = toXY(29.9716, lo); b += sq(x, y, 40 * k / 2); });
    { const [x, y] = toXY(29.9773, 31.1359); b += txt(x, y + 22, "пирамиды цариц", "sc-small", "middle"); }
    // сфинкс и дорога Хафры
    const [sx, sy] = toXY(29.9753, 31.1376);
    b += `<rect x="${f(sx - 10)}" y="${f(sy - 3)}" width="22" height="7" class="sc-temple"/>` + txt(sx + 16, sy + 4, "Большой сфинкс", "sc-label");
    const [hx, hy] = toXY(29.9761, 31.1308), [vx, vy] = toXY(29.9750, 31.1370);
    b += `<path d="M${f(hx + 215.3 * k / 2)} ${f(hy + 6)}L${f(vx)} ${f(vy)}" class="sc-causeway"/>` + txt((hx + vx) / 2, (hy + vy) / 2 + 30, "дорога к нижнему храму Хафры", "sc-small", "middle");
    b += txt(W - 10, H - 12, "↓ посёлок строителей – ≈400 м к югу", "sc-small", "end");
    b += txt(10, 18, "План плато Гизы, север – вверху; размеры пирамид – в масштабе", "sc-small");
    b += `<path d="M${f(W - 14 - 100 * k)} 40H${W - 14}" class="sc-scale"/>` + txt(W - 14, 34, "100 м", "sc-small", "end");
    return svg(W, H, b, "План плато Гизы");
  }
  function kahunPlan() {
    const W = 560, H = 380; let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="60" y="50" width="440" height="290" class="sc-wall-thick"/>`;
    b += `<path d="M190 50V340" class="sc-wall-thick"/>`;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) b += `<rect x="${66 + c * 20}" y="${58 + r * 30}" width="16" height="24" class="sc-house"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b += `<rect x="${200 + c * 72}" y="${110 + r * 56}" width="64" height="48" class="sc-villa"/>`;
    b += `<rect x="210" y="56" width="110" height="46" class="sc-palace"/>` + txt(265, 84, "«акрополь»", "sc-small", "middle");
    b += txt(125, 24, "западный квартал:", "sc-label", "middle") + txt(125, 40, "дома рабочих", "sc-label", "middle");
    b += txt(345, 40, "восточный квартал: усадьбы чиновников", "sc-label", "middle");
    b += txt(10, H - 12, "План города при пирамиде Сенусерта II в Лахуне, ≈380 × 350 м, упрощённо", "sc-small");
    return svg(W, H, b, "План Кахуна");
  }


  /* ---------- Гробница в скале Долины царей (план) ---------- */
  function kvTomb(m) {
    const p = m.dims || {}, W = 600, H = 300; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-rockfill"/>`;
    const room = (x, y, w, h, cls = "sc-room") => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" class="${cls}"/>`;
    const pillars = (x, y, w, h, n = 2) => { let r = ""; for (let i = 1; i <= n; i++) for (let j = 1; j <= 2; j++) r += `<rect x="${f(x + w * i / (n + 1) - 3)}" y="${f(y + h * j / 3 - 3)}" width="6" height="6" class="sc-pillar"/>`; return r; };
    const lab = (x, y, t, a = "middle", c = "sc-small") => `<rect x="${f(a === "middle" ? x - t.length * 3.3 - 3 : a === "end" ? x - t.length * 6.6 - 6 : x - 3)}" y="${f(y - 11)}" width="${f(t.length * 6.6 + 6)}" height="15" rx="3" class="sc-labelbg"/>` + txt(x, y, t, c, a);
    const kind = p.axis || "straight";
    if (kind === "straight") {
      const y = 140;
      b += room(30, y - 9, 20, 18, "sc-stairbox") + room(50, y - 7, 110, 14) + room(160, y - 12, 26, 24) + room(186, y - 7, 70, 14);
      b += room(256, y - 34, 70, 68) + pillars(256, y - 34, 70, 68) + room(326, y - 7, 90, 14) + room(416, y - 14, 30, 28);
      b += room(446, y - 40, 110, 80) + pillars(446, y - 40, 110, 80, 3) + room(556, y - 16, 22, 32);
      b += `<path d="M${173} ${y - 12}V${y + 12}" class="sc-wellmark"/>`;
      b += lab(40, y + 30, "вход") + lab(105, y - 18, "коридоры уходят вниз") + lab(173, y + 34, "колодец") + lab(291, y + 50, "зал с колоннами") + lab(501, y + 56, "погребальная камера") + lab(567, y - 26, "кладовые", "end");
    } else if (kind === "bent") {
      const y = 90;
      b += room(30, y - 9, 20, 18, "sc-stairbox") + room(50, y - 7, 150, 14) + room(200, y - 12, 26, 24) + room(226, y - 30, 80, 60) + pillars(226, y - 30, 80, 60);
      b += room(296, y + 30, 14, 60) + `<path d="M260 ${y + 90}H${p.cartouche ? 420 : 400}" class="sc-none"/>`;
      if (p.cartouche) b += `<rect x="230" y="${y + 90}" width="200" height="90" rx="45" class="sc-room"/>` + pillars(230, y + 90, 200, 90, 2);
      else b += room(240, y + 90, 160, 80) + pillars(240, y + 90, 160, 80, 2);
      b += lab(40, y + 30, "вход") + lab(125, y - 18, "крутые коридоры") + lab(213, y + 36, "колодец") + lab(266, y - 40, "зал с колоннами") + (p.cartouche ? lab(222, y + 128, "погребальная камера", "end") + lab(222, y + 146, "в форме картуша", "end") : lab(320, y + 192, "погребальная камера"));
      b += lab(470, y + 40, "ось гробницы", "start") + lab(470, y + 56, "поворачивает", "start") + lab(470, y + 72, "под прямым углом", "start");
    } else if (kind === "curved") {
      b += `<path d="M40 60C220 40 420 40 470 120S420 260 280 250S120 180 200 140" class="sc-corridor-path"/>`;
      b += room(180, 120, 46, 40) + pillars(180, 120, 46, 40, 1);
      b += lab(48, 48, "вход") + lab(300, 30, "пять изогнутых коридоров со ступенями") + lab(200, 186, "погребальная камера");
      b += lab(470, 210, "уходит в скалу по дуге", "start");
    } else if (kind === "many") {
      const y = 70;
      b += room(30, y - 8, 30, 16, "sc-stairbox") + room(60, y - 22, 70, 44) + pillars(60, y - 22, 70, 44, 3) + room(130, y - 7, 60, 14);
      b += room(190, y - 7, 14, 200) + room(190, y + 140, 370, 14) + room(190, y + 40, 370, 14);
      for (let i = 0; i < 11; i++) { const x = 214 + i * 32; b += room(x, y + 22, 20, 16) + room(x, y + 58, 20, 16) + room(x, y + 122, 20, 16) + room(x, y + 158, 20, 16); }
      b += lab(46, y + 30, "вход") + lab(95, y - 30, "зал с 16 колоннами") + lab(380, y + 200, "длинные коридоры с десятками комнат по бокам") + lab(380, y + 106, "больше 130 комнат – раскопана лишь малая часть");
    } else { // small
      const y = 140;
      b += room(60, y - 10, 70, 20, "sc-stairbox") + room(130, y - 8, 100, 16) + room(230, y - 50, 150, 100);
      b += lab(95, y + 34, "лестница") + lab(180, y - 18, "коридор") + lab(305, y + 70, p.label || "одна камера");
    }
    b += txt(W - 14, 18, p.length ? `длина по ходу ≈${f1(p.length)} м; план упрощён, без масштаба` : "план упрощён, без масштаба", "sc-small-light", "end");
    return svg(W, H, b, `План: ${m.name}`);
  }

  /* ---------- Гробница Тутанхамона KV62, по размерам Картера ---------- */
  function tutPlan(m) {
    const W = 600, H = 360, k = 20, ox = 250, oy = 318; // метр -> пиксели; x на восток, y на север
    const R = (x0, y0, w, h, cls = "sc-room") => `<rect x="${f(ox + x0 * k)}" y="${f(oy - (y0 + h) * k)}" width="${f(w * k)}" height="${f(h * k)}" class="${cls}"/>`;
    let b = DEFS + `<rect width="${W}" height="${H}" class="sc-rockfill"/>`;
    b += R(11.6, 0.2, 2.8, 1.7, "sc-stairbox") + R(3.6, 0.2, 8, 1.7);           // лестница, коридор
    b += R(0, 0, 3.6, 7.9);                                                     // передняя
    b += R(-3.1, -0.6, 2.6, 4.4);                                               // боковая
    b += R(-1.5, 8.4, 6.4, 4);                                                  // погребальная
    b += R(-0.9, 8.9, 5.2, 3, "sc-shrine");                                      // ковчеги
    b += R(5.4, 8.1, 3.8, 4.8);                                                 // сокровищница
    const L = (x, y, t, a = "middle", c = "sc-small-light") => txt(ox + x * k, oy - y * k, t, c, a);
    b += L(13, -0.8, "лестница, 16 ступеней") + L(7.6, 2.6, "коридор 8 м") + L(1.8, 4.4, "передняя") + L(1.8, 3.6, "7,9 × 3,6 м") + L(-1.8, 1.4, "боковая", "middle");
    b += L(1.7, 13.2, "погребальная камера 6,4 × 4 м") + L(1.7, 10.2, "4 ковчега и саркофаг", "middle", "sc-small") + L(7.3, 10.3, "сокровищница");
    b += `<path d="M${ox + 0.2 * k} ${oy - 8.15 * k}H${ox + 3.4 * k}" class="sc-sealed"/>` + L(3.9, 7.6, "замурованная стена со статуями-стражами", "start");
    b += `<path d="M${W - 30} 60V30" class="sc-scale-light" marker-end="url(#sc-arr)"/>` + txt(W - 30, 76, "С", "sc-small-light", "middle");
    b += `<path d="M20 ${H - 22}H${20 + 5 * k}" class="sc-scale-light"/>` + txt(20, H - 28, "5 м", "sc-small-light");
    b += txt(10, 18, "План по размерам Говарда Картера, упрощённо", "sc-small-light");
    return svg(W, H, b, `План: ${m.name}`);
  }

  /* ---------- Заупокойный храм ---------- */
  function templePlan(m) {
    const p = m.dims || {}, W = 600, H = 300; let b = DEFS;
    if (p.kind === "terraces") {
      const g = 250; b += `<rect x="0" y="${g}" width="${W}" height="${H - g}" class="sc-ground"/><path d="M0 ${g}H${W}" class="sc-groundline"/>`;
      b += `<path d="M470 ${g}L490 30L${W} 20V${g}Z" class="sc-rockfill"/>`;
      [[120, 240, 30], [240, 360, 70], [340, 470, 110]].forEach(([x0, x1, h], i) => {
        b += `<rect x="${x0}" y="${g - h}" width="${x1 - x0}" height="${h - (i ? [0, 30, 70][i] : 0)}" class="sc-stone"/>`;
        for (let x = x0 + 6; x < x1 - 4; x += 12) b += `<rect x="${x}" y="${g - h + 4}" width="4" height="22" class="sc-pillar"/>`;
      });
      b += `<path d="M40 ${g}L120 ${g - 30}M180 ${g - 30}L240 ${g - 70}M300 ${g - 70}L340 ${g - 110}" class="sc-ramp"/>`;
      b += `<rect x="452" y="${g - 140}" width="30" height="30" class="sc-room"/>`;
      b += txt(70, g - 34, "пандус", "sc-label") + txt(180, g + 20, "нижняя терраса", "sc-label", "middle") + txt(300, g - 84, "средняя", "sc-label", "middle") + txt(400, g - 124, "верхняя", "sc-label", "middle") + txt(467, g - 150, "святилище в скале", "sc-small", "middle");
      b += txt(10, 18, "Разрез с востока на запад, масштаб условный: колоннады на трёх террасах", "sc-small");
      return svg(W, H, b, `Разрез: ${m.name}`);
    }
    if (p.kind === "abusimbel") {
      const g = 262, s = 6.6, x0 = 60; // пикселей на метр
      b += `<rect width="${W}" height="${H}" class="sc-sand"/><path d="M${x0 - 20} ${g}L${x0 - 6} 20H${x0 + 38 * s + 6}L${x0 + 38 * s + 20} ${g}Z" class="sc-rockfill"/>`;
      b += `<rect x="${x0}" y="${g - 33 * s}" width="${38 * s}" height="${33 * s}" class="sc-stone"/>`;
      // сидящая фигура: голова в платке, плечи, туловище и колени
      const seat = (cx, headless) => {
        const top = g - 20 * s;
        let d = `M${f(cx - 3 * s)} ${g}V${f(top + 12 * s)}H${f(cx - 3.6 * s)}V${f(top + 7 * s)}H${f(cx - 1.6 * s)}`;
        d += headless ? `V${f(top + 6 * s)}H${f(cx + 1.6 * s)}V${f(top + 7 * s)}` : `V${f(top + 4.5 * s)}L${f(cx - 2.2 * s)} ${f(top + 2 * s)}Q${f(cx)} ${f(top - 0.5 * s)} ${f(cx + 2.2 * s)} ${f(top + 2 * s)}L${f(cx + 1.6 * s)} ${f(top + 4.5 * s)}V${f(top + 7 * s)}`;
        d += `H${f(cx + 3.6 * s)}V${f(top + 12 * s)}H${f(cx + 3 * s)}V${g}Z`;
        return `<path d="${d}" class="sc-colossus"/>`;
      };
      [4.75, 14.25, 23.75, 33.25].forEach((c, i) => { b += seat(x0 + c * s, i === 1); });
      b += `<ellipse cx="${f(x0 + 16.5 * s)}" cy="${g - 6}" rx="${f(1.6 * s)}" ry="6" class="sc-colossus"/>`;
      b += `<rect x="${f(x0 + 18 * s)}" y="${f(g - 7 * s)}" width="${f(2 * s)}" height="${f(7 * s)}" class="sc-room"/>`;
      const hx = x0 + 38 * s + 40; b += `<path d="M${hx} ${g}V${f(g - 1.7 * s)}" class="sc-human"/><circle cx="${hx}" cy="${f(g - 1.7 * s - 2)}" r="2.5" class="sc-human-head"/>` + txt(hx + 6, g - 4, "человек 1,7 м", "sc-small");
      b += `<path d="M${x0 + 38 * s + 14} ${g}V${f(g - 20 * s)}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt(x0 + 38 * s + 20, g - 10 * s, "статуи 20 м", "sc-dimtext");
      b += `<path d="M${x0} ${g + 16}H${x0 + 38 * s}" class="sc-dim" marker-start="url(#sc-arr)" marker-end="url(#sc-arr)"/>` + txt(x0 + 19 * s, g + 31, "фасад 38 м, высота 33 м", "sc-dimtext", "middle");
      b += txt(W - 10, 18, "Фасад Большого храма в масштабе", "sc-small", "end");
      b += txt(x0 + 14.25 * s, g - 21 * s, "голова упала", "sc-small", "middle");
      return svg(W, H, b, `Фасад: ${m.name}`);
    }
    // обычный храм: пилоны, дворы, гипостильный зал, святилище; дворец сбоку
    const y = 150; b += `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="40" y="${y - 70}" width="18" height="140" class="sc-pylon"/><rect x="58" y="${y - 55}" width="120" height="110" class="sc-court"/>`;
    b += `<rect x="178" y="${y - 60}" width="16" height="120" class="sc-pylon"/><rect x="194" y="${y - 50}" width="110" height="100" class="sc-court"/>`;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) b += `<circle cx="${320 + i * 18}" cy="${y - 33 + j * 22}" r="4" class="sc-pillar-dot"/>`;
    b += `<rect x="304" y="${y - 45}" width="116" height="90" class="sc-hall"/><rect x="420" y="${y - 32}" width="90" height="64" class="sc-court"/><rect x="510" y="${y - 18}" width="34" height="36" class="sc-room"/>`;
    if (p.palace) b += `<rect x="64" y="${y + 62}" width="108" height="60" class="sc-palace"/>` + txt(118, y + 96, "дворец", "sc-small", "middle");
    b += txt(49, y - 80, "пилон", "sc-small", "middle") + txt(118, y - 64, "первый двор", "sc-small", "middle") + txt(249, y - 58, "второй двор", "sc-small", "middle") + txt(362, y - 54, "зал с колоннами", "sc-small", "middle") + txt(527, y - 26, "святилище", "sc-small", "middle");
    b += txt(10, 18, "План, упрощённо: с востока – вход через пилон, к западу – святилище", "sc-small");
    return svg(W, H, b, `План: ${m.name}`);
  }

  /* ---------- Гробницы Долины царей в одном масштабе ---------- */
  function kvCompare() {
    const W = 640, H = 330, k = 1.6; let b = DEFS + `<rect width="${W}" height="${H}" class="sc-rockfill"/>`;
    // KV20: 210 м по дуге; первый коридор 49,5 м
    // ломаная дуга, растянутая так, чтобы её длина была 210 м в масштабе
    const raw = [[0, 0], [49.5, -2], [88, 8], [112, 36], [114, 70], [96, 96], [66, 104], [44, 92]];
    let len = 0; for (let i = 1; i < raw.length; i++) len += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
    const sc20 = 210 / len, pt = ([x, y]) => [30 + x * sc20 * k, 60 + y * sc20 * k];
    const path20 = raw.map((q, i) => (i ? "L" : "M") + pt(q).map(f).join(" ")).join("");
    b += `<path d="${path20}" class="sc-corridor-path"/>` + `<path d="M${pt(raw[0]).map(f).join(" ")}L${pt(raw[1]).map(f).join(" ")}" class="sc-first"/>`;
    { const [ex, ey] = pt(raw[raw.length - 1]); b += `<rect x="${f(ex - 10)}" y="${f(ey - 8)}" width="20" height="16" class="sc-room"/>`; }
    b += txt(30, 40, "KV20, Хатшепсут: ≈210 м по дуге", "sc-label-light") + txt(30, 84, "первый коридор – 49,5 м", "sc-small-light");
    // KV17: 137 м
    b += `<path d="M380 120H${f(380 + 137 * k * 0.95)}" class="sc-corridor-path"/>` + txt(380, 104, "KV17, Сети I: ≈137 м", "sc-label-light");
    // KV62 по размерам: передняя 7,9 × 3,6 и т.д.
    const ox = 400, oy = 260, R = (x0, y0, w, h) => `<rect x="${f(ox + x0 * k)}" y="${f(oy - (y0 + h) * k)}" width="${f(w * k)}" height="${f(h * k)}" class="sc-room"/>`;
    b += R(3.6, 0.2, 10.8, 1.7) + R(0, 0, 3.6, 7.9) + R(-3.1, -0.6, 2.6, 4.4) + R(-1.5, 8.4, 6.4, 4) + R(5.4, 8.1, 3.8, 4.8);
    b += txt(ox - 6, oy + 26, "KV62, Тутанхамон – вся гробница", "sc-label-light") + txt(ox - 6, oy + 42, "меньше первого коридора KV20", "sc-small-light");
    b += `<path d="M20 ${H - 16}H${f(20 + 50 * k)}" class="sc-scale-light"/>` + txt(20, H - 22, "50 м", "sc-small-light");
    b += txt(W - 10, 18, "Вид сверху, все гробницы в одном масштабе", "sc-small-light", "end");
    return svg(W, H, b, "Гробницы Долины царей в одном масштабе");
  }

  /* ---------- Дейр эль-Медина: деревня строителей ---------- */
  function deirMedina() {
    const W = 560, H = 360; let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<path d="M150 30L410 30L420 330L140 330Z" class="sc-wall-thick"/>`;
    b += `<path d="M280 30V330" class="sc-street"/>`;
    for (let r = 0; r < 12; r++) { b += `<rect x="${158 + r * 0.6}" y="${38 + r * 24}" width="112" height="20" class="sc-house"/><rect x="${290}" y="${38 + r * 24}" width="${118 - r * 0.2}" height="20" class="sc-house"/>`; }
    b += `<path d="M430 40C470 120 490 220 470 330" class="sc-cliff"/><path d="M130 40C90 120 80 220 100 330" class="sc-cliff"/>`;
    for (let i = 0; i < 7; i++) b += `<path d="M${470 + (i % 2) * 18} ${112 + i * 32}l8 -14l8 14z" class="sc-minipyr"/>`;
    b += txt(280, 22, "главная улица", "sc-small", "middle") + txt(30, 120, "деревня", "sc-label") + txt(30, 136, "за стеной:", "sc-small") + txt(30, 152, "около 68 домов", "sc-small") + txt(30, 168, "по ≈70 м²", "sc-small");
    b += txt(548, 50, "гробницы мастеров", "sc-small", "end") + txt(548, 64, "с пирамидками", "sc-small", "end");
    b += txt(10, H - 8, "План, упрощённо, без масштаба", "sc-small");
    return svg(W, H, b, "План Дейр эль-Медины");
  }

  /* ---------- Амарна ---------- */
  function amarnaPlan() {
    const W = 560, H = 440; let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<path d="M0 0H120C100 120 140 300 110 ${H}H0Z" class="sc-water"/>` + txt(46, 220, "Нил", "sc-label", "middle", `transform="rotate(-90 46 220)"`);
    b += `<path d="M470 20C430 140 520 260 470 420" class="sc-cliff"/>` + txt(462, 16, "скалы пустыни", "sc-small", "end");
    const zone = (y, h, name, sub) => `<rect x="150" y="${y}" width="270" height="${h}" class="sc-field"/>` + txt(160, y + 18, name, "sc-label") + (sub ? txt(160, y + 34, sub, "sc-small") : "");
    b += zone(30, 60, "Северный город", "Северный дворец – жилище царской семьи");
    b += zone(130, 120, "Центральный город", "Большой дворец, храмы Атона,");
    b += txt(160, 180, "«Дом царя», архив с письмами", "sc-small") + `<path d="M265 210V230" class="sc-passage"/>` + txt(272, 226, "мост над дорогой", "sc-small");
    b += zone(290, 100, "Южный город", "дома вельмож и мастерская Тутмоса");
    b += `<path d="M470 190C500 200 520 210 540 230" class="sc-passage"/>` + txt(548, 250, "Царское ущелье:", "sc-small", "end") + txt(548, 264, "гробница Эхнатона", "sc-small", "end");
    [[455, 60], [495, 160], [460, 300], [500, 400], [140, 60], [135, 400]].forEach(([x, y]) => { b += `<rect x="${x - 3}" y="${y - 8}" width="6" height="12" class="sc-stela"/>`; });
    b += txt(400, 420, "▮ – пограничные стелы", "sc-small");
    b += `<path d="M150 ${H - 16}V${H - 24}" class="sc-none"/>` + txt(10, H - 8, "Город тянулся ≈13 км вдоль восточного берега; схема без масштаба", "sc-small");
    return svg(W, H, b, "План Амарны");
  }

  /* ---------- Малкатта ---------- */
  function malkataPlan() {
    const W = 560, H = 340; let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<rect x="300" y="80" width="230" height="200" rx="20" class="sc-water"/>` + txt(415, 190, "Биркет Хабу –", "sc-label", "middle") + txt(415, 206, "гавань и озеро для праздника", "sc-small", "middle");
    b += `<rect x="60" y="120" width="120" height="110" class="sc-palace"/>` + txt(120, 170, "дворец царя", "sc-label", "middle") + txt(120, 186, "«Дом радости»", "sc-small", "middle");
    b += `<rect x="190" y="200" width="80" height="60" class="sc-villa"/>` + txt(230, 280, "дворец Тейе", "sc-small", "middle");
    b += `<rect x="70" y="40" width="80" height="50" class="sc-temple"/>` + txt(110, 30, "храм Амона", "sc-small", "middle");
    b += `<rect x="190" y="110" width="70" height="60" class="sc-villa"/>` + txt(225, 100, "дома и залы", "sc-small", "middle");
    b += `<path d="M180 175H300" class="sc-passage"/>` + txt(240, 194, "каналы к Нилу", "sc-small", "middle");
    b += txt(10, H - 8, "Западный берег Фив; расположение упрощено, без масштаба", "sc-small");
    return svg(W, H, b, "Схема Малкатты");
  }

  /* ---------- Дейр эль-Баллас: расположение дворцов ---------- */
  function ballasPlan() {
    const W = 560, H = 380; let b = `<rect width="${W}" height="${H}" class="sc-sand"/>`;
    b += `<path d="M470 0C455 120 500 250 470 ${H}H${W}V0Z" class="sc-water"/>` + txt(520, 190, "Нил", "sc-label", "middle", `transform="rotate(90 520 190)"`);
    b += `<path d="M60 40C-20 140 10 270 120 330" class="sc-cliff"/><path d="M60 40C120 20 200 30 250 50" class="sc-cliff"/>` + txt(18, 30, "известняковые скалы полукругом", "sc-small");
    // Северный дворец
    b += `<rect x="120" y="120" width="150" height="110" class="sc-wall-thick"/>`;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) b += `<circle cx="${140 + j * 14}" cy="${140 + i * 14}" r="2.5" class="sc-pillar-dot"/>`;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) b += `<circle cx="${200 + j * 14}" cy="${185 + i * 14}" r="2.5" class="sc-pillar-dot"/>`;
    b += `<rect x="208" y="132" width="44" height="36" class="sc-platform"/>` + txt(230, 154, "помост", "sc-small", "middle");
    b += `<path d="M120 200H96" class="sc-passage"/>`;
    b += txt(195, 108, "Северный дворец – жилище царя", "sc-label", "middle");
    b += txt(195, 250, "дворы с колоннами, длинный вход,", "sc-small", "middle") + txt(195, 264, "в центре – высокий помост", "sc-small", "middle");
    // посёлок
    [[340, 90], [372, 122], [350, 160], [395, 74], [334, 200], [374, 212], [410, 160]].forEach(([x, y]) => { b += `<rect x="${x}" y="${y}" width="16" height="12" class="sc-house"/>`; });
    b += txt(375, 244, "дома посёлка", "sc-small", "middle");
    // Южный дворец
    b += `<path d="M330 360Q380 300 440 360" class="sc-hill"/><rect x="350" y="318" width="70" height="16" class="sc-platform"/>`;
    b += txt(385, 306, "Южный дворец", "sc-label", "middle");
    b += txt(340, 344, "наблюдательная площадка", "sc-small", "end") + txt(340, 358, "на холме, с видом на Нил", "sc-small", "end");
    b += `<path d="M420 326Q450 300 468 300" class="sc-leader" marker-end="url(#sc-arr)"/>`;
    b += txt(462, 18, "Расположение упрощено, без масштаба", "sc-small", "end");
    return svg(W, H, DEFS + b, "Схема Дейр эль-Балласа");
  }

  /* ---------- Дворцы в одном масштабе ---------- */
  function palaceAreas() {
    const k = 0.75, g = 214, W = 690; let x = 16, b = `<rect width="${W}" height="300" class="sc-sand"/>`;
    const item = (w, h, cls, l1, l2, l3) => {
      const cx = x + w * k / 2, s = `<rect x="${f(x)}" y="${f(g - h * k)}" width="${f(w * k)}" height="${f(h * k)}" class="${cls}"/>`
        + txt(cx, g + 20, l1, "sc-label", "middle") + txt(cx, g + 36, l2, "sc-small", "middle") + txt(cx, g + 50, l3, "sc-small", "middle");
      x += w * k + 44; return s;
    };
    b += item(230, 230, "sc-ghost", "Великая пирамида", "основание", "230 × 230 м");
    b += item(212, 212, "sc-area-min", "Дейр эль-Баллас", "Северный дворец:", "не меньше 45 000 м²");
    b += item(150, 40, "sc-platform", "Дейр эль-Баллас", "Южный дворец:", "помост ≈150 × 40 м");
    b += item(100, 100, "sc-area-min", "Аварис", "дворец Хиана:", "больше 10 000 м²");
    b += txt(10, 18, "Площади в одном масштабе; для дворцов – квадрат той же площади", "sc-small");
    return `<svg class="scheme scheme-wide" viewBox="0 0 ${W} 300" role="img" aria-label="Дворцы в одном масштабе">${DEFS + b}</svg>`;
  }

  window.Schemes = { monument, pyramidProfile, khufuSection, compare, complexPlan, palaceFacade, egyptMap, memphisMap, gizaPlan, kahunPlan, ballasPlan, palaceAreas, kvCompare, deirMedina, amarnaPlan, malkataPlan };
})();
