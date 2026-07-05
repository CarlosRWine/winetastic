// api/admin.js — Panel de administración Winetastic
// Protegido por ADMIN_KEY (variable de entorno en Vercel).
// Acciones: stats | listar_ventajas | crear_ventaja | borrar_ventaja

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY;

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

// Pipeline: muchos comandos en una sola petición (clave para stats)
async function redisPipeline(commands) {
  const res = await fetch(`${URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  const data = await res.json();
  return data.map(d => d.result);
}

const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

const NIVELES = [
  { min: 0, nombre: "Principiante" },
  { min: 100, nombre: "Aficionado" },
  { min: 300, nombre: "Catador" },
  { min: 750, nombre: "Experto Catador" },
  { min: 1500, nombre: "Gran Reserva" },
];
const nivelDe = puntos => [...NIVELES].reverse().find(n => puntos >= n.min).nombre;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accion, key } = req.body || {};

  // ── Verificación de clave de administrador ──
  if (!ADMIN_KEY) return res.status(500).json({ ok: false, error: "ADMIN_KEY no configurada en Vercel" });
  if (key !== ADMIN_KEY) return res.status(401).json({ ok: false, error: "Clave de administrador incorrecta" });

  try {
    // ── ESTADÍSTICAS ────────────────────────────────────────────────────────
    if (accion === "stats") {
      const userIds = (await redis("SMEMBERS", "usuarios")) || [];
      const ids = userIds.slice(0, 200); // límite de seguridad

      if (ids.length === 0) {
        return res.json({ ok: true, totalUsuarios: 0, totalFichas: 0, usuarios: [], distribucion: {} });
      }

      // Pipeline: fichas + puntos extra + nombre de cada usuario (3 comandos/usuario, 1 petición)
      const comandos = ids.flatMap(id => [
        ["GET", `fichas:${id}`],
        ["GET", `puntos_extra:${id}`],
        ["HGET", `usuario:${id}`, "nombre"],
        ["GET", `perfil:${id}`],
      ]);
      const resultados = await redisPipeline(comandos);

      // Helpers de agregación
      const top = (mapa, n = 5) => Object.entries(mapa)
        .sort((a, b) => b[1] - a[1]).slice(0, n)
        .map(([texto, count]) => ({ texto, count }));
      const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

      const uvasGlobal = {}, zonasGlobal = {};
      let sumaGlobal = 0, nGlobal = 0;

      const usuarios = ids.map((id, i) => {
        const fichas = parse(resultados[i * 4]) || [];
        const completas = fichas.filter(f => Number(f.puntuacion) > 0);
        const extra = Number(resultados[i * 4 + 1]) || 0;
        const puntos = completas.length * 10 + extra;

        // Media de puntuación del usuario
        const media = completas.length
          ? Math.round(completas.reduce((a, f) => a + Number(f.puntuacion), 0) / completas.length)
          : null;
        sumaGlobal += completas.reduce((a, f) => a + Number(f.puntuacion), 0);
        nGlobal += completas.length;

        // Uvas y zonas catadas
        const uvas = {}, zonas = {};
        fichas.forEach(f => {
          (f.uvas || []).forEach(u => {
            const v = (u.v || "").trim().toLowerCase();
            if (v) { uvas[v] = (uvas[v] || 0) + 1; uvasGlobal[v] = (uvasGlobal[v] || 0) + 1; }
          });
          const z = (f.zona || f.do_cl || "").trim().toLowerCase();
          if (z) { zonas[z] = (zonas[z] || 0) + 1; zonasGlobal[z] = (zonasGlobal[z] || 0) + 1; }
        });

        // Perfil declarado (si existe)
        const pf = parse(resultados[i * 4 + 3]);
        const edad = pf?.nacimiento
          ? Math.floor((Date.now() - new Date(pf.nacimiento).getTime()) / 31557600000)
          : null;

        return {
          id: id.slice(0, 12) + "…", // ID truncado (privacidad)
          nombre: (pf?.nombre ? `${pf.nombre} ${pf.apellidos || ""}`.trim() : null) || resultados[i * 4 + 2] || "—",
          fichas: fichas.length,
          media,
          puntos,
          nivel: nivelDe(puntos),
          uvas: top(uvas, 4).map(u => ({ ...u, texto: cap(u.texto) })),
          zonas: top(zonas, 4).map(z => ({ ...z, texto: cap(z.texto) })),
          provincia: pf?.provincia || null,
          edad,
          prefTipos: pf?.tipos || [],
          prefCrianzas: pf?.crianzas || [],
          consentMarketing: !!pf?.consentMarketing,
        };
      }).sort((a, b) => b.puntos - a.puntos);

      const distribucion = {};
      usuarios.forEach(u => { distribucion[u.nivel] = (distribucion[u.nivel] || 0) + 1; });

      return res.json({
        ok: true,
        totalUsuarios: userIds.length,
        totalFichas: usuarios.reduce((a, u) => a + u.fichas, 0),
        mediaGlobal: nGlobal ? Math.round(sumaGlobal / nGlobal) : null,
        topUvas: top(uvasGlobal, 8).map(u => ({ ...u, texto: cap(u.texto) })),
        topZonas: top(zonasGlobal, 8).map(z => ({ ...z, texto: cap(z.texto) })),
        distribucion,
        usuarios,
      });
    }

    // ── VENTAJAS: LISTAR (vista admin, incluye todas) ───────────────────────
    if (accion === "listar_ventajas") {
      const raw = await redis("GET", "ventajas");
      return res.json({ ok: true, ventajas: parse(raw) || [] });
    }

    // ── VENTAJAS: CREAR ─────────────────────────────────────────────────────
    if (accion === "crear_ventaja") {
      const { titulo, descripcion, codigo, tienda, caducidad, nivelMin } = req.body;
      if (!titulo?.trim()) return res.json({ ok: false, error: "El título es obligatorio" });

      const raw = await redis("GET", "ventajas");
      const ventajas = parse(raw) || [];
      ventajas.unshift({
        id: `v_${Date.now()}`,
        titulo: titulo.trim(),
        descripcion: (descripcion || "").trim(),
        codigo: (codigo || "").trim(),
        tienda: (tienda || "").trim(),
        caducidad: (caducidad || "").trim(),
        nivelMin: Math.max(0, Math.min(4, Number(nivelMin) || 0)),
        creadaEn: Date.now(),
      });
      await redis("SET", "ventajas", JSON.stringify(ventajas.slice(0, 50)));
      return res.json({ ok: true });
    }

    // ── VENTAJAS: BORRAR ────────────────────────────────────────────────────
    if (accion === "borrar_ventaja") {
      const raw = await redis("GET", "ventajas");
      const ventajas = (parse(raw) || []).filter(v => v.id !== req.body.ventajaId);
      await redis("SET", "ventajas", JSON.stringify(ventajas));
      return res.json({ ok: true });
    }

    return res.json({ ok: false, error: "Acción no reconocida" });

  } catch (err) {
    console.error("admin.js error:", err);
    return res.status(200).json({ ok: false, error: "Error interno: " + err.message });
  }
}
