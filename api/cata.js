// api/cata.js — Catas grupales v3: multi-vino + roles admin/invitado
//
// MODELO DE DATOS:
//   cata:CODE          → { codigo, vinos:[{nombre,anada,bodega}], estado, creadaEn }
//   cata:CODE:usuarios → HASH pid → { nombre, joinedAt, finalizado }
//   cata:CODE:fichas   → LIST de { pid, nombre, vinoIdx, ficha, ts }  (RPUSH atómico)
//
// Mantiene los fixes v2: comandos en body (sin límite URL), sin race conditions,
// TTL 60 días, verificación de errores.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 60 * 24 * 60 * 60;

async function redis(...command) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

const j = (v) => JSON.stringify(v);
const parse = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

async function getCata(codigo) {
  const raw = await redis("GET", `cata:${codigo}`);
  return raw ? parse(raw) : null;
}

async function setCata(codigo, cata) {
  const ok = await redis("SET", `cata:${codigo}`, j(cata), "EX", TTL);
  if (ok !== "OK") throw new Error("No se pudo guardar la cata");
}

async function getUsuarios(codigo) {
  const flat = await redis("HGETALL", `cata:${codigo}:usuarios`);
  // Upstash devuelve array plano [k1, v1, k2, v2...]
  const usuarios = [];
  if (Array.isArray(flat)) {
    for (let i = 0; i < flat.length; i += 2) {
      const u = parse(flat[i + 1]);
      if (u) usuarios.push({ pid: flat[i], ...u });
    }
  }
  return usuarios;
}

async function getFichas(codigo) {
  const items = await redis("LRANGE", `cata:${codigo}:fichas`, 0, -1);
  return (Array.isArray(items) ? items : []).map(parse).filter(Boolean);
}

function genCodigo() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

