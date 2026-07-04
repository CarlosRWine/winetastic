// api/fichas.js — CRUD de fichas por usuario v2 (robusto)
//
// FIX CRÍTICO: antes el SET metía todo el array de fichas en la URL.
// Con ~10-15 fichas guardadas la URL superaba el límite (~8KB) y el
// guardado fallaba EN SILENCIO → "las fichas desaparecen a largo plazo".
// Ahora los comandos van en el body (sin límite) y toda escritura se verifica.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...command) {
  if (!URL || !TOKEN) {
    throw new Error("Faltan variables de entorno UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN en Vercel.");
  }
  let res;
  try {
    res = await fetch(URL.trim(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
  } catch (e) {
    throw new Error(`No se pudo conectar con Upstash (${command[0]}): ${e.message}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`Redis (${command[0]}): ${data.error}`);
  return data.result;
}

async function getFichas(key) {
  const raw = await redis("GET", key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function setFichas(key, fichas) {
  const ok = await redis("SET", key, JSON.stringify(fichas));
  if (ok !== "OK") throw new Error("No se pudo guardar en la nube");
}

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accion, userId, ficha, fichaId, fichas: fichaBulk } = req.body || {};
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId requerido" });
  }

  const KEY = `fichas:${userId}`;

  try {
    if (accion === "listar") {
      const fichas = await getFichas(KEY);
      return res.json({ ok: true, fichas });
    }

    if (accion === "guardar") {
      const fichas = await getFichas(KEY);
      const nueva = {
        ...ficha,
        id: ficha?.id || genId(),
        fecha: ficha?.fecha || new Date().toLocaleDateString("es-ES"),
      };
      fichas.push(nueva);
      await setFichas(KEY, fichas);
      return res.json({ ok: true, ficha: nueva });
    }

    if (accion === "actualizar") {
      const fichas = await getFichas(KEY);
      const idx = fichas.findIndex(f => String(f.id) === String(fichaId));
      if (idx === -1) return res.json({ ok: false, error: "Ficha no encontrada" });
      fichas[idx] = { ...ficha, id: fichas[idx].id, fecha: fichas[idx].fecha };
      await setFichas(KEY, fichas);
      return res.json({ ok: true });
    }

    if (accion === "borrar") {
      const fichas = await getFichas(KEY);
      const restantes = fichas.filter(f => String(f.id) !== String(fichaId));
      await setFichas(KEY, restantes);
      return res.json({ ok: true, total: restantes.length });
    }

    if (accion === "migrar") {
      const existing = await getFichas(KEY);
      const existingIds = new Set(existing.map(f => String(f.id)));
      const nuevas = (Array.isArray(fichaBulk) ? fichaBulk : [])
        .filter(f => !existingIds.has(String(f.id)))
        .map(f => ({ ...f, id: f.id || genId() }));
      if (nuevas.length > 0) {
        await setFichas(KEY, [...existing, ...nuevas]);
      }
      return res.json({ ok: true, migradas: nuevas.length, total: existing.length + nuevas.length });
    }

    return res.status(400).json({ error: "Acción desconocida" });

  } catch (err) {
    console.error("fichas.js error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
