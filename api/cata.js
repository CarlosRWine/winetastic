// api/cata.js — Catas grupales v2 (arquitectura robusta)
//
// CAMBIOS CLAVE respecto a v1:
// 1. Los comandos van en el BODY (POST) — sin límite de longitud de URL.
//    Antes: /set/key/VALOR_GIGANTE_EN_URL → fallaba con 5+ participantes (URL >8KB).
// 2. Cada participante se añade con RPUSH atómico a una lista propia.
//    Antes: leer cata → modificar array → reescribir todo (race condition:
//    dos envíos simultáneos y uno se perdía).
// 3. TTL de 60 días en las catas para no llenar el plan gratuito de Upstash.
// 4. Verificación de errores en TODAS las escrituras (antes fallaban en silencio).

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const TTL_CATA = 60 * 24 * 60 * 60; // 60 días en segundos

// ── Ejecutar comando Redis via body (sin límite de URL) ──────────────────────
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

async function getCata(codigo) {
  const raw = await redis("GET", `cata:${codigo}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function setCata(codigo, cata) {
  const ok = await redis("SET", `cata:${codigo}`, JSON.stringify(cata), "EX", TTL_CATA);
  if (ok !== "OK") throw new Error("No se pudo guardar la cata");
}

async function getParticipantes(codigo) {
  const items = await redis("LRANGE", `cata:${codigo}:parts`, 0, -1);
  if (!Array.isArray(items)) return [];
  return items.map(i => { try { return JSON.parse(i); } catch { return null; } }).filter(Boolean);
}

function genCodigo() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accion } = req.body || {};
    const codigo = (req.body?.codigo || "").toUpperCase().trim();

    // ── CREAR ─────────────────────────────────────────────────────────────
    if (accion === "crear") {
      // Generar código evitando colisiones (hasta 5 intentos)
      let cod = null;
      for (let i = 0; i < 5; i++) {
        const candidato = genCodigo();
        const existe = await redis("EXISTS", `cata:${candidato}`);
        if (!existe) { cod = candidato; break; }
      }
      if (!cod) return res.json({ ok: false, error: "No se pudo generar código. Inténtalo de nuevo." });

      const cata = { codigo: cod, vino: req.body.vino, estado: "abierta", creadaEn: Date.now() };
      await setCata(cod, cata);
      return res.json({ ok: true, codigo: cod });
    }

    // ── UNIRSE ────────────────────────────────────────────────────────────
    if (accion === "unirse") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Código no encontrado. Comprueba que es correcto." });
      return res.json({ ok: true, vino: cata.vino, estado: cata.estado });
    }

    // ── PARTICIPAR (RPUSH atómico — sin race condition, sin límite) ────────
    if (accion === "participar") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.json({ ok: false, error: "Esta cata ya está finalizada." });

      const participante = {
        nombre: req.body.nombre || "Anónimo",
        ficha: req.body.ficha,
        ts: Date.now(),
      };
      const total = await redis("RPUSH", `cata:${codigo}:parts`, JSON.stringify(participante));
      if (!total) throw new Error("No se pudo registrar la participación");
      // Renovar TTL de la lista para que expire junto con la cata
      await redis("EXPIRE", `cata:${codigo}:parts`, TTL_CATA);

      return res.json({ ok: true, total });
    }

    // ── FINALIZAR ─────────────────────────────────────────────────────────
    if (accion === "finalizar") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });
      cata.estado = "finalizada";
      await setCata(codigo, cata);
      return res.json({ ok: true });
    }

    // ── RESULTADOS ────────────────────────────────────────────────────────
    if (accion === "resultados") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });

      const parts = await getParticipantes(codigo);
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
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 6)
          .map(([texto, count]) => ({ texto, count }));
      };

      const coloresMapa = {};
      parts.forEach(p => {
        const c = (p.ficha?.color || "").trim().toLowerCase();
        if (c) coloresMapa[c] = (coloresMapa[c] || 0) + 1;
      });

      const resumen = {
        total: parts.length,
        punt_media,
        colores: Object.entries(coloresMapa).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([texto, count]) => ({ texto, count })),
        aromas: contar("arp"),
        aromas_agitada: contar("ara"),
        sabores: contar("sab"),
        participantes: parts.map(p => ({ nombre: p.nombre, puntuacion: p.ficha?.puntuacion })),
        resumen_ia: cata.resumen_ia || null,
      };

      return res.json({ ok: true, vino: cata.vino, estado: cata.estado, resumen });
    }

    // ── GUARDAR RESUMEN IA + ARCHIVAR ─────────────────────────────────────
    if (accion === "guardar_resumen") {
      const { resumen_ia, resumen, vino } = req.body;
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });

      cata.resumen_ia = resumen_ia;
      await setCata(codigo, cata);

      const registro = {
        codigo, vino, resumen_ia,
        punt_media: resumen?.punt_media ?? null,
        total: resumen?.total ?? null,
        fecha: new Date().toLocaleDateString("es-ES"),
        ts: Date.now(),
      };
      await redis("LPUSH", "catas_finalizadas", JSON.stringify(registro));
      await redis("LTRIM", "catas_finalizadas", 0, 49); // conservar solo las 50 últimas

      return res.json({ ok: true });
    }

    // ── LISTAR CATAS FINALIZADAS ──────────────────────────────────────────
    if (accion === "listar") {
      const items = await redis("LRANGE", "catas_finalizadas", 0, 19);
      const catas = (items || []).map(i => { try { return JSON.parse(i); } catch { return null; } }).filter(Boolean);
      return res.json({ ok: true, catas });
    }

    return res.json({ ok: false, error: "Acción no reconocida." });

  } catch (err) {
    console.error("cata.js error:", err);
    return res.status(200).json({ ok: false, error: "Error interno: " + err.message });
  }
}
