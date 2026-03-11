const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Upstash REST API: GET /get/key  |  SET via pipeline
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accion } = req.body;

    if (accion === "crear") {
      const codigo = genCodigo();
      const cata = { codigo, vino: req.body.vino, estado: "abierta", participantes: [] };
      await rSet(`cata:${codigo}`, cata);
      // Verify it was saved
      const check = await rGet(`cata:${codigo}`);
      if (!check) return res.status(200).json({ ok: false, error: "Error al guardar en base de datos." });
      return res.status(200).json({ ok: true, codigo });
    }

    if (accion === "unirse") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Código no encontrado. Comprueba que es correcto." });
      return res.status(200).json({ ok: true, vino: cata.vino, estado: cata.estado });
    }

    if (accion === "participar") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await rGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.status(200).json({ ok: false, error: "Esta cata ya está finalizada." });
      if (!Array.isArray(cata.participantes)) cata.participantes = [];
      cata.participantes.push({ nombre: req.body.nombre || "Anónimo", ficha: req.body.ficha, ts: Date.now() });
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

      const parts = Array.isArray(cata.participantes) ? cata.participantes : [];

      const punts = parts.map(p => Number(p.ficha?.puntuacion)).filter(v => !isNaN(v) && v > 0);
      const punt_media = punts.length ? Math.round(punts.reduce((a, b) => a + b, 0) / punts.length) : null;

      const contar = (campo) => {
        const mapa = {};
        parts.forEach(p => {
          (p.ficha?.[campo] || []).forEach(item => {
            const t = (item.text || "").trim().toLowerCase();
            if (t) mapa[t] = (mapa[t] || 0) + 1;
          });
        });
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([texto, count]) => ({ texto, count }));
      };

      const coloresMapa = {};
      parts.forEach(p => {
        const c = (p.ficha?.color || "").trim().toLowerCase();
        if (c) coloresMapa[c] = (coloresMapa[c] || 0) + 1;
      });

      const resumen = {
        total: parts.length,
        punt_media,
        colores: Object.entries(coloresMapa).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([texto, count]) => ({ texto, count })),
        aromas: contar("arp"),
        aromas_agitada: contar("ara"),
        sabores: contar("sab"),
        participantes: parts.map(p => ({ nombre: p.nombre, puntuacion: p.ficha?.puntuacion }))
      };

      return res.status(200).json({ ok: true, vino: cata.vino, estado: cata.estado, resumen });
    }

    return res.status(200).json({ ok: false, error: "Acción no reconocida." });

  } catch (err) {
    return res.status(200).json({ ok: false, error: "Error interno: " + err.message });
  }
}
