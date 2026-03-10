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
  return data.result ? JSON.parse(data.result) : null;
}

function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accion } = req.body;

  try {

    // ── CREAR ──────────────────────────────────────────────────────────────
    if (accion === "crear") {
      const { vino } = req.body;
      const codigo = generarCodigo();
      const cata = {
        codigo,
        vino,
        estado: "abierta",
        creada: Date.now(),
        participantes: []
      };
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true, codigo });
    }

    // ── UNIRSE ─────────────────────────────────────────────────────────────
    if (accion === "unirse") {
      const { codigo } = req.body;
      const cata = await redisGet(`cata:${codigo.toUpperCase()}`);
      if (!cata) return res.status(404).json({ error: "Código no encontrado. Comprueba que es correcto." });
      return res.status(200).json({ ok: true, cata, finalizada: cata.estado === "finalizada" });
    }

    // ── PARTICIPAR ─────────────────────────────────────────────────────────
    if (accion === "participar") {
      const { codigo, nombre_catador, ficha } = req.body;
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(404).json({ error: "Cata no encontrada." });
      if (cata.estado === "finalizada") return res.status(400).json({ error: "Esta cata ya ha sido finalizada." });
      
      // Safety check - ensure participantes is always an array
      if (!Array.isArray(cata.participantes)) cata.participantes = [];
      
      cata.participantes.push({
        nombre_catador: nombre_catador || "Anónimo",
        ficha,
        fecha: Date.now()
      });
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true, participantes: cata.participantes.length });
    }

    // ── FINALIZAR ──────────────────────────────────────────────────────────
    if (accion === "finalizar") {
      const { codigo } = req.body;
      const cata = await redisGet(`cata:${codigo}`);
      if (!cata) return res.status(404).json({ error: "Cata no encontrada." });
      cata.estado = "finalizada";
      await redisSet(`cata:${codigo}`, cata);
      return res.status(200).json({ ok: true });
    }

    // ── RESULTADOS ─────────────────────────────────────────────────────────
    if (accion === "resultados") {
      const { codigo } = req.body;
      const cata = await redisGet(`cata:${codigo.toUpperCase()}`);
      if (!cata) return res.status(404).json({ error: "Cata no encontrada." });

      const parts = Array.isArray(cata.participantes) ? cata.participantes : [];
      if (parts.length === 0) return res.status(200).json({ ok: true, cata, resumen: null });

      const avg = (key) => {
        const vals = parts.map(p => p.ficha[key]).filter(v => v > 0);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
      };

      const contarTextos = (key) => {
        const mapa = {};
        parts.forEach(p => {
          (p.ficha[key] || []).forEach(item => {
            if (item.text?.trim()) {
              const t = item.text.trim().toLowerCase();
              mapa[t] = (mapa[t] || 0) + 1;
            }
          });
        });
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([texto, count]) => ({ texto, count }));
      };

      const colores = {};
      parts.forEach(p => {
        if (p.ficha.color?.trim()) {
          const c = p.ficha.color.trim().toLowerCase();
          colores[c] = (colores[c] || 0) + 1;
        }
      });

      const resumen = {
        total: parts.length,
        punt_media: avg("puntuacion"),
        punt_vis: avg("punt_vis"),
        punt_olf: avg("punt_olf"),
        punt_gus: avg("punt_gus"),
        seco_dulce: avg("seco_dulce"),
        astringencia: avg("astringencia"),
        aromas_parada: contarTextos("arp"),
        aromas_agitada: contarTextos("ara"),
        sabores: contarTextos("sab"),
        colores: Object.entries(colores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([texto, count]) => ({ texto, count })),
        participantes: parts.map(p => ({ nombre: p.nombre_catador, puntuacion: p.ficha.puntuacion }))
      };

      return res.status(200).json({ ok: true, cata, resumen });
    }

    return res.status(400).json({ error: "Acción no reconocida." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
}
