export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tipo } = req.body;
    let messages, tools;

    if (tipo === "perfil") {
      const { uvas } = req.body;
      messages = [{ role: "user", content: `Eres un sommelier experto. Para las variedades de uva: ${uvas}, describe brevemente en español:\n1. 🎨 COLORES típicos (joven vs. crianza)\n2. 👃 AROMAS primarios, secundarios y terciarios\n3. 👅 SABORES y sensaciones en boca\n4. 🍷 ESTILOS habituales\nSé conciso, usa emojis. Máximo 300 palabras.` }];

    } else if (tipo === "busqueda") {
      const { nombre, anada, bodega } = req.body;
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{ role: "user", content: `Busca información sobre el vino "${nombre}" añada ${anada}${bodega ? ` de la bodega "${bodega}"` : ""}. En español: puntuaciones de críticos (Parker, Peñín, Decanter...), descripción organoléptica y maridajes recomendados. Sé conciso.` }];

    } else if (tipo === "recomienda") {
      const { query } = req.body;
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{ role: "user", content: `Eres un sommelier experto. El usuario busca: "${query}"\n\nBusca en internet y recomienda 2-3 vinos concretos en español. Para cada vino incluye:\n🍷 Nombre y bodega\n📍 Denominación de origen\n💰 Precio aproximado\n⭐ Puntuación si está disponible\n📝 Por qué encaja con lo que busca\n🛒 Dónde comprarlo (Uvinum, Bodeboca, Vinoteca...)\n\nSé concreto. Máximo 400 palabras.` }];

    } else if (tipo === "resumen_cata") {
      const { vino, resumen } = req.body;
      const aromas = [...(resumen.aromas || []), ...(resumen.aromas_agitada || [])].map(a => `${a.texto} (${a.count} personas)`).join(", ");
      const sabores = (resumen.sabores || []).map(s => `${s.texto} (${s.count} personas)`).join(", ");
      const colores = (resumen.colores || []).map(c => `${c.texto} (${c.count} personas)`).join(", ");
      const participantes = resumen.participantes?.map(p => `${p.nombre}: ${p.puntuacion}/100`).join(", ");

      messages = [{ role: "user", content: `Eres un sommelier experto. Redacta una nota de cata colectiva en español para el vino "${vino.nombre}"${vino.bodega ? ` de ${vino.bodega}` : ""}${vino.anada ? `, añada ${vino.anada}` : ""}.

Datos de la cata grupal (${resumen.total} participantes):
- Puntuación media: ${resumen.punt_media}/100
- Puntuaciones individuales: ${participantes}
- Colores percibidos: ${colores || "no registrados"}
- Aromas detectados: ${aromas || "no registrados"}
- Sabores detectados: ${sabores || "no registrados"}

Redacta una nota de cata de 3-4 frases que sintetice las percepciones del grupo de forma elegante y profesional, como si fuera la descripción oficial del vino basada en opiniones de consumidores reales. Termina con una frase de valoración global.` }];

    } else {
      return res.status(400).json({ error: "Tipo no reconocido." });
    }

    const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages, ...(tools && { tools }) };
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        ...(tools && { "anthropic-beta": "web-search-2025-03-05" })
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Sin resultados.";
    res.status(200).json({ text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
