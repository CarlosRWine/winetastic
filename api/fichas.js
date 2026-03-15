// api/fichas.js — CRUD de fichas por usuario (Upstash Redis)

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const r = await fetch(
    `${REDIS_URL}/get/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
  );
  const data = await r.json();
  if (!data.result) return [];
  try { return JSON.parse(data.result); } catch { return []; }
}

async function redisSet(key, value) {
  // Upstash REST API: SET via GET request with value in URL
  const encoded = encodeURIComponent(JSON.stringify(value));
  await fetch(
    `${REDIS_URL}/set/${encodeURIComponent(key)}/${encoded}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { accion, userId, ficha, fichaId, fichas: fichaBulk } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const KEY = `fichas:${userId}`;

  try {
    if (accion === "listar") {
      const fichas = await redisGet(KEY);
      return res.json({ ok: true, fichas });
    }

    if (accion === "guardar") {
      const fichas = await redisGet(KEY);
      const nueva = {
        ...ficha,
        id: ficha.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        fecha: ficha.fecha || new Date().toLocaleDateString("es-ES"),
      };
      fichas.push(nueva);
      await redisSet(KEY, fichas);
      return res.json({ ok: true, ficha: nueva });
    }

    if (accion === "actualizar") {
      const fichas = await redisGet(KEY);
      const idx = fichas.findIndex(f => f.id === fichaId);
      if (idx >= 0) fichas[idx] = { ...ficha, id: fichaId };
      await redisSet(KEY, fichas);
      return res.json({ ok: true });
    }

    if (accion === "borrar") {
      const fichas = await redisGet(KEY);
      await redisSet(KEY, fichas.filter(f => f.id !== fichaId));
      return res.json({ ok: true });
    }

    if (accion === "migrar") {
      const existing = await redisGet(KEY);
      const existingIds = new Set(existing.map(f => f.id?.toString()));
      const nuevas = (fichaBulk || [])
        .filter(f => !existingIds.has(f.id?.toString()))
        .map(f => ({ ...f, id: f.id || `${Date.now()}_${Math.random().toString(36).slice(2)}` }));
      const merged = [...existing, ...nuevas];
      await redisSet(KEY, merged);
      return res.json({ ok: true, migradas: nuevas.length, total: merged.length });
    }

    return res.status(400).json({ error: "Acción desconocida" });

  } catch (err) {
    console.error("fichas.js error:", err);
    return res.status(500).json({ error: err.message });
  }
}
