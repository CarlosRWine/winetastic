// api/sesiones.js — CRUD de sesiones de cata por usuario (Upstash Redis)
//
// Una "sesión" agrupa una o varias fichas de vino bajo un mismo evento de cata.
// Es el contenedor que la app expondrá en una fase posterior; en este primer
// despliegue el endpoint solo se utiliza para la migración silenciosa de las
// fichas ya existentes (cada ficha pasa a tener su propia sesión implícita
// de un solo vino) y queda preparado para los lotes C-E.
//
// Modelo:
//   {
//     id, nombre, fecha (ISO YYYY-MM-DD),
//     modalidad: 'solo' | 'grupal',
//     ciega: boolean,
//     anfitrionCata: boolean,        // solo aplica si modalidad === 'grupal'
//     codigo: string | null,         // código compartido para sesiones grupales
//     fichaIds: string[],            // orden en que se cataron los vinos
//     estado: 'abierta' | 'finalizada',
//     resumen_ia: string | null,     // resumen colectivo (sesión grupal)
//     ranking_comments: { fichaId, text }[] | null,  // comentarios IA por vino
//     createdAt: number,             // timestamp ms
//     updatedAt: number
//   }

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
  const encoded = encodeURIComponent(JSON.stringify(value));
  await fetch(
    `${REDIS_URL}/set/${encodeURIComponent(key)}/${encoded}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
  );
}

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

// Convierte "DD/MM/YYYY" (formato es-ES guardado en fichas antiguas) a ISO
// "YYYY-MM-DD". Si ya viene en ISO o no se reconoce, se devuelve hoy.
function isoFromLocale(s) {
  if (!s) return new Date().toISOString().slice(0, 10);
  const str = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return new Date().toISOString().slice(0, 10);
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Extrae el timestamp numérico del prefijo de un id (compatible con ids
// numéricos antiguos y con los nuevos `${Date.now()}_${random}`).
function tsOfId(id) {
  if (typeof id === "number") return id;
  const m = String(id ?? "").match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : Date.now();
}

function newSesion(extra = {}) {
  const now = Date.now();
  return {
    id: extra.id || genId(),
    nombre: typeof extra.nombre === "string" && extra.nombre.trim() ? extra.nombre.trim() : "Cata sin nombre",
    fecha: extra.fecha || new Date().toISOString().slice(0, 10),
    modalidad: extra.modalidad === "grupal" ? "grupal" : "solo",
    ciega: !!extra.ciega,
    anfitrionCata: extra.anfitrionCata !== false,  // default true
    codigo: extra.codigo || null,
    fichaIds: Array.isArray(extra.fichaIds) ? extra.fichaIds : [],
    estado: extra.estado === "finalizada" ? "finalizada" : "abierta",
    resumen_ia: extra.resumen_ia || null,
    ranking_comments: Array.isArray(extra.ranking_comments) ? extra.ranking_comments : null,
    createdAt: extra.createdAt || now,
    updatedAt: now,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { accion, userId, sesion, sesionId, datos } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const KEY = `sesiones:${userId}`;
  const FICHAS_KEY = `fichas:${userId}`;

  try {
    if (accion === "listar") {
      const sesiones = await redisGet(KEY);
      return res.json({ ok: true, sesiones });
    }

    if (accion === "obtener") {
      const sesiones = await redisGet(KEY);
      const s = sesiones.find(x => x.id === sesionId);
      return res.json({ ok: true, sesion: s || null });
    }

    if (accion === "crear") {
      const sesiones = await redisGet(KEY);
      const nueva = newSesion(sesion || {});
      sesiones.push(nueva);
      await redisSet(KEY, sesiones);
      return res.json({ ok: true, sesion: nueva });
    }

    if (accion === "actualizar") {
      const sesiones = await redisGet(KEY);
      const idx = sesiones.findIndex(x => x.id === sesionId);
      if (idx < 0) return res.json({ ok: false, error: "Sesión no encontrada" });
      sesiones[idx] = {
        ...sesiones[idx],
        ...(datos || {}),
        id: sesionId,
        updatedAt: Date.now(),
      };
      await redisSet(KEY, sesiones);
      return res.json({ ok: true, sesion: sesiones[idx] });
    }

    if (accion === "borrar") {
      // Solo borra la sesión; las fichas asociadas conservan el sesionId
      // huérfano para que el usuario pueda reasignarlas si quiere. Una
      // limpieza posterior puede recogerlas en la siguiente migración.
      const sesiones = await redisGet(KEY);
      await redisSet(KEY, sesiones.filter(x => x.id !== sesionId));
      return res.json({ ok: true });
    }

    if (accion === "migrar") {
      // Crea sesiones implícitas para fichas que aún no las tengan asignadas.
      // Idempotente: si todas las fichas ya tienen sesionId, no hace nada.
      const sesiones = await redisGet(KEY);
      const fichas = await redisGet(FICHAS_KEY);

      const huerfanas = fichas.filter(f => !f.sesionId);
      if (huerfanas.length === 0) {
        return res.json({ ok: true, migradas: 0, totalSesiones: sesiones.length });
      }

      const sesionesNuevas = [...sesiones];
      const fichasActualizadas = [...fichas];

      huerfanas.forEach(f => {
        const ts = tsOfId(f.id);
        const nueva = newSesion({
          nombre: f.nombre || "Cata sin nombre",
          fecha: isoFromLocale(f.fecha),
          modalidad: "solo",
          fichaIds: [f.id],
          estado: "finalizada",
          createdAt: ts,
        });
        sesionesNuevas.push(nueva);
        const idx = fichasActualizadas.findIndex(x => x.id === f.id);
        if (idx >= 0) {
          fichasActualizadas[idx] = { ...fichasActualizadas[idx], sesionId: nueva.id };
        }
      });

      await redisSet(KEY, sesionesNuevas);
      await redisSet(FICHAS_KEY, fichasActualizadas);

      return res.json({
        ok: true,
        migradas: huerfanas.length,
        totalSesiones: sesionesNuevas.length,
      });
    }

    return res.status(400).json({ error: "Acción desconocida" });

  } catch (err) {
    console.error("sesiones.js error:", err);
    return res.status(500).json({ error: err.message });
  }
}
