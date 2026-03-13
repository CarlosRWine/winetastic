// api/fichas.js — CRUD de fichas por usuario (Upstash Redis + Clerk auth)

import { createClerkClient } from "@clerk/backend";

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// ── Redis helpers ─────────────────────────────────────────────────────────────
async function redisGet(key) {
  const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await r.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function redisSet(key, value) {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "text/plain" },
    body: JSON.stringify(value),
  });
}

// ── Verificar token de Clerk ──────────────────────────────────────────────────
async function getUserId(req) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  try {
    const payload = await clerk.verifyToken(token);
    return payload.sub; // userId verificado
  } catch {
    return null;
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Verificar identidad — ignoramos cualquier userId del body
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { accion, ficha, fichaId, fichas: fichaBulk } = req.body || {};
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
        .map(f => ({
          ...f,
          id: f.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }));
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
