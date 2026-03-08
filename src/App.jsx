import { useState } from "react";

const LOGO = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/2Q==";

const C = {
  bg: "#FAF4EC", card: "#FFFFFF", border: "#E8D5C4",
  burgundy: "#722838", burDark: "#5A1E2A",
  gold: "#C9AA7E", goldDark: "#A8894E",
  text: "#2A1218", muted: "#8B6B73", section: "#FDF7F0",
};

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
document.head.appendChild(fontLink);

const F = { script: "'Dancing Script', cursive", serif: "'EB Garamond', Georgia, serif" };

// ─── SCALE PICKER ──────────────────────────────────────────────────────────
const ScalePicker = ({ value, onChange, max = 5 }) => (
  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
    {[...Array(max)].map((_, i) => (
      <button key={i} onClick={() => onChange(value === i + 1 ? 0 : i + 1)} title={`${i+1}/${max}`}
        style={{ width: 22, height: 22, borderRadius: "50%", padding: 0, cursor: "pointer",
          border: `2px solid ${i < value ? C.gold : C.border}`,
          background: i < value ? `radial-gradient(circle at 40% 35%, #E8C98A, ${C.gold})` : "transparent",
          boxShadow: i < value ? `0 1px 4px ${C.gold}60` : "none",
          transition: "all 0.18s ease" }} />
    ))}
    {value > 0 && <span style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, marginLeft: 4 }}>{value}/{max}</span>}
  </div>
);

// ─── SECTION ───────────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
    marginBottom: 24, overflow: "hidden", boxShadow: "0 2px 12px rgba(114,40,56,0.06)" }}>
    <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
      padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <h2 style={{ margin: 0, color: "#FDF7F0", fontSize: 13, fontFamily: F.script, fontWeight: 700, letterSpacing: 0.5 }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: "20px 24px" }}>{children}</div>
  </div>
);

// ─── FIELD ─────────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 10, color: C.muted, letterSpacing: 2.5,
      textTransform: "uppercase", fontFamily: F.serif, marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const iBase = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
  padding: "9px 13px", color: C.text, fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: F.serif, transition: "border-color 0.2s" };

const TInput = ({ value, onChange, placeholder, type = "text" }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    onFocus={e => e.target.style.borderColor = C.gold}
    onBlur={e => e.target.style.borderColor = C.border}
    style={iBase} />
);

const AromaRow = ({ item, onChange, label, index }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
    <span style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, minWidth: 16 }}>{index + 1}.</span>
    <div style={{ flex: 1 }}>
      <input value={item.text} onChange={e => onChange({ ...item, text: e.target.value })}
        placeholder={label}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border}
        style={iBase} />
    </div>
    <ScalePicker value={item.int} onChange={v => onChange({ ...item, int: v })} />
  </div>
);

