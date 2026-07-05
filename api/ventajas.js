// api/ventajas.js — Lectura pública de ventajas (los usuarios ven las suyas)

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req, res) {
  try {
    const r = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", "ventajas"]),
    });
    const data = await r.json();
    let ventajas = [];
    try { ventajas = JSON.parse(data.result) || []; } catch { /* vacío */ }
    return res.json({ ok: true, ventajas });
  } catch (err) {
    return res.status(200).json({ ok: false, ventajas: [], error: err.message });
  }
}
