const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function rGet(key) {
  const res = await fetch(`${URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  if (!data.result) return null;
  try { return JSON.parse(data.result); } catch { return null; }
}

async function rSet(key, value) {
  const res = await fetch(`${URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  return (await res.json()).result;
}

function genCodigo() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

function normalizarVinos(cata) {
  if (Array.isArray(cata.vinos) && cata.vinos.length > 0) return cata.vinos;
  if (cata.vino) return [cata.vino];
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accion } = req.body;

    if (accion === "crear") {
      const codigo = genCodigo();
      const vinosInput = Array.isArray(req.body.vinos) && req.body.vinos.length > 0
        ? req.body.vinos
        : (req.body.vino ? [req.body.vino] : []);
      const cata = {
        codigo,
        nombre: req.body.nombre || (vinosInput[0]?.nombre ? `Cata · ${vinosInput[0].nombre}` : "Cata grupal"),
        vinos: vinosInput,
        vino: vinosInput[0] || null,
        estado: "abierta",
        participantes: []
      };
      await rSet(`cata:${codigo}`, cata);
      const check = await rGet(`cata:${codigo}`);
      if (!check) return res.status(200).json({ ok: false, error: "Error al guardar en base de datos." });
      return res.status(200).json({ ok: true, codigo });
    }

    if (accion === "unirse") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Código no encontrado. Comprueba que es correcto." });
      const vinos = normalizarVinos(cata);
      return res.status(200).json({
        ok: true,
        nombre: cata.nombre || vinos[0]?.nombre || "Cata grupal",
        vinos,
        vino: vinos[0] || null,
        estado: cata.estado
      });
    }

    if (accion === "participar") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.status(200).json({ ok: false, error: "Esta cata ya está finalizada." });
      if (!Array.isArray(cata.participantes)) cata.participantes = [];
      const wineIdx = Number.isInteger(req.body.wineIdx) ? req.body.wineIdx : 0;
      cata.participantes.push({
        nombre: req.body.nombre || "Anónimo",
        wineIdx,
        ficha: req.body.ficha,
        ts: Date.now()
      });
      await rSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true, total: cata.participantes.length });
    }

    if (accion === "finalizar") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });
      cata.estado = "finalizada";
      await rSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true });
    }

    if (accion === "resultados") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });

      const vinos = normalizarVinos(cata);
      const parts = Array.isArray(cata.participantes) ? cata.participantes : [];

      const contar = (subset, campo) => {
        const mapa = {};
        subset.forEach(p => {
          (p.ficha?.[campo] || []).forEach(item => {
            const t = (item.text || "").trim().toLowerCase();
            if (t) mapa[t] = (mapa[t] || 0) + 1;
          });
        });
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([texto, count]) => ({ texto, count }));
      };

      const porVino = vinos.map((vino, idx) => {
        const subset = parts.filter(p => (Number.isInteger(p.wineIdx) ? p.wineIdx : 0) === idx);
        const punts = subset.map(p => Number(p.ficha?.puntuacion)).filter(v => !isNaN(v) && v > 0);
        const punt_media = punts.length ? Math.round(punts.reduce((a, b) => a + b, 0) / punts.length) : null;
        const coloresMapa = {};
        subset.forEach(p => {
          const c = (p.ficha?.color || "").trim().toLowerCase();
          if (c) coloresMapa[c] = (coloresMapa[c] || 0) + 1;
        });
        return {
          vino,
          total: subset.length,
          punt_media,
          colores: Object.entries(coloresMapa).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([texto, count]) => ({ texto, count })),
          aromas: contar(subset, "arp"),
          aromas_agitada: contar(subset, "ara"),
          sabores: contar(subset, "sab"),
          participantes: subset.map(p => ({ nombre: p.nombre, puntuacion: p.ficha?.puntuacion }))
        };
      });

      const respuesta = {
        ok: true,
        nombre: cata.nombre || "Cata grupal",
        estado: cata.estado,
        vinos: porVino,
      };
      if (porVino.length === 1) {
        respuesta.vino = porVino[0].vino;
        respuesta.resumen = {
          total: porVino[0].total,
          punt_media: porVino[0].punt_media,
          colores: porVino[0].colores,
          aromas: porVino[0].aromas,
          aromas_agitada: porVino[0].aromas_agitada,
          sabores: porVino[0].sabores,
          participantes: porVino[0].participantes,
        };
      }
      return res.status(200).json(respuesta);
    }

    return res.status(200).json({ ok: false, error: "Acción no reconocida." });

  } catch (err) {
    return res.status(200).json({ ok: false, error: "Error interno: " + err.message });
  }
}
