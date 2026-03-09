export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { uvas, nombre, anada, bodega, tipo, query } = req.body;

    let messages;
    let tools;

    if (tipo === "perfil") {
      messages = [{
        role: "user",
        content: `Eres un sommelier experto. Para las variedades de uva: ${uvas}, describe brevemente en español:
1. 🎨 COLORES típicos (joven vs. crianza)
2. 👃 AROMAS primarios, secundarios y terciarios
3. 👅 SABORES y sensaciones en boca
4. 🍷 ESTILOS habituales
Sé conciso, usa emojis. Máximo 300 palabras.`
      }];

    } else if (tipo === "busqueda") {
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{
        role: "user",
        content: `Busca información sobre el vino "${nombre}" añada ${anada}${bodega ? ` de la bodega "${bodega}"` : ""}. 
En español proporciona: puntuaciones de críticos (Parker, Peñín, Decanter...), descripción organoléptica y maridajes recomendados. Sé conciso.`
      }];

    } else if (tipo === "recomienda") {
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{
        role: "user",
        content: `Eres un sommelier experto. El usuario busca: "${query}"

Busca en internet y recomienda 2-3 vinos concretos en español que encajen perfectamente con esa descripción. Para cada vino incluye:
🍷 Nombre y bodega
📍 Denominación de origen
💰 Precio aproximado
⭐ Puntuación si está disponible
📝 Por qué encaja con lo que busca el usuario
🛒 Dónde comprarlo (menciona tiendas online españolas como Uvinum, Bodeboca o Vinoteca si es relevante)

Sé concreto y práctico. Máximo 400 palabras.`
      }];
    }

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages,
      ...(tools && { tools })
    };

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