const genPid = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Agregados de una lista de fichas (reutilizado por vino)
function agregarFichas(fichas) {
  const punts = fichas.map(f => Number(f.ficha?.puntuacion)).filter(v => !isNaN(v) && v > 0);
  const punt_media = punts.length ? Math.round(punts.reduce((a, b) => a + b, 0) / punts.length) : null;

  const contar = (campo) => {
    const mapa = {};
    fichas.forEach(f => {
      (f.ficha?.[campo] || []).forEach(item => {
        const t = (item.text || "").trim().toLowerCase();
        if (t) mapa[t] = (mapa[t] || 0) + 1;
      });
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([texto, count]) => ({ texto, count }));
  };

  const coloresMapa = {};
  fichas.forEach(f => {
    const c = (f.ficha?.color || "").trim().toLowerCase();
    if (c) coloresMapa[c] = (coloresMapa[c] || 0) + 1;
  });

  return {
    total: fichas.length,
    punt_media,
    colores: Object.entries(coloresMapa).sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([texto, count]) => ({ texto, count })),
    aromas: contar("arp"),
    aromas_agitada: contar("ara"),
    sabores: contar("sab"),
    participantes: fichas.map(f => ({ nombre: f.nombre, puntuacion: f.ficha?.puntuacion })),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { accion } = req.body || {};
    const codigo = (req.body?.codigo || "").toUpperCase().trim();

    // ── CREAR (admin): vinos = [{nombre, anada, bodega}, ...] ───────────────
    if (accion === "crear") {
      const vinos = Array.isArray(req.body.vinos) ? req.body.vinos.filter(v => v?.nombre?.trim()) : [];
      if (vinos.length === 0) return res.json({ ok: false, error: "Añade al menos un vino." });

      let cod = null;
      for (let i = 0; i < 5; i++) {
        const cand = genCodigo();
        if (!(await redis("EXISTS", `cata:${cand}`))) { cod = cand; break; }
      }
      if (!cod) return res.json({ ok: false, error: "No se pudo generar código. Reinténtalo." });

      const cata = { codigo: cod, vinos, estado: "abierta", creadaEn: Date.now() };
      await setCata(cod, cata);

      // Puntos por organizar una cata (+40)
      if (req.body.userId) await redis("INCRBY", `puntos_extra:${req.body.userId}`, 40);

      // Registrar al admin como participante (puede catar también)
      const pid = genPid();
      const adminNombre = (req.body.adminNombre || "Anfitrión").trim() || "Anfitrión";
      await redis("HSET", `cata:${cod}:usuarios`, pid,
        j({ nombre: adminNombre, joinedAt: Date.now(), finalizado: false, esAdmin: true }));
      await redis("EXPIRE", `cata:${cod}:usuarios`, TTL);

      return res.json({ ok: true, codigo: cod, pid, vinos });
    }

    // ── UNIRSE (invitado): registra y devuelve pid ──────────────────────────
    if (accion === "unirse") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Código no encontrado. Comprueba que es correcto." });

      const pid = genPid();
      const nombre = (req.body.nombre || "").trim() || "Invitado";
      await redis("HSET", `cata:${codigo}:usuarios`, pid,
        j({ nombre, joinedAt: Date.now(), finalizado: false }));
      await redis("EXPIRE", `cata:${codigo}:usuarios`, TTL);

      return res.json({ ok: true, vinos: cata.vinos, estado: cata.estado, pid });
    }

    // ── ENVIAR FICHA (una por vino, RPUSH atómico) ──────────────────────────
    if (accion === "enviar_ficha") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.json({ ok: false, error: "Esta cata ya está finalizada." });

      const registro = {
        pid: req.body.pid || null,
        nombre: req.body.nombre || "Anónimo",
        vinoIdx: Number(req.body.vinoIdx) || 0,
        ficha: req.body.ficha,
        ts: Date.now(),
      };
      await redis("RPUSH", `cata:${codigo}:fichas`, j(registro));
      await redis("EXPIRE", `cata:${codigo}:fichas`, TTL);

      // Puntos por participar en cata grupal (+25 por ficha)
      if (req.body.userId) await redis("INCRBY", `puntos_extra:${req.body.userId}`, 25);

      return res.json({ ok: true });
    }

    // ── FINALIZAR PARTICIPANTE (invitado termina su cata) ───────────────────
    if (accion === "finalizar_participante") {
      const pid = req.body.pid;
      const raw = await redis("HGET", `cata:${codigo}:usuarios`, pid);
      const u = raw ? parse(raw) : null;
      if (!u) return res.json({ ok: false, error: "Participante no encontrado." });
      u.finalizado = true;
      await redis("HSET", `cata:${codigo}:usuarios`, pid, j(u));
      return res.json({ ok: true });
    }

    // ── ESTADO (dashboard del admin + polling del invitado) ────────────────
    if (accion === "estado") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });

      const usuarios = await getUsuarios(codigo);
      const fichas = await getFichas(codigo);

      // Fichas enviadas por participante y por vino
      const porUsuario = {};
      const porVino = cata.vinos.map(() => 0);
      fichas.forEach(f => {
        if (f.pid) porUsuario[f.pid] = (porUsuario[f.pid] || 0) + 1;
        if (porVino[f.vinoIdx] !== undefined) porVino[f.vinoIdx]++;
      });

      return res.json({
        ok: true,
        estado: cata.estado,
        vinos: cata.vinos,
        usuarios: usuarios.map(u => ({
          pid: u.pid, nombre: u.nombre, finalizado: !!u.finalizado,
          esAdmin: !!u.esAdmin, fichasEnviadas: porUsuario[u.pid] || 0,
        })),
        porVino,
        totalFichas: fichas.length,
      });
    }

    // ── FINALIZAR CATA (admin) ──────────────────────────────────────────────
    if (accion === "finalizar") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });
      cata.estado = "finalizada";
      await setCata(codigo, cata);
      return res.json({ ok: true });
    }

    // ── RESULTADOS (agregados por vino) ─────────────────────────────────────
    if (accion === "resultados") {
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });

      const fichas = await getFichas(codigo);
      const porVino = cata.vinos.map((vino, idx) => ({
        vino,
        resumen: agregarFichas(fichas.filter(f => f.vinoIdx === idx)),
      }));

      return res.json({
        ok: true,
        estado: cata.estado,
        vinos: cata.vinos,
        porVino,
        resumen_ia: cata.resumen_ia || null,
        totalParticipantes: (await getUsuarios(codigo)).length,
      });
    }

    // ── GUARDAR RESUMEN IA + ARCHIVAR ───────────────────────────────────────
    if (accion === "guardar_resumen") {
      const { resumen_ia } = req.body;
      const cata = await getCata(codigo);
      if (!cata) return res.json({ ok: false, error: "Cata no encontrada." });
      cata.resumen_ia = resumen_ia;
      await setCata(codigo, cata);

      const registro = {
        codigo, vinos: cata.vinos, resumen_ia,
        fecha: new Date().toLocaleDateString("es-ES"), ts: Date.now(),
      };
      await redis("LPUSH", "catas_finalizadas", j(registro));
      await redis("LTRIM", "catas_finalizadas", 0, 49);
      return res.json({ ok: true });
    }

    // ── LISTAR ──────────────────────────────────────────────────────────────
    if (accion === "listar") {
      const items = await redis("LRANGE", "catas_finalizadas", 0, 19);
      return res.json({ ok: true, catas: (items || []).map(parse).filter(Boolean) });
    }

    return res.json({ ok: false, error: "Acción no reconocida." });

  } catch (err) {
    console.error("cata.js error:", err);
    return res.status(200).json({ ok: false, error: "Error interno: " + err.message });
  }
}
