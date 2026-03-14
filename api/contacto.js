// api/contacto.js — Formulario "Organiza tu Plan Winetastic"
// Envía email a winetasticclub@gmail.com via Resend

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const {
    nombre, email, telefono, provincia, ciudad,
    lugar, personas, tipo, presupuesto, preferencias
  } = req.body || {};

  if (!nombre || !email) {
    return res.status(400).json({ error: "Nombre y email son obligatorios" });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return res.status(500).json({ error: "Servicio de email no configurado" });
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4A0D1A; padding: 24px; text-align: center;">
        <h1 style="color: #C4A882; margin: 0; font-size: 22px;">🍷 Nueva Solicitud de Plan Winetastic</h1>
      </div>
      <div style="background: #F7F4F0; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Nombre</td>
              <td style="padding: 8px; font-weight: bold;">${nombre}</td></tr>
          <tr style="background:#fff"><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
              <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Teléfono</td>
              <td style="padding: 8px;">${telefono || "—"}</td></tr>
          <tr style="background:#fff"><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ubicación</td>
              <td style="padding: 8px;">${ciudad || ""}${provincia ? `, ${provincia}` : ""}</td></tr>
          <tr><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Lugar preferido</td>
              <td style="padding: 8px;">${lugar || "—"}</td></tr>
          <tr style="background:#fff"><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Nº personas</td>
              <td style="padding: 8px;">${personas || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tipo</td>
              <td style="padding: 8px;">${tipo || "—"}</td></tr>
          <tr style="background:#fff"><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Presupuesto</td>
              <td style="padding: 8px;">${presupuesto || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #7A6E72; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Preferencias</td>
              <td style="padding: 8px; font-style: italic;">${preferencias || "Sin preferencias específicas"}</td></tr>
        </table>
      </div>
      <div style="background: #4A0D1A; padding: 14px; text-align: center;">
        <p style="color: #C4A882; margin: 0; font-size: 12px;">winetastic.app · Tu diario de cata personal</p>
      </div>
    </div>
  `;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Winetastic <onboarding@resend.dev>",
        to: ["winetasticclub@gmail.com"],
        subject: `🍷 Nuevo Plan Winetastic — ${nombre} (${ciudad || provincia || "sin ciudad"})`,
        html,
        reply_to: email,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Error Resend");
    return res.json({ ok: true });

  } catch (err) {
    console.error("contacto.js error:", err);
    return res.status(500).json({ error: err.message });
  }
}
