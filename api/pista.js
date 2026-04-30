export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tipo } = req.body;
    let messages, tools;

    if (tipo === "perfil") {
      const { uvas } = req.body;
      messages = [{ role: "user", content: `Eres un sommelier experto. Para las variedades de uva: ${uvas}, redacta en español una descripción organoléptica con cuatro apartados, separando cada uno con un encabezado en MAYÚSCULAS y una línea en blanco antes y después. Los apartados son:

COLORES
Una o dos frases describiendo los colores típicos en versión joven y en versión con crianza.

AROMAS
Aromas primarios (frutales, florales, vegetales), secundarios (de fermentación) y terciarios (de crianza), agrupados en una o dos frases por tipo.

SABORES
Sensaciones en boca, estructura, acidez, taninos y persistencia.

ESTILOS
Estilos de vino habituales con esta variedad y zonas vinícolas representativas.

No uses emojis ni símbolos decorativos. Tono editorial, frases cortas. Máximo 280 palabras en total.` }];

    } else if (tipo === "busqueda") {
      const { nombre, anada, bodega } = req.body;
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{ role: "user", content: `Busca información sobre el vino "${nombre}" añada ${anada}${bodega ? ` de la bodega "${bodega}"` : ""}. Redacta la respuesta en español en tres apartados claramente separados, cada uno encabezado en MAYÚSCULAS:

CRÍTICA
Puntuaciones y comentarios breves de críticos relevantes (Parker, Peñín, Decanter, Wine Spectator, Suckling).

DESCRIPCIÓN ORGANOLÉPTICA
Color, aromas, paso por boca y final.

MARIDAJES
Tres a cinco maridajes concretos.

No uses emojis ni símbolos. Tono editorial, conciso.` }];

    } else if (tipo === "recomienda") {
      const { query } = req.body;
      tools = [{ type: "web_search_20250305", name: "web_search" }];
      messages = [{ role: "user", content: `Eres un sommelier experto. El usuario busca: "${query}"

Busca en internet y recomienda 2 o 3 vinos concretos. Para cada vino, redacta una ficha con seis líneas etiquetadas en MAYÚSCULAS al inicio de línea, en este orden exacto:

NOMBRE — Nombre del vino y bodega
ZONA — Denominación de origen y región
PRECIO — Precio aproximado en euros
PUNTUACIÓN — Si está disponible (Parker, Peñín, etc.)
POR QUÉ — Por qué encaja con lo que busca el usuario, en una frase
DÓNDE — Tiendas online que lo distribuyen (Uvinum, Bodeboca, Vinissimus, Decántalo)

Separa cada vino con una línea en blanco. No uses emojis ni símbolos decorativos. Tono editorial, máximo 350 palabras en total.` }];

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