const AddBtn = ({ onClick, label = "Añadir" }) => (
  <button onClick={onClick}
    style={{ fontSize: 12, color: C.gold, background: "none", border: `1px dashed ${C.gold}60`,
      borderRadius: 6, cursor: "pointer", padding: "5px 14px", marginBottom: 4,
      fontFamily: F.serif, display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.18s" }}
    onMouseOver={e => e.currentTarget.style.background = `${C.gold}12`}
    onMouseOut={e => e.currentTarget.style.background = "none"}>
    + {label}
  </button>
);

const SECO_LABELS = ["Seco", "Semi-seco", "Abocado", "Semi-dulce", "Dulce", "Muy dulce"];

// ─── MODAL "DAME UNA PISTA" ────────────────────────────────────────────────
const PistaModal = ({ uvas, nombre, anada, bodega, onClose }) => {
  const [perfilText, setPerfilText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  const uvaList = uvas.filter(u => u.v.trim()).map(u => u.p ? `${u.v} (${u.p}%)` : u.v).join(", ");
  const canSearch = nombre.trim() && anada;

  const fetchPerfil = async () => {
    setLoadingPerfil(true);
    setPerfilText("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres un sommelier experto. Para las variedades de uva: ${uvaList}, describe de forma breve y práctica en español:

1. 🎨 COLORES típicos en copa (joven vs. crianza)
2. 👃 AROMAS primarios, secundarios y terciarios más característicos
3. 👅 SABORES y sensaciones en boca típicas
4. 🍷 ESTILOS de vino habituales

Sé conciso y usa emojis de viñeta. Máximo 300 palabras.`
          }]
        })
      });
      const data = await res.json();
      setPerfilText(data.content?.[0]?.text || "No se pudo obtener información.");
    } catch {
      setPerfilText("Error al conectar con la IA. Comprueba tu conexión.");
    }
    setLoadingPerfil(false);
  };

  const fetchSearch = async () => {
    setLoadingSearch(true);
    setSearchText("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Busca información sobre el vino "${nombre}" añada ${anada}${bodega ? ` de la bodega "${bodega}"` : ""}. 
Proporciona en español:
- Puntuaciones de críticos (Parker, Peñín, Decanter...) si están disponibles
- Descripción organoléptica oficial
- Maridajes recomendados
Sé conciso. Si no encuentras datos específicos, indica los datos generales de la bodega o denominación.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Sin resultados.";
      setSearchText(text);
    } catch {
      setSearchText("Error al realizar la búsqueda. Comprueba tu conexión.");
    }
    setLoadingSearch(false);
  };

  const handleCopy = () => {
    const all = [perfilText && `PERFIL VARIETAL:\n${perfilText}`, searchText && `FICHA ONLINE:\n${searchText}`].filter(Boolean).join("\n\n---\n\n");
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-fetch perfil when modal opens
  useState(() => { fetchPerfil(); }, []);
  // Actually use useEffect pattern via immediate call
  if (!perfilText && !loadingPerfil) fetchPerfil();

  const Spinner = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontStyle: "italic", fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.burgundy,
        borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Consultando al sommelier...
    </div>
  );

  const ResultBox = ({ text }) => (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "14px 18px", fontSize: 14, lineHeight: 1.75, fontFamily: F.serif,
      color: C.text, whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
      {text}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,18,24,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background: C.card, borderRadius: 16, width: "100%", maxWidth: 600,
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(42,18,24,0.3)", border: `1px solid ${C.border}` }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
          padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: "16px 16px 0 0" }}>
          <div>
            <h2 style={{ margin: 0, color: "#FDF7F0", fontFamily: F.script, fontSize: 22, fontWeight: 700 }}>
              ✦ Dame una Pista
            </h2>
            <p style={{ margin: "2px 0 0", color: `${C.gold}`, fontSize: 12, fontFamily: F.serif, fontStyle: "italic" }}>
              {uvaList}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#FDF7F0",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        <div style={{ padding: "24px" }}>

          {/* SECCIÓN A: Perfil varietal */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, color: C.burgundy, fontFamily: F.serif,
                textTransform: "uppercase", letterSpacing: 2 }}>
                🍇 Perfil Varietal
              </h3>
              <button onClick={fetchPerfil} disabled={loadingPerfil}
                style={{ fontSize: 11, color: C.muted, background: "none",
                  border: `1px solid ${C.border}`, borderRadius: 5, padding: "3px 10px",
                  cursor: "pointer", fontFamily: F.serif }}>
                ↺ Regenerar
              </button>
            </div>
            {loadingPerfil ? <Spinner /> : perfilText ? <ResultBox text={perfilText} /> : null}
          </div>

          {/* SECCIÓN B: Búsqueda online */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, color: C.burgundy, fontFamily: F.serif,
                textTransform: "uppercase", letterSpacing: 2 }}>
                🔍 Ficha Online
              </h3>
              {!canSearch && (
                <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic", fontFamily: F.serif }}>
                  Requiere nombre y añada
                </span>
              )}
            </div>

            {canSearch ? (
              <>
                {!searchText && !loadingSearch && (
                  <button onClick={fetchSearch}
                    style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                      color: "#FDF7F0", border: "none", borderRadius: 8, padding: "10px 22px",
                      fontSize: 14, cursor: "pointer", fontFamily: F.script, fontWeight: 700,
                      width: "100%" }}>
                    🔍 Buscar ficha de "{nombre}" {anada}
                  </button>
                )}
                {loadingSearch && <Spinner />}
                {searchText && <ResultBox text={searchText} />}
                {searchText && (
                  <p style={{ fontSize: 10, color: C.muted, fontStyle: "italic", marginTop: 8, fontFamily: F.serif }}>
                    ℹ️ Información obtenida de fuentes públicas. Úsala como orientación.
                  </p>
                )}
              </>
            ) : (
              <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 8,
                padding: "16px", textAlign: "center", color: C.muted, fontSize: 13, fontStyle: "italic", fontFamily: F.serif }}>
                Introduce el nombre del vino y la añada en el formulario para buscar su ficha online.
              </div>
            )}
          </div>

          {/* Botones finales */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
            {(perfilText || searchText) && (
              <button onClick={handleCopy}
                style={{ fontSize: 13, color: C.burgundy, background: "none",
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 18px",
                  cursor: "pointer", fontFamily: F.serif }}>
                {copied ? "✓ Copiado" : "📋 Copiar pistas"}
              </button>
            )}
            <button onClick={onClose}
              style={{ fontSize: 13, color: "#FDF7F0", background: C.burgundy,
                border: "none", borderRadius: 8, padding: "9px 18px",
                cursor: "pointer", fontFamily: F.serif }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── FORM INICIAL ──────────────────────────────────────────────────────────
const newForm = () => ({
  nombre: "", zona: "", do_cl: "", anada: "", bodega: "",
  uvas: [{ v: "", p: "" }],
  color: "", int_color: 0, lagrima: 0, opacidad: 0, limpieza: 0, punt_vis: 0,
  arp: [{ text: "", int: 0 }], ara: [{ text: "", int: 0 }], punt_olf: 0,
  sab: [{ text: "", int: 0 }],
  seco_dulce: 0, astringencia: 0, retro_p: 0, retro_t: "", punt_gus: 0,
  puntuacion: 0, notas: ""
});

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────
export default function WinetasticApp() {
  const [form, setForm] = useState(newForm());
  const [toast, setToast] = useState(false);
  const [showPista, setShowPista] = useState(false);
  const [count, setCount] = useState(() => JSON.parse(localStorage.getItem("wt_fichas") || "[]").length);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addRow = k => { if (form[k].length < 5) set(k, [...form[k], { text: "", int: 0 }]); };
  const updRow = (k, i, val) => { const a = [...form[k]]; a[i] = val; set(k, a); };
  const addUva = () => { if (form.uvas.length < 5) set("uvas", [...form.uvas, { v: "", p: "" }]); };
  const updUva = (i, f2, val) => { const a = [...form.uvas]; a[i] = { ...a[i], [f2]: val }; set("uvas", a); };

  const tieneUvas = form.uvas.some(u => u.v.trim());

  const guardar = () => {
    const saved = JSON.parse(localStorage.getItem("wt_fichas") || "[]");
    saved.push({ ...form, id: Date.now(), fecha: new Date().toLocaleDateString("es-ES") });
    localStorage.setItem("wt_fichas", JSON.stringify(saved));
    setCount(saved.length);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    setForm(newForm());
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: F.serif }}>

      {/* ── HERO HEADER ── */}
      <header style={{
        background: "#FFFFFF",
        padding: "36px 20px 28px",
        textAlign: "center",
        position: "relative",
        borderBottom: `2px solid ${C.border}`,
        boxShadow: "0 2px 16px rgba(114,40,56,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "inline-block", marginBottom: 10 }}>
          <img src={LOGO} alt="Winetastic App" style={{ height: 140 }} />
        </div>

        {/* Tagline */}
        <p style={{ margin: 0, color: C.muted, fontFamily: F.serif, fontStyle: "italic",
          fontSize: 14, letterSpacing: 1 }}>
          ✦ Tu cuaderno de catas digital ✦
        </p>

        {/* Ficha counter badge */}
        <div style={{ position: "absolute", top: 20, right: 24,
          background: C.bg, borderRadius: 20,
          padding: "6px 14px", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: F.serif, fontStyle: "italic" }}>
            {count} {count === 1 ? "ficha" : "fichas"} guardadas
          </span>
        </div>
      </header>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 999, background: C.card,
          border: `1px solid ${C.gold}`, borderLeft: `4px solid ${C.burgundy}`,
          color: C.text, padding: "14px 22px", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(114,40,56,0.18)", fontFamily: F.serif, fontSize: 15 }}>
          ✦ ¡Ficha guardada! 🍷
        </div>
      )}

      {/* MODAL PISTA */}
      {showPista && (
        <PistaModal
          uvas={form.uvas}
          nombre={form.nombre}
          anada={form.anada}
          bodega={form.bodega}
          onClose={() => setShowPista(false)}
        />
      )}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px 4px" }}>
        <h1 style={{ fontFamily: F.script, fontSize: 34, fontWeight: 700, color: C.burgundy, margin: "0 0 4px" }}>
          Nueva Ficha de Cata
        </h1>
        <p style={{ color: C.muted, fontSize: 14, fontStyle: "italic", margin: "0 0 28px" }}>
          Registra todos los detalles de tu degustación
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 60px" }}>

        {/* IDENTIFICACIÓN */}
        <Section title="Identificación del Vino" icon="🍾">
          <Field label="Nombre del Vino">
            <TInput value={form.nombre} onChange={v => set("nombre", v)} placeholder="Ej: Vega Sicilia Único" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Zona Geográfica">
              <TInput value={form.zona} onChange={v => set("zona", v)} placeholder="Ej: Ribera del Duero" />
            </Field>
            <Field label="D.O. / Clasificación">
              <TInput value={form.do_cl} onChange={v => set("do_cl", v)} placeholder="Ej: D.O.Ca. Rioja" />
            </Field>
            <Field label="Añada">
              <TInput value={form.anada} onChange={v => set("anada", v)} placeholder="2019" type="number" />
            </Field>
            <Field label="Bodega">
              <TInput value={form.bodega} onChange={v => set("bodega", v)} placeholder="Ej: Bodegas Muga" />
            </Field>
          </div>
          <Field label="Tipos de Uva (variedad + %)">
            {form.uvas.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 2 }}>
                  <input value={u.v} onChange={e => updUva(i, "v", e.target.value)}
                    placeholder={`Variedad ${i + 1}`}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e => e.target.style.borderColor = C.border}
                    style={iBase} />
                </div>
                <div style={{ flex: 1 }}>
                  <input value={u.p} onChange={e => updUva(i, "p", e.target.value)}
                    placeholder="%" type="number"
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e => e.target.style.borderColor = C.border}
                    style={iBase} />
                </div>
              </div>
            ))}
            {form.uvas.length < 5 && <AddBtn onClick={addUva} label="Añadir variedad" />}
          </Field>

          {/* ── BOTÓN DAME UNA PISTA ── */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
            <button
              onClick={() => setShowPista(true)}
              disabled={!tieneUvas}
              style={{
                background: tieneUvas
                  ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`
                  : C.border,
                color: tieneUvas ? "#2A1218" : C.muted,
                border: "none", borderRadius: 9,
                padding: "12px 24px", fontSize: 14,
                cursor: tieneUvas ? "pointer" : "not-allowed",
                fontFamily: F.script, fontWeight: 700, fontSize: 16,
                letterSpacing: 0.3,
                boxShadow: tieneUvas ? `0 4px 14px ${C.gold}50` : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseOver={e => tieneUvas && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              💡 Dame una Pista
              {!tieneUvas && (
                <span style={{ fontSize: 11, fontFamily: F.serif, fontWeight: "normal", fontStyle: "italic" }}>
                  (introduce al menos una uva)
                </span>
              )}
            </button>
          </div>
        </Section>

        {/* VISUAL */}
        <Section title="Análisis Visual" icon="👁">
          <Field label="Descripción del Color">
            <TInput value={form.color} onChange={v => set("color", v)} placeholder="Ej: Rojo cereza con ribete granate" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["int_color","Intensidad del Color"],["lagrima","Lágrima"],["opacidad","Opacidad"],["limpieza","Limpieza"],["punt_vis","Puntuación General Visual"]].map(([k, l]) => (
              <Field key={k} label={l}><ScalePicker value={form[k]} onChange={v => set(k, v)} /></Field>
            ))}
          </div>
        </Section>

        {/* OLFATIVA */}
        <Section title="Análisis Olfativo" icon="👃">
          <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 14px" }}>— Copa en reposo —</p>
          {form.arp.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("arp", i, v)} label="Aroma detectado" index={i} />)}
          {form.arp.length < 5 && <AddBtn onClick={() => addRow("arp")} label="Añadir aroma" />}
          <div style={{ height: 1, background: C.border, margin: "18px 0" }} />
          <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 14px" }}>— Tras agitar la copa —</p>
          {form.ara.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("ara", i, v)} label="Aroma detectado" index={i} />)}
          {form.ara.length < 5 && <AddBtn onClick={() => addRow("ara")} label="Añadir aroma" />}
          <div style={{ height: 1, background: C.border, margin: "18px 0" }} />
          <Field label="Puntuación General Olfativa"><ScalePicker value={form.punt_olf} onChange={v => set("punt_olf", v)} /></Field>
        </Section>

        {/* GUSTATIVA */}
        <Section title="Análisis Gustativo" icon="👅">
          {form.sab.map((s, i) => <AromaRow key={i} item={s} onChange={v => updRow("sab", i, v)} label="Sabor detectado" index={i} />)}
          {form.sab.length < 5 && <AddBtn onClick={() => addRow("sab")} label="Añadir sabor" />}
          <div style={{ height: 1, background: C.border, margin: "18px 0" }} />
          <Field label={`Escala Seco → Dulce · ${SECO_LABELS[form.seco_dulce]}`}>
            <input type="range" min={0} max={5} value={form.seco_dulce}
              onChange={e => set("seco_dulce", +e.target.value)}
              style={{ width: "100%", accentColor: C.burgundy, cursor: "pointer", height: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 5, fontFamily: F.serif }}>
              {SECO_LABELS.map(l => <span key={l}>{l}</span>)}
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Astringencia"><ScalePicker value={form.astringencia} onChange={v => set("astringencia", v)} /></Field>
            <Field label="Retrogusto (intensidad)"><ScalePicker value={form.retro_p} onChange={v => set("retro_p", v)} /></Field>
          </div>
          <Field label="Retrogusto (descripción)">
            <TInput value={form.retro_t} onChange={v => set("retro_t", v)} placeholder="Describe el retrogusto..." />
          </Field>
          <Field label="Puntuación General Gustativa"><ScalePicker value={form.punt_gus} onChange={v => set("punt_gus", v)} /></Field>
        </Section>

        {/* FINAL */}
        <Section title="Puntuación Final" icon="🏅">
          <Field label="Puntuación General (1 – 10)">
            <ScalePicker value={form.puntuacion} onChange={v => set("puntuacion", v)} max={10} />
          </Field>
          <Field label="Notas libres">
            <textarea value={form.notas} onChange={e => set("notas", e.target.value)}
              placeholder="Observaciones adicionales, maridajes, ocasión de cata..."
              onFocus={e => e.target.style.borderColor = C.gold}
              onBlur={e => e.target.style.borderColor = C.border}
              style={{ ...iBase, minHeight: 100, resize: "vertical", lineHeight: 1.7 }} />
          </Field>
        </Section>

        {/* BOTONES */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
          <button onClick={guardar}
            style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
              color: "#FDF7F0", border: "none", borderRadius: 9, padding: "14px 36px",
              fontSize: 15, cursor: "pointer", fontFamily: F.script, fontWeight: 700,
              boxShadow: `0 4px 16px ${C.burgundy}40`, transition: "transform 0.15s" }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseOut={e => e.currentTarget.style.transform = "none"}>
            🍷 Guardar Ficha
          </button>
          <button onClick={() => setForm(newForm())}
            style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
              borderRadius: 9, padding: "14px 28px", fontSize: 14, cursor: "pointer", fontFamily: F.serif }}>
            Limpiar
          </button>
        </div>

        <p style={{ textAlign: "center", color: C.muted, marginTop: 48, fontFamily: F.script, fontSize: 16 }}>
          ✦ Winetastic App · Tu cuaderno de catas digital ✦
        </p>
      </div>
    </div>
  );
}
