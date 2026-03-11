const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisSet(key, value) {
  const res = await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(value) })
  });
  return (await res.json()).result;
}

async function redisGet(key) {
  const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  const data = await res.json();
  if (!data.result) return null;
  try { return JSON.parse(data.result); } catch { return null; }
}

function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accion } = req.body;

    // CREAR
    if (accion === "crear") {
      const codigo = generarCodigo();
      const cata = { codigo, vino: req.body.vino, estado: "abierta", participantes: [] };
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true, codigo });
    }

    // UNIRSE
    if (accion === "unirse") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Código no encontrado." });
      return res.status(200).json({ ok: true, vino: cata.vino, estado: cata.estado });
    }

    // PARTICIPAR
    if (accion === "participar") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.status(200).json({ ok: false, error: "Esta cata ya está finalizada." });
      if (!Array.isArray(cata.participantes)) cata.participantes = [];
      cata.participantes.push({
        nombre: req.body.nombre || "Anónimo",
        ficha: req.body.ficha,
        ts: Date.now()
      });
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true, total: cata.participantes.length });
    }

    // FINALIZAR
    if (accion === "finalizar") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });
      cata.estado = "finalizada";
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true });
    }

    // RESULTADOS
    if (accion === "resultados") {
      const codigo = (req.body.codigo || "").toUpperCase().trim();
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(200).json({ ok: false, error: "Cata no encontrada." });

      const parts = Array.isArray(cata.participantes) ? cata.participantes : [];

      // Puntuación media
      const punts = parts.map(p => Number(p.ficha?.puntuacion)).filter(v => !isNaN(v) && v > 0);
      const punt_media = punts.length ? Math.round(punts.reduce((a,b) => a+b,0) / punts.length) : null;

      // Contar textos de un campo
      const contar = (campo) => {
        const mapa = {};
        parts.forEach(p => {
          const arr = p.ficha?.[campo] || [];
          arr.forEach(item => {
            const t = (item.text || "").trim().toLowerCase();
            if (t) mapa[t] = (mapa[t] || 0) + 1;
          });
        });
        return Object.entries(mapa)
          .sort((a,b) => b[1]-a[1])
          .slice(0, 6)
          .map(([texto, count]) => ({ texto, count }));
      };

      // Colores
      const coloresMapa = {};
      parts.forEach(p => {
        const c = (p.ficha?.color || "").trim().toLowerCase();
        if (c) coloresMapa[c] = (coloresMapa[c] || 0) + 1;
      });
      const colores = Object.entries(coloresMapa)
        .sort((a,b) => b[1]-a[1]).slice(0,4)
        .map(([texto, count]) => ({ texto, count }));

      const resumen = {
        total: parts.length,
        punt_media,
        colores,
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
