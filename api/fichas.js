// api/fichas.js — CRUD de fichas por usuario v2 (robusto)
//
// FIX CRÍTICO: antes el SET metía todo el array de fichas en la URL.
// Con ~10-15 fichas guardadas la URL superaba el límite (~8KB) y el
// guardado fallaba EN SILENCIO → "las fichas desaparecen a largo plazo".
// Ahora los comandos van en el body (sin límite) y toda escritura se verifica.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...command) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
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
      // Registrar usuario (para estadísticas y niveles)
      await redis("SADD", "usuarios", userId);
      if (req.body.nombre) await redis("HSET", `usuario:${userId}`, "nombre", req.body.nombre);
      return res.json({ ok: true, fichas });
    }

    if (accion === "obtener_perfil") {
      const raw = await redis("GET", `perfil:${userId}`);
      let datos = null;
      try { datos = JSON.parse(raw); } catch { /* sin perfil */ }
      return res.json({ ok: true, perfil: datos });
    }

    if (accion === "guardar_perfil") {
      const p = req.body.perfil || {};
      // Leer perfil previo para saber si el bono ya fue concedido
      const rawPrev = await redis("GET", `perfil:${userId}`);
      let prev = null;
      try { prev = JSON.parse(rawPrev); } catch { /* primero */ }

      const completo = !!(p.nombre?.trim() && p.provincia?.trim() && p.nacimiento);
      const bonusYaDado = !!prev?.bonusDado;
      const darBonus = completo && !bonusYaDado;

      const nuevo = {
        nombre: (p.nombre || "").trim(),
        apellidos: (p.apellidos || "").trim(),
        provincia: (p.provincia || "").trim(),
        pais: (p.pais || "España").trim(),
        nacimiento: p.nacimiento || "",
        tipos: Array.isArray(p.tipos) ? p.tipos : [],
        crianzas: Array.isArray(p.crianzas) ? p.crianzas : [],
        presupuesto: p.presupuesto || "",
        frecuencia: p.frecuencia || "",
        consentMarketing: !!p.consentMarketing,
        consentFecha: p.consentMarketing ? (prev?.consentFecha || Date.now()) : null,
        bonusDado: bonusYaDado || darBonus,
        actualizadoEn: Date.now(),
      };
      await redis("SET", `perfil:${userId}`, JSON.stringify(nuevo));
      if (darBonus) await redis("INCRBY", `puntos_extra:${userId}`, 50);

      return res.json({ ok: true, bonus: darBonus ? 50 : 0 });
    }

    if (accion === "perfil") {
      const fichas = await getFichas(KEY);
      const completas = fichas.filter(f => Number(f.puntuacion) > 0).length;
      const extraRaw = await redis("GET", `puntos_extra:${userId}`);
      const extra = Number(extraRaw) || 0;
      const puntos = completas * 10 + extra;
      return res.json({ ok: true, puntos, fichas: fichas.length, completas, extra });
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
