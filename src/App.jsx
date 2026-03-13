import { useState, useEffect, useCallback } from "react";
import { ClerkProvider, SignedIn, SignedOut, useUser, useClerk } from "@clerk/clerk-react";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LOGO = "data:image/png;base64,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pjdWufHwZ+yGtGXD0acD6K02B6IjitlYZ90IcPf8kIVfh402NASWOjqXi8ukbN+U5WZLntBHDwg8oyCeQOehJOAtCsm0O9VkgqLFaL1T0Ntqn5mdDcCyMkgAuwG8YyAM4HMADmrWYHomB6I4omHkLoppvf8AJEG12xmnNK0Ust78u93KqhfDJJIzEUbHghzWN9wSC48/TGSFGWsvDjqSguj6nSFwpqyk4+OFk0pinjOcgZxg45c8jp0VrMD0ROKIhn3wk5b9lT2bM7xakEdHqO/OZRsOQK66SVAaPVrAXDP8l2bHqzb/AGXq7lbLbbLre9UQvdTVNZURtgjJaebWZJc1mQD0PFy5kAYtOQD2WOFvoEUEvRo8+U+prr6XR+fu4es71rjUD7xe5WceOCGGMFscLM5DWg/zJPM/RbVs5vBeNv2Otz6YXOyyPLzTOfwvicepjdzwD3aRjPpklXY4G/shYLGHq0KFDvezaXkoSh+G6+jQtr91NP7hVFVTWeluVPPSxiSUVMIDQCcYDmlwznscH+RxvxQNaOgAWcK66PLm4t/lWkB0REQqEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAf/2Q==";

const C = {
  bg: "#F7F4F0", card: "#FFFFFF", border: "#E2DAD5",
  burgundy: "#8B1A2E", burDark: "#4A0D1A",
  gold: "#C4A882", goldDark: "#A8894E",
  text: "#1A1014", muted: "#7A6E72",
  cream: "#F0EAE2", tag: "#EDE8E3",
};

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
document.head.appendChild(fontLink);

const F = { script: "'Cormorant Garamond', Georgia, serif", serif: "'DM Sans', system-ui, sans-serif" };

// ─── STORAGE KEY (solo para migración) ─────────────────────────────────────
const LS_KEY = "wt_fichas_v2";

// ─── API FICHAS ─────────────────────────────────────────────────────────────
const apiFichas = async (accion, userId, extra = {}) => {
  const r = await fetch("/api/fichas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, userId, ...extra }),
  });
  return r.json();
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const ScalePicker = ({ value, onChange, max = 5 }) => (
  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
    {[...Array(max)].map((_, i) => (
      <button key={i} onClick={() => onChange(value === i + 1 ? 0 : i + 1)}
        style={{ width: 26, height: 26, borderRadius: "50%", padding: 0, cursor: "pointer",
          border: `2px solid ${i < value ? C.gold : C.border}`,
          background: i < value ? `radial-gradient(circle at 40% 35%, #E8C98A, ${C.gold})` : "transparent",
          boxShadow: i < value ? `0 1px 4px ${C.gold}60` : "none",
          transition: "all 0.18s ease", flexShrink: 0 }} />
    ))}
    {value > 0 && <span style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>{value}/{max}</span>}
  </div>
);

const Section = ({ title, icon, children }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
    marginBottom: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(114,40,56,0.06)" }}>
    <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
      padding: "13px 20px", display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
      <h2 style={{ margin: 0, color: "#FDF7F0", fontSize: 14, fontFamily: F.script, fontWeight: 700 }}>{title}</h2>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 10, color: C.muted, letterSpacing: 2,
      textTransform: "uppercase", fontFamily: F.serif, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const iBase = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
  padding: "10px 13px", color: C.text, fontSize: 15, outline: "none",
  boxSizing: "border-box", fontFamily: F.serif, transition: "border-color 0.2s",
  WebkitAppearance: "none" };

const TInput = ({ value, onChange, placeholder, type = "text" }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    onFocus={e => e.target.style.borderColor = C.gold}
    onBlur={e => e.target.style.borderColor = C.border}
    style={iBase} />
);

const AromaRow = ({ item, onChange, label, index }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
    <span style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, minWidth: 18 }}>{index + 1}.</span>
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
      borderRadius: 6, cursor: "pointer", padding: "6px 14px", marginBottom: 4,
      fontFamily: F.serif, display: "inline-flex", alignItems: "center", gap: 5 }}
    onMouseOver={e => e.currentTarget.style.background = `${C.gold}12`}
    onMouseOut={e => e.currentTarget.style.background = "none"}>
    + {label}
  </button>
);

const SECO_LABELS = ["Seco", "Semi-seco", "Abocado", "Semi-dulce", "Dulce", "Muy dulce"];

const newForm = () => ({
  nombre: "", precio: "", zona: "", do_cl: "", anada: "", bodega: "",
  uvas: [{ v: "", p: "" }],
  color: "", int_color: 0, lagrima: 0, opacidad: 0, limpieza: 0, punt_vis: 0,
  arp: [{ text: "", int: 0 }], ara: [{ text: "", int: 0 }], punt_olf: 0,
  sab: [{ text: "", int: 0 }],
  seco_dulce: 0, astringencia: 0, retro_p: 0, retro_t: "", punt_gus: 0,
  puntuacion: "", notas: ""
});

// ─── MODAL PISTA ───────────────────────────────────────────────────────────
const PistaModal = ({ uvas, nombre, anada, bodega, onClose }) => {
  const [perfilText, setPerfilText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  const uvaList = uvas.filter(u => u.v.trim()).map(u => u.p ? `${u.v} (${u.p}%)` : u.v).join(", ");
  const canSearch = nombre.trim() && anada;

  useEffect(() => { fetchPerfil(); }, []);

  const fetchPerfil = async () => {
    setLoadingPerfil(true); setPerfilText("");
    try {
      const res = await fetch("/api/pista", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "perfil", uvas: uvaList })
      });
      const data = await res.json();
      setPerfilText(data.text || data.error || "No se pudo obtener información.");
    } catch { setPerfilText("Error al conectar. Comprueba tu conexión."); }
    setLoadingPerfil(false);
  };

  const fetchSearch = async () => {
    setLoadingSearch(true); setSearchText("");
    try {
      const res = await fetch("/api/pista", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "busqueda", nombre, anada, bodega })
      });
      const data = await res.json();
      setSearchText(data.text || data.error || "Sin resultados.");
    } catch { setSearchText("Error al buscar. Comprueba tu conexión."); }
    setLoadingSearch(false);
  };

  const handleCopy = () => {
    const all = [perfilText && `PERFIL VARIETAL:\n${perfilText}`, searchText && `FICHA ONLINE:\n${searchText}`].filter(Boolean).join("\n\n---\n\n");
    navigator.clipboard.writeText(all);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const Spinner = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontStyle: "italic", fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.burgundy,
        borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Consultando al sommelier...
    </div>
  );

  const ResultBox = ({ text }) => (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "14px 16px", fontSize: 14, lineHeight: 1.8, fontFamily: F.serif,
      color: C.text, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto" }}>{text}</div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,18,24,0.6)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, borderRadius: 16, width: "100%", maxWidth: 580,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(42,18,24,0.3)" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
          padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: "16px 16px 0 0" }}>
          <div>
            <h2 style={{ margin: 0, color: "#FDF7F0", fontFamily: F.script, fontSize: 22, fontWeight: 700 }}>✦ Dame una Pista</h2>
            <p style={{ margin: "2px 0 0", color: C.gold, fontSize: 12, fontFamily: F.serif, fontStyle: "italic" }}>{uvaList}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none",
            color: "#FDF7F0", borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "22px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 12, color: C.burgundy, fontFamily: F.serif, textTransform: "uppercase", letterSpacing: 2 }}>🍇 Perfil Varietal</h3>
              <button onClick={fetchPerfil} disabled={loadingPerfil}
                style={{ fontSize: 11, color: C.muted, background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontFamily: F.serif }}>↺ Regenerar</button>
            </div>
            {loadingPerfil ? <Spinner /> : perfilText ? <ResultBox text={perfilText} /> : null}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 12, color: C.burgundy, fontFamily: F.serif, textTransform: "uppercase", letterSpacing: 2 }}>🔍 Ficha Online</h3>
              {!canSearch && <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic", fontFamily: F.serif }}>Requiere nombre y añada</span>}
            </div>
            {canSearch ? (
              <>
                {!searchText && !loadingSearch && (
                  <button onClick={fetchSearch} style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                    color: "#FDF7F0", border: "none", borderRadius: 8, padding: "11px 22px",
                    fontSize: 14, cursor: "pointer", fontFamily: F.script, fontWeight: 700, width: "100%" }}>
                    🔍 Buscar ficha de "{nombre}" {anada}
                  </button>
                )}
                {loadingSearch && <Spinner />}
                {searchText && <ResultBox text={searchText} />}
                {searchText && <p style={{ fontSize: 10, color: C.muted, fontStyle: "italic", marginTop: 8, fontFamily: F.serif }}>ℹ️ Información de fuentes públicas. Úsala como orientación.</p>}
              </>
            ) : (
              <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 8,
                padding: "16px", textAlign: "center", color: C.muted, fontSize: 13, fontStyle: "italic", fontFamily: F.serif }}>
                Introduce el nombre y la añada para buscar la ficha online.
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
            {(perfilText || searchText) && (
              <button onClick={handleCopy} style={{ fontSize: 13, color: C.burgundy, background: "none",
                border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontFamily: F.serif }}>
                {copied ? "✓ Copiado" : "📋 Copiar"}
              </button>
            )}
            <button onClick={onClose} style={{ fontSize: 13, color: "#FDF7F0", background: C.burgundy,
              border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontFamily: F.serif }}>Cerrar</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── VISTA MIS FICHAS ──────────────────────────────────────────────────────
const MisFichasView = ({ fichas, setFichas, onEdit, userId }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("fecha");
  const [detalle, setDetalle] = useState(null);

  const filtered = fichas
    .filter(f => f.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (f.bodega || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.zona || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "fecha") return b.id - a.id;
      if (sort === "puntuacion") return b.puntuacion - a.puntuacion;
      if (sort === "anada") return b.anada - a.anada;
      return 0;
    });

  const borrar = (id) => {
    if (!window.confirm("¿Eliminar esta ficha?")) return;
    // Borrar en la nube (userId viene por prop)
    setFichas(prev => prev.filter(f => f.id !== id));
    apiFichas("borrar", userId, { fichaId: id }).catch(console.error);
    if (detalle?.id === id) setDetalle(null);
  };

  const ScoreBadge = ({ val, max = 5 }) => (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 38, height: 38, borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
      color: "#FDF7F0", fontSize: 14, fontFamily: F.script, fontWeight: 700,
      boxShadow: `0 2px 8px ${C.burgundy}40` }}>
      {val || "—"}
    </div>
  );

  if (detalle) return (
    <div>
      <button onClick={() => setDetalle(null)}
        style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "8px 16px", cursor: "pointer", color: C.muted, fontFamily: F.serif,
          fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
        ← Volver
      </button>
      <Section title={detalle.nombre || "Sin nombre"} icon="🍷">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[["Zona", detalle.zona], ["D.O.", detalle.do_cl], ["Añada", detalle.anada], ["Bodega", detalle.bodega],
            ["Precio aprox.", detalle.precio ? `${detalle.precio} €` : "—"], ["Fecha cata", detalle.fecha]
          ].map(([l, v]) => v ? (
            <div key={l}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontFamily: F.serif, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 14, fontFamily: F.serif, color: C.text }}>{v}</div>
            </div>
          ) : null)}
        </div>
        {detalle.uvas?.filter(u => u.v).length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontFamily: F.serif, marginBottom: 6 }}>Uvas</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {detalle.uvas.filter(u => u.v).map((u, i) => (
                <span key={i} style={{ background: `${C.burgundy}15`, color: C.burgundy, borderRadius: 20,
                  padding: "4px 12px", fontSize: 13, fontFamily: F.serif }}>
                  {u.v}{u.p ? ` ${u.p}%` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>
      <Section title="Visual" icon="👁">
        <div style={{ fontSize: 14, fontFamily: F.serif, marginBottom: 10 }}><b>Color:</b> {detalle.color || "—"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["Intensidad", detalle.int_color], ["Lágrima", detalle.lagrima], ["Opacidad", detalle.opacidad], ["Limpieza", detalle.limpieza], ["Puntuación", detalle.punt_vis]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: F.serif, marginBottom: 4 }}>{l}</div><ScalePicker value={v} onChange={() => {}} /></div>
          ))}
        </div>
      </Section>
      <Section title="Olfativo" icon="👃">
        {detalle.arp?.filter(a => a.text).length > 0 && (<><p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 8px", fontFamily: F.serif }}>Copa en reposo</p>{detalle.arp.filter(a => a.text).map((a, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 14, fontFamily: F.serif }}><span>{a.text}</span><ScalePicker value={a.int} onChange={() => {}} /></div>))}</>)}
        {detalle.ara?.filter(a => a.text).length > 0 && (<><p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "12px 0 8px", fontFamily: F.serif }}>Tras agitar</p>{detalle.ara.filter(a => a.text).map((a, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 14, fontFamily: F.serif }}><span>{a.text}</span><ScalePicker value={a.int} onChange={() => {}} /></div>))}</>)}
        <div style={{ marginTop: 10 }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: F.serif, marginBottom: 4 }}>Puntuación olfativa</div><ScalePicker value={detalle.punt_olf} onChange={() => {}} /></div>
      </Section>
      <Section title="Gustativo" icon="👅">
        {detalle.sab?.filter(s => s.text).map((s, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 14, fontFamily: F.serif }}><span>{s.text}</span><ScalePicker value={s.int} onChange={() => {}} /></div>))}
        <div style={{ marginTop: 10, fontSize: 14, fontFamily: F.serif }}><b>Dulzor:</b> {SECO_LABELS[detalle.seco_dulce]}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          {[["Astringencia", detalle.astringencia], ["Retrogusto", detalle.retro_p], ["Punt. gustativa", detalle.punt_gus]].map(([l, v]) => (<div key={l}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: F.serif, marginBottom: 4 }}>{l}</div><ScalePicker value={v} onChange={() => {}} /></div>))}
        </div>
        {detalle.retro_t && <div style={{ marginTop: 10, fontSize: 14, fontFamily: F.serif }}><b>Nota retrogusto:</b> {detalle.retro_t}</div>}
      </Section>
      <Section title="Puntuación Final" icon="🏅">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#FDF7F0", fontFamily: F.script, fontWeight: 700,
            boxShadow: `0 4px 16px ${C.burgundy}40` }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{detalle.puntuacion !== "" && detalle.puntuacion !== undefined ? detalle.puntuacion : "—"}</span>
            <span style={{ fontSize: 11, opacity: 0.8, fontFamily: "'EB Garamond', serif" }}>/100</span>
          </div>
          {detalle.notas && <p style={{ flex: 1, fontSize: 14, fontFamily: F.serif, fontStyle: "italic", color: C.muted, margin: 0 }}>{detalle.notas}</p>}
        </div>
      </Section>
      <div style={{ display: "flex", gap: 10, marginTop: 8, marginBottom: 40 }}>
        <button onClick={() => { onEdit(detalle); setDetalle(null); }}
          style={{ flex: 1, background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            color: "#FDF7F0", border: "none", borderRadius: 9, padding: "13px",
            fontSize: 14, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>✏️ Editar</button>
        <button onClick={() => borrar(detalle.id)}
          style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: "13px 20px", fontSize: 14, cursor: "pointer", fontFamily: F.serif }}>🗑 Borrar</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, bodega o zona..."
          style={{ ...iBase, flex: 1, minWidth: 200 }} />
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ ...iBase, width: "auto", paddingRight: 20 }}>
          <option value="fecha">Más recientes</option>
          <option value="puntuacion">Mejor puntuación</option>
          <option value="anada">Añada</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <img src={LOGO} alt="Winetastic" style={{ height: 80, opacity: 0.4, marginBottom: 20 }} />
          <p style={{ color: C.muted, fontFamily: F.serif, fontStyle: "italic", fontSize: 16 }}>
            {search ? "No se encontraron fichas" : "Aún no tienes fichas guardadas"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(f => (
            <div key={f.id} onClick={() => setDetalle(f)}
              style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "16px 18px", cursor: "pointer", transition: "all 0.18s",
                boxShadow: "0 2px 8px rgba(114,40,56,0.05)",
                display: "flex", alignItems: "center", gap: 14 }}
              onMouseOver={e => e.currentTarget.style.boxShadow = `0 4px 16px rgba(114,40,56,0.12)`}
              onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(114,40,56,0.05)"}>
              <div style={{ width: 52, height: 52, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#FDF7F0", fontFamily: F.script, fontWeight: 700, flexShrink: 0,
                boxShadow: `0 2px 8px ${C.burgundy}40` }}>
                <span style={{ fontSize: f.puntuacion > 99 ? 15 : 18, lineHeight: 1 }}>{f.puntuacion !== "" && f.puntuacion !== undefined ? f.puntuacion : "—"}</span>
                {(f.puntuacion !== "" && f.puntuacion !== undefined) && <span style={{ fontSize: 8, opacity: 0.8, fontFamily: "'EB Garamond', serif" }}>/100</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.script, fontSize: 18, color: C.burgundy, fontWeight: 700,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {f.nombre || "Sin nombre"}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: F.serif, marginTop: 2 }}>
                  {[f.bodega, f.zona, f.anada].filter(Boolean).join(" · ")}
                  {f.precio ? ` · ${f.precio} €` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {f.uvas?.filter(u => u.v).map((u, i) => (
                    <span key={i} style={{ background: `${C.burgundy}12`, color: C.burgundy,
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontFamily: F.serif }}>
                      {u.v}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: F.serif, flexShrink: 0, textAlign: "right" }}>
                <div>{f.fecha}</div>
                <div style={{ marginTop: 4, fontSize: 10, fontFamily: F.serif, color: 
                  f.puntuacion >= 90 ? "#C9A060" : f.puntuacion >= 75 ? "#722838" : 
                  f.puntuacion >= 60 ? C.muted : f.puntuacion >= 40 ? "#999" : "#ccc" }}>
                  {f.puntuacion >= 90 ? "⭐ Excepcional" : f.puntuacion >= 75 ? "Muy bueno" : 
                   f.puntuacion >= 60 ? "Bueno" : f.puntuacion >= 40 ? "Correcto" : 
                   f.puntuacion > 0 ? "Deficiente" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};




// ─── CATAS GRUPALES ───────────────────────────────────────────────────────

const apiCata = async (body) => {
  const res = await fetch("/api/cata", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
};

// ── CREAR CATA GRUPAL ──────────────────────────────────────────────────────
const CrearCataView = ({ onVolver }) => {
  const [nombre, setNombre] = useState("");
  const [anada, setAnada] = useState("");
  const [bodega, setBodega] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [resultados, setResultados] = useState(null);

  const crear = async () => {
    if (!nombre.trim()) { setError("Introduce el nombre del vino."); return; }
    setLoading(true); setError("");
    const data = await apiCata({ accion: "crear", vino: { nombre, anada, bodega } });
    if (data.ok) setCodigo(data.codigo);
    else setError(data.error || "Error al crear.");
    setLoading(false);
  };

  const finalizar = async () => {
    if (!window.confirm("¿Finalizar la cata? Se mostrarán los resultados a todos.")) return;
    setLoading(true);
    await apiCata({ accion: "finalizar", codigo });
    const data = await apiCata({ accion: "resultados", codigo });
    if (data.ok) setResultados(data.resumen);
    setFinalizado(true);
    setLoading(false);
  };

  if (finalizado && resultados) return <ResultadosView vino={{ nombre, anada, bodega }} resumen={resultados} onVolver={onVolver} />;

  if (codigo) return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
      <img src={LOGO} style={{ height: 80, marginBottom: 20 }} />
      <div style={{ background: C.card, borderRadius: 14, border: `2px solid ${C.gold}`, padding: "28px 20px", marginBottom: 16 }}>
        <p style={{ color: C.muted, fontFamily: F.serif, fontSize: 13, margin: "0 0 6px" }}>Cata grupal creada para</p>
        <h2 style={{ fontFamily: F.script, fontSize: 24, color: C.burgundy, margin: "0 0 20px", fontWeight: 700 }}>{nombre}</h2>
        <p style={{ color: C.muted, fontFamily: F.serif, fontSize: 13, margin: "0 0 10px" }}>Comparte este código:</p>
        <div style={{ background: C.bg, border: `2px dashed ${C.gold}`, borderRadius: 10, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.script, fontSize: 44, fontWeight: 700, color: C.burgundy, letterSpacing: 8 }}>{codigo}</div>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
          style={{ width: "100%", background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            color: "#FDF7F0", border: "none", borderRadius: 9, padding: "12px",
            fontSize: 14, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>
          {copiado ? "✓ Copiado" : "📋 Copiar código"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={finalizar} disabled={loading}
          style={{ background: "none", color: C.burgundy, border: `2px solid ${C.burgundy}`,
            borderRadius: 9, padding: "13px", fontSize: 14, cursor: "pointer", fontFamily: F.serif, fontWeight: 700 }}>
          {loading ? "Cargando..." : "🏁 Finalizar y Ver Resultados"}
        </button>
        <button onClick={() => { if (window.confirm("¿Salir? La cata sigue activa con el código " + codigo)) onVolver(); }}
          style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: F.serif }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontFamily: F.script, fontSize: 30, fontWeight: 700, color: C.burgundy, margin: "0 0 4px" }}>🥂 Crear Cata Grupal</h1>
      <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic", margin: "0 0 24px", fontFamily: F.serif }}>Introduce el vino que vais a catar</p>
      <Section title="Identificación del Vino" icon="🍾">
        <Field label="Nombre del Vino *">
          <TInput value={nombre} onChange={setNombre} placeholder="Ej: Muga Reserva" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Añada"><TInput value={anada} onChange={setAnada} placeholder="2019" type="number" /></Field>
          <Field label="Bodega"><TInput value={bodega} onChange={setBodega} placeholder="Ej: Bodegas Muga" /></Field>
        </div>
      </Section>
      {error && <p style={{ color: "#c0392b", fontFamily: F.serif, fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={crear} disabled={loading}
          style={{ flex: 1, background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            color: "#FDF7F0", border: "none", borderRadius: 9, padding: "15px",
            fontSize: 16, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>
          {loading ? "Creando..." : "🥂 Crear y Obtener Código"}
        </button>
        <button onClick={onVolver}
          style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: "15px 18px", fontSize: 14, cursor: "pointer", fontFamily: F.serif }}>
          ← Volver
        </button>
      </div>
    </div>
  );
};

// ── UNIRSE A CATA GRUPAL ───────────────────────────────────────────────────
const UnirseCataView = ({ onVolver }) => {
  const [paso, setPaso] = useState("codigo");
  const [codigoInput, setCodigoInput] = useState("");
  const [nombre, setNombre] = useState("");
  const [vino, setVino] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState(null);

  const buscar = async () => {
    const cod = codigoInput.trim().toUpperCase();
    if (!cod) return;
    setLoading(true); setError("");
    const data = await apiCata({ accion: "unirse", codigo: cod });
    if (!data.ok) { setError(data.error || "Código no válido."); setLoading(false); return; }
    setVino(data.vino);
    if (data.estado === "finalizada") {
      await verResultados(cod);
    } else {
      setForm(newForm());
      setPaso("formulario");
    }
    setLoading(false);
  };

  const verResultados = async (cod) => {
    setLoading(true);
    const data = await apiCata({ accion: "resultados", codigo: cod || codigoInput.trim().toUpperCase() });
    if (data.ok) { setVino(data.vino); setResumen(data.resumen); setPaso("resultados"); }
    else setError(data.error || "Error al cargar resultados.");
    setLoading(false);
  };

  const enviar = async () => {
    setLoading(true); setError("");
    const data = await apiCata({ accion: "participar", codigo: codigoInput.trim().toUpperCase(), nombre: nombre || "Anónimo", ficha: form });
    if (data.ok) setPaso("enviado");
    else setError(data.error || "Error al enviar.");
    setLoading(false);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addRow = k => { if (form[k].length < 5) setF(k, [...form[k], { text: "", int: 0 }]); };
  const updRow = (k, i, val) => { const a = [...form[k]]; a[i] = val; setF(k, a); };

  // PASO CÓDIGO
  if (paso === "codigo") return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
      <img src={LOGO} style={{ height: 80, marginBottom: 20 }} />
      <h1 style={{ fontFamily: F.script, fontSize: 26, fontWeight: 700, color: C.burgundy, margin: "0 0 8px" }}>🔑 Unirse a Cata Grupal</h1>
      <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic", margin: "0 0 24px", fontFamily: F.serif }}>Introduce el código del anfitrión</p>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px 20px" }}>
        <Field label="Tu nombre (opcional)">
          <TInput value={nombre} onChange={setNombre} placeholder="Ej: María" />
        </Field>
        <Field label="Código de la Cata">
          <input value={codigoInput} onChange={e => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            style={{ ...iBase, fontSize: 26, fontFamily: F.script, fontWeight: 700,
              textAlign: "center", letterSpacing: 6 }} />
        </Field>
        {error && <p style={{ color: "#c0392b", fontFamily: F.serif, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <button onClick={buscar} disabled={loading || !codigoInput.trim()}
          style={{ width: "100%", background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            color: "#FDF7F0", border: "none", borderRadius: 9, padding: "14px",
            fontSize: 15, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>
          {loading ? "Buscando..." : "🔑 Entrar"}
        </button>
      </div>
      <button onClick={onVolver} style={{ marginTop: 16, background: "none", color: C.muted,
        border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 20px",
        fontSize: 13, cursor: "pointer", fontFamily: F.serif }}>← Volver</button>
    </div>
  );

  // PASO FORMULARIO
  if (paso === "formulario" && form) return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
        borderRadius: 12, padding: "14px 18px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: C.gold, fontSize: 10, fontFamily: F.serif, letterSpacing: 2, textTransform: "uppercase" }}>Cata Grupal · {codigoInput.toUpperCase()}</div>
          <div style={{ color: "#FDF7F0", fontFamily: F.script, fontSize: 20, fontWeight: 700 }}>{vino?.nombre}</div>
          {vino?.bodega && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: F.serif }}>{vino.bodega}{vino.anada ? ` · ${vino.anada}` : ""}</div>}
        </div>
        <button onClick={() => { if (window.confirm("¿Abandonar la cata? Perderás los datos.")) onVolver(); }}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FDF7F0",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: F.serif }}>
          ✕ Salir
        </button>
      </div>

      <Section title="Análisis Visual" icon="👁">
        <Field label="Color"><TInput value={form.color} onChange={v => setF("color", v)} placeholder="Ej: Rojo cereza" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["int_color","Intensidad"],["lagrima","Lágrima"],["opacidad","Opacidad"],["limpieza","Limpieza"],["punt_vis","Punt. Visual"]].map(([k,l]) => (
            <Field key={k} label={l}><ScalePicker value={form[k]} onChange={v => setF(k, v)} /></Field>
          ))}
        </div>
      </Section>

      <Section title="Análisis Olfativo" icon="👃">
        <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 10px", fontFamily: F.serif }}>— Copa en reposo —</p>
        {form.arp.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("arp", i, v)} label="Aroma" index={i} />)}
        {form.arp.length < 5 && <AddBtn onClick={() => addRow("arp")} label="Añadir aroma" />}
        <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
        <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 10px", fontFamily: F.serif }}>— Tras agitar —</p>
        {form.ara.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("ara", i, v)} label="Aroma" index={i} />)}
        {form.ara.length < 5 && <AddBtn onClick={() => addRow("ara")} label="Añadir aroma" />}
        <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
        <Field label="Punt. Olfativa"><ScalePicker value={form.punt_olf} onChange={v => setF("punt_olf", v)} /></Field>
      </Section>

      <Section title="Análisis Gustativo" icon="👅">
        {form.sab.map((s, i) => <AromaRow key={i} item={s} onChange={v => updRow("sab", i, v)} label="Sabor" index={i} />)}
        {form.sab.length < 5 && <AddBtn onClick={() => addRow("sab")} label="Añadir sabor" />}
        <div style={{ height: 1, background: C.border, margin: "14px 0" }} />
        <Field label="Punt. Gustativa"><ScalePicker value={form.punt_gus} onChange={v => setF("punt_gus", v)} /></Field>
      </Section>

      <Section title="Puntuación Final" icon="🏅">
        <Field label="Puntuación (0–100)">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input type="range" min={0} max={100} value={form.puntuacion || 0}
              onChange={e => setF("puntuacion", +e.target.value)}
              style={{ flex: 1, accentColor: C.burgundy, cursor: "pointer" }} />
            <div style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FDF7F0", fontFamily: F.script, fontSize: 16, fontWeight: 700 }}>
              {form.puntuacion || 0}
            </div>
          </div>
        </Field>
      </Section>

      {error && <p style={{ color: "#c0392b", fontFamily: F.serif, fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={enviar} disabled={loading}
        style={{ width: "100%", background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
          color: "#FDF7F0", border: "none", borderRadius: 9, padding: "15px",
          fontSize: 16, cursor: "pointer", fontFamily: F.script, fontWeight: 700, marginBottom: 40 }}>
        {loading ? "Enviando..." : "🍷 Enviar mi Cata"}
      </button>
    </div>
  );

  // PASO ENVIADO
  if (paso === "enviado") return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🍷</div>
      <h2 style={{ fontFamily: F.script, fontSize: 26, color: C.burgundy, fontWeight: 700, margin: "0 0 8px" }}>¡Ficha enviada!</h2>
      <p style={{ color: C.muted, fontFamily: F.serif, fontSize: 14, fontStyle: "italic", margin: "0 0 32px" }}>Tu cata ha sido registrada</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={() => verResultados()}
          style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            color: "#FDF7F0", border: "none", borderRadius: 9, padding: "14px",
            fontSize: 15, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>
          {loading ? "Cargando..." : "📊 Ver resultados globales"}
        </button>
        <button onClick={onVolver}
          style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: F.serif }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );

  // PASO RESULTADOS
  if (paso === "resultados") return (
    <ResultadosView vino={vino} resumen={resumen} onVolver={onVolver} codigo={codigoInput.toUpperCase()} />
  );

  return null;
};

// ── RESULTADOS ─────────────────────────────────────────────────────────────
const ResultadosView = ({ vino, resumen, onVolver, codigo }) => {
  const [resumenIA, setResumenIA] = useState(resumen?.resumen_ia || null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [guardado, setGuardado] = useState(!!resumen?.resumen_ia);

  const generarResumenIA = async () => {
    setLoadingIA(true);
    try {
      // 1. Pedir resumen a la IA
      const r = await fetch("/api/pista", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "resumen_cata", vino, resumen })
      });
      const data = await r.json();
      if (!data.text) throw new Error("Sin respuesta");
      setResumenIA(data.text);

      // 2. Guardarlo en Upstash junto con el archivo de catas
      if (codigo) {
        await fetch("/api/cata", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "guardar_resumen", codigo, resumen_ia: data.text, resumen, vino })
        });
        setGuardado(true);
      }
    } catch (e) {
      alert("Error al generar el resumen: " + e.message);
    }
    setLoadingIA(false);
  };

  if (!resumen || resumen.total === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🥂</div>
      <h2 style={{ fontFamily: F.script, fontSize: 22, color: C.burgundy, fontWeight: 700, margin: "0 0 8px" }}>
        {vino?.nombre}
      </h2>
      <p style={{ color: C.muted, fontFamily: F.serif, fontSize: 14, fontStyle: "italic" }}>
        Aún no hay fichas enviadas.
      </p>
      <button onClick={onVolver} style={{ marginTop: 24, background: "none", color: C.muted,
        border: `1px solid ${C.border}`, borderRadius: 9, padding: "12px 24px",
        fontSize: 14, cursor: "pointer", fontFamily: F.serif }}>Volver al inicio</button>
    </div>
  );

  const TagList = ({ items }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: `${C.burgundy}12`, border: `1px solid ${C.burgundy}25`,
          borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontFamily: F.serif, color: C.text, textTransform: "capitalize" }}>{item.texto}</span>
          <span style={{ fontSize: 11, fontFamily: F.serif, color: C.burgundy, fontWeight: 700 }}>{item.count}👤</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Cabecera */}
      <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
        borderRadius: 12, padding: "20px", marginBottom: 20, textAlign: "center" }}>
        {codigo && <div style={{ color: C.gold, fontSize: 11, fontFamily: F.serif, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Código · {codigo}</div>}
        <div style={{ color: "#FDF7F0", fontFamily: F.script, fontSize: 24, fontWeight: 700 }}>{vino?.nombre}</div>
        {vino?.bodega && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: F.serif, marginTop: 4 }}>{vino.bodega}{vino.anada ? ` · ${vino.anada}` : ""}</div>}
        <div style={{ color: C.gold, fontFamily: F.serif, fontSize: 13, marginTop: 8 }}>
          {resumen.total} {resumen.total === 1 ? "participante" : "participantes"}
        </div>
      </div>

      {/* Puntuación media */}
      {resumen.punt_media !== null && (
        <Section title="Puntuación Media" icon="🏅">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "#FDF7F0", boxShadow: `0 4px 20px ${C.burgundy}40` }}>
              <span style={{ fontFamily: F.script, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{resumen.punt_media}</span>
              <span style={{ fontSize: 10, opacity: 0.8, fontFamily: F.serif }}>/100</span>
            </div>
            <div style={{ flex: 1 }}>
              {resumen.participantes.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: i < resumen.participantes.length-1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontFamily: F.serif, fontSize: 13, color: C.text }}>{p.nombre}</span>
                  <span style={{ fontFamily: F.script, fontSize: 16, color: C.burgundy, fontWeight: 700 }}>{p.puntuacion}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Colores */}
      {resumen.colores?.length > 0 && (
        <Section title="Colores Percibidos" icon="🎨">
          <TagList items={resumen.colores} />
        </Section>
      )}

      {/* Aromas */}
      {(resumen.aromas?.length > 0 || resumen.aromas_agitada?.length > 0) && (
        <Section title="Aromas Detectados" icon="👃">
          {resumen.aromas?.length > 0 && <>
            <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 8px", fontFamily: F.serif }}>Copa en reposo</p>
            <TagList items={resumen.aromas} />
          </>}
          {resumen.aromas_agitada?.length > 0 && <>
            <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "16px 0 8px", fontFamily: F.serif }}>Tras agitar</p>
            <TagList items={resumen.aromas_agitada} />
          </>}
        </Section>
      )}

      {/* Sabores */}
      {resumen.sabores?.length > 0 && (
        <Section title="Sabores Detectados" icon="👅">
          <TagList items={resumen.sabores} />
        </Section>
      )}

      {/* Resumen IA */}
      <Section title="Nota de Cata Colectiva" icon="🤖">
        {resumenIA ? (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${C.burgundy}08, ${C.gold}10)`,
              border: `1px solid ${C.gold}40`, borderRadius: 10, padding: "16px 18px",
              fontFamily: F.serif, fontSize: 14, color: C.text, lineHeight: 1.7,
              fontStyle: "italic", whiteSpace: "pre-wrap" }}>
              {resumenIA}
            </div>
            {guardado && (
              <p style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, margin: "8px 0 0",
                textAlign: "right" }}>
                ✓ Guardado en el archivo de catas
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ color: C.muted, fontFamily: F.serif, fontSize: 13, fontStyle: "italic", margin: "0 0 14px" }}>
              Genera una descripción profesional del vino basada en las opiniones del grupo.
            </p>
            <button onClick={generarResumenIA} disabled={loadingIA}
              style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                color: "#FDF7F0", border: "none", borderRadius: 9, padding: "12px 24px",
                fontSize: 14, cursor: loadingIA ? "wait" : "pointer",
                fontFamily: F.script, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 10, margin: "0 auto",
                opacity: loadingIA ? 0.8 : 1 }}>
              {loadingIA ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite" }} />
                  Generando...
                </>
              ) : "✨ Generar Nota de Cata con IA"}
            </button>
          </div>
        )}
      </Section>

      <button onClick={onVolver}
        style={{ width: "100%", background: "none", color: C.muted,
          border: `1px solid ${C.border}`, borderRadius: 9, padding: "14px",
          fontSize: 14, cursor: "pointer", fontFamily: F.serif, marginBottom: 40 }}>
        ← Volver al inicio
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── VISTA RECOMIÉNDAME UN VINO ────────────────────────────────────────────
const RecomiendaView = () => {
  const [query, setQuery] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);

  const ejemplos = [
    "Vino blanco suave y afrutado de Rueda",
    "Tinto con cuerpo para carne a la brasa, menos de 20€",
    "Espumoso para celebración, estilo Champagne pero español",
    "Vino natural de uva ecológica",
    "Rosado de verano, fresco y ligero",
  ];

  const buscar = async (texto) => {
    const q = texto || query;
    if (!q.trim()) return;
    setLoading(true);
    setResultado("");
    try {
      const res = await fetch("/api/pista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "recomienda", query: q })
      });
      const data = await res.json();
      setResultado(data.text || data.error || "No se encontraron resultados.");
      setHistorial(h => [q, ...h.filter(x => x !== q)].slice(0, 5));
    } catch {
      setResultado("Error al conectar. Comprueba tu conexión.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontFamily: F.script, fontSize: 30, fontWeight: 700, color: C.burgundy, margin: "0 0 4px" }}>
        🍾 Recomiéndame un Vino
      </h1>
      <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic", margin: "0 0 24px", fontFamily: F.serif }}>
        Describe qué tipo de vino buscas y la IA encontrará la mejor opción
      </p>

      {/* Buscador */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(114,40,56,0.06)" }}>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ej: Quiero un vino blanco suave y afrutado de la zona de Rueda, para tomar con pescado, por menos de 15€..."
          style={{ ...iBase, minHeight: 90, resize: "none", lineHeight: 1.7, marginBottom: 12 }}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button onClick={() => buscar()} disabled={loading || !query.trim()}
          style={{ width: "100%", background: loading || !query.trim()
            ? C.border : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            color: loading || !query.trim() ? C.muted : "#2A1218",
            border: "none", borderRadius: 9, padding: "13px",
            fontSize: 16, cursor: loading || !query.trim() ? "not-allowed" : "pointer",
            fontFamily: F.script, fontWeight: 700,
            boxShadow: !loading && query.trim() ? `0 4px 14px ${C.gold}50` : "none" }}>
          {loading ? "Buscando el vino perfecto..." : "🔍 Buscar"}
        </button>
      </div>

      {/* Ejemplos */}
      {!resultado && !loading && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 2,
            fontFamily: F.serif, marginBottom: 12 }}>Ejemplos de búsqueda</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ejemplos.map((e, i) => (
              <button key={i} onClick={() => { setQuery(e); buscar(e); }}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "10px 14px", cursor: "pointer", textAlign: "left",
                  fontFamily: F.serif, fontSize: 13, color: C.text,
                  transition: "all 0.15s" }}
                onMouseOver={ev => ev.currentTarget.style.borderColor = C.gold}
                onMouseOut={ev => ev.currentTarget.style.borderColor = C.border}>
                🍷 {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted,
          fontStyle: "italic", fontSize: 14, fontFamily: F.serif, padding: "20px 0" }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`,
            borderTopColor: C.burgundy, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Consultando al sommelier...
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          overflow: "hidden", boxShadow: "0 2px 12px rgba(114,40,56,0.06)" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
            padding: "13px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>🍾</span>
            <h2 style={{ margin: 0, color: "#FDF7F0", fontSize: 14, fontFamily: F.script, fontWeight: 700 }}>
              Recomendación del Sommelier
            </h2>
          </div>
          <div style={{ padding: "20px", fontSize: 14, lineHeight: 1.85,
            fontFamily: F.serif, color: C.text, whiteSpace: "pre-wrap" }}>
            {resultado}
          </div>
          <div style={{ padding: "0 20px 16px", display: "flex", gap: 10 }}>
            <button onClick={() => { setResultado(""); setQuery(""); }}
              style={{ flex: 1, background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                color: "#FDF7F0", border: "none", borderRadius: 8, padding: "11px",
                fontSize: 14, cursor: "pointer", fontFamily: F.script, fontWeight: 700 }}>
              🔍 Nueva búsqueda
            </button>
            <button onClick={() => navigator.clipboard.writeText(resultado)}
              style={{ background: "none", color: C.muted, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "11px 16px", fontSize: 13, cursor: "pointer", fontFamily: F.serif }}>
              📋 Copiar
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── APP ───────────────────────────────────────────────────────────────────
export default function WinetasticApp() {
  const [view, setView] = useState("home");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
  const { user } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id;
  const displayName = user?.username || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "";
  const displayFull = user?.username
    ? `@${user.username}`
    : user?.firstName
      ? user.firstName
      : user?.primaryEmailAddress?.emailAddress || "";

  const [fichas, setFichas] = useState([]);
  const [loadingFichas, setLoadingFichas] = useState(true);
  const [migrada, setMigrada] = useState(false);
  const [form, setForm] = useState(newForm());
  const [toast, setToast] = useState("");
  const [showPista, setShowPista] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addRow = k => { if (form[k].length < 5) set(k, [...form[k], { text: "", int: 0 }]); };
  const updRow = (k, i, val) => { const a = [...form[k]]; a[i] = val; set(k, a); };
  // ── Cargar fichas desde la nube al iniciar ──────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const cargar = async () => {
      setLoadingFichas(true);
      try {
        // Migrar localStorage en primer login
        const local = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        if (local.length > 0 && !migrada) {
          await apiFichas("migrar", userId, { fichas: local });
          localStorage.removeItem(LS_KEY);
          setMigrada(true);
        }
        const data = await apiFichas("listar", userId);
        setFichas(data.fichas || []);
      } catch (e) {
        console.error("Error cargando fichas:", e);
      } finally {
        setLoadingFichas(false);
      }
    };
    cargar();
  }, [userId]);

    const addUva = () => { if (form.uvas.length < 5) set("uvas", [...form.uvas, { v: "", p: "" }]); };
  const updUva = (i, f2, val) => { const a = [...form.uvas]; a[i] = { ...a[i], [f2]: val }; set("uvas", a); };
  const tieneUvas = form.uvas.some(u => u.v.trim());

  const guardar = async () => {
    if (!form.nombre.trim()) { setToast("⚠️ Añade al menos el nombre del vino"); setTimeout(() => setToast(""), 3000); return; }
    const isEdit = !!form.id;
    try {
      if (isEdit) {
        await apiFichas("actualizar", userId, { fichaId: form.id, ficha: form });
        setFichas(prev => prev.map(f => f.id === form.id ? { ...form, fecha: f.fecha } : f));
      } else {
        const fichaConFecha = { ...form, fecha: new Date().toLocaleDateString("es-ES") };
        const data = await apiFichas("guardar", userId, { ficha: fichaConFecha });
        setFichas(prev => [...prev, data.ficha]);
      }
      setToast(isEdit ? "✦ ¡Ficha actualizada! 🍷" : "✦ ¡Ficha guardada! 🍷");
      setTimeout(() => setToast(""), 3000);
      setForm(newForm());
      setView("fichas");
    } catch (e) {
      setToast("⚠️ Error al guardar. Comprueba la conexión.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleEdit = (ficha) => { setForm(ficha); setView("nueva"); };

  if (loadingFichas) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <img src={LOGO} alt="Winetastic" style={{ height: 60, marginBottom: 20, opacity: 0.7 }} />
      <div style={{ color: C.muted, fontFamily: F.serif, fontSize: 13, letterSpacing: 2 }}>
        Cargando tu bodega...
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: F.serif }}>

      {/* HERO HEADER — solo en portada */}
      {view === "home" && (
        <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          {/* ── TOP NAV — solo logo en home ── */}
          <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", position: "sticky", top: 0, zIndex: 100 }}>
            <img src={LOGO} alt="Winetastic" style={{ height: 30 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>
                {displayFull}
              </span>
              <button onClick={() => signOut()}
                style={{ fontSize: 11, color: C.muted, fontFamily: F.serif,
                  background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                Salir
              </button>
            </div>
          </div>

          <div style={{ padding: "20px 16px", flex: 1 }}>

            {/* ── HERO CARD ── */}
            <div style={{
              background: `linear-gradient(135deg, ${C.burgundy} 0%, ${C.burDark} 100%)`,
              borderRadius: 16, padding: "28px 24px", marginBottom: 16,
              position: "relative", overflow: "hidden",
            }}>
              {/* Marca de agua logo */}
              <img src={LOGO} alt="" aria-hidden="true" style={{
                position: "absolute", right: -20, bottom: -20,
                width: 160, height: 160, objectFit: "contain",
                opacity: 0.08, pointerEvents: "none",
                filter: "brightness(0) invert(1)",
              }} />
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140,
                borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
              <div style={{ color: C.gold, fontSize: 10, fontFamily: F.serif,
                letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, position: "relative" }}>
                Tu diario de cata
              </div>
              <div style={{ color: "#fff", fontFamily: F.script, fontSize: 28,
                fontWeight: 600, lineHeight: 1.2, marginBottom: 8, position: "relative" }}>
                Vive tu momento<br/>Winetastic
              </div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13,
                fontFamily: F.serif, position: "relative" }}>
                {displayName ? `Hola, ${displayName} · ` : ""}{fichas.length} {fichas.length === 1 ? "cata guardada" : "catas guardadas"}
              </div>
            </div>

            {/* ── GRID 2×2 ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

              <button onClick={() => setView("nueva")}
                style={{ background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                  color: "#FDF7F0", border: "none", borderRadius: 14, padding: "20px 18px",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: `0 4px 16px ${C.burgundy}30`, transition: "transform 0.15s" }}
                onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}>
                <div style={{ fontSize: 20, marginBottom: 12, opacity: 0.9 }}>＋</div>
                <div style={{ fontFamily: F.script, fontSize: 17, fontWeight: 600, marginBottom: 3 }}>Nueva Cata</div>
                <div style={{ fontSize: 11, opacity: 0.65, fontFamily: F.serif }}>Registra un vino</div>
              </button>

              <button onClick={() => setView("fichas")}
                style={{ background: C.card, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.15s" }}
                onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}>
                <div style={{ fontSize: 20, marginBottom: 12, color: C.burgundy }}>⊞</div>
                <div style={{ fontFamily: F.script, fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 3 }}>Mis Fichas</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>Tu bodega personal</div>
              </button>

              <button onClick={() => setView("recomienda")}
                style={{ background: C.card, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.15s" }}
                onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}>
                <div style={{ fontSize: 20, marginBottom: 12, color: C.burgundy }}>✦</div>
                <div style={{ fontFamily: F.script, fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 3 }}>Recomiéndame</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>Sugiere un vino con IA</div>
              </button>

              <button onClick={() => setView("crear_cata")}
                style={{ background: C.card, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.15s" }}
                onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}>
                <div style={{ fontSize: 20, marginBottom: 12, color: C.burgundy }}>🥂</div>
                <div style={{ fontFamily: F.script, fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 3 }}>Crear Cata</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>Con código compartido</div>
              </button>

            </div>

            {/* Unirse — ancho completo */}
            <button onClick={() => setView("unirse_cata")}
              style={{ width: "100%", background: C.card, color: C.text,
                border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.15s",
                marginBottom: 20 }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}>
              <span style={{ fontSize: 22, color: C.muted }}>🔑</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: F.script, fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 2 }}>Unirse a una Cata</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>Tengo un código de acceso</div>
              </div>
            </button>
            {/* ── ÚLTIMAS CATAS ── */}
            {fichas.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
                    color: C.muted, fontFamily: F.serif }}>Últimas catas</span>
                  <span onClick={() => setView("fichas")} style={{ fontSize: 12,
                    color: C.burgundy, fontFamily: F.serif, cursor: "pointer" }}>
                    Ver todas →
                  </span>
                </div>
                {[...fichas].slice(-3).reverse().map((f, i) => (
                  <div key={i} style={{
                    background: C.card, borderRadius: 12, marginBottom: 8,
                    border: `1px solid ${C.border}`, overflow: "hidden", display: "flex",
                  }}>
                    <div style={{ width: 4, flexShrink: 0,
                      background: i === 0 ? C.burgundy : i === 1 ? C.gold : C.border }} />
                    <div style={{ flex: 1, padding: "13px 14px",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 14, fontFamily: F.script,
                          fontWeight: 600, color: C.text, marginBottom: 2 }}>{f.nombre}</div>
                        <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif }}>
                          {[f.bodega, f.anada, f.zona].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {f.puntuacion > 0 && (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 13,
                            fontFamily: F.script, fontWeight: 700 }}>{f.puntuacion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* NAV TABS — oculto en portada */}
      {!["home","crear_cata","unirse_cata"].includes(view) && (
        <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`,
          display: "flex", position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <button onClick={() => setView("home")}
            style={{ padding: "14px 16px", border: "none", cursor: "pointer",
              background: C.card, color: C.muted, fontSize: 18,
              borderBottom: "3px solid transparent" }}>
            ←
          </button>
          {[["nueva", "✏️ Nueva Cata"], ["fichas", "📋 Mis Fichas"], ["recomienda", "🍾 Recomiéndame"], ["crear_cata", "🥂 Grupal"], ["unirse_cata", "🔑 Unirse"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, padding: "14px 6px", border: "none", cursor: "pointer",
                fontFamily: F.serif, fontWeight: 700, fontSize: 12,
                background: view === v ? C.bg : C.card,
                color: view === v ? C.burgundy : C.muted,
                borderBottom: view === v ? `3px solid ${C.burgundy}` : "3px solid transparent",
                transition: "all 0.18s" }}>
              {l}
            </button>
          ))}
        </nav>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 16, left: 16, zIndex: 999,
          background: C.card, border: `1px solid ${C.gold}`, borderLeft: `4px solid ${C.burgundy}`,
          color: C.text, padding: "14px 20px", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(114,40,56,0.18)", fontFamily: F.serif, fontSize: 15, textAlign: "center" }}>
          {toast}
        </div>
      )}

      {/* MODAL PISTA */}
      {showPista && <PistaModal uvas={form.uvas} nombre={form.nombre} anada={form.anada} bodega={form.bodega} onClose={() => setShowPista(false)} />}

      {view !== "home" && <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* ── VISTA MIS FICHAS ── */}
        {view === "fichas" && <MisFichasView fichas={fichas} setFichas={setFichas} onEdit={handleEdit} userId={userId} />}

        {/* ── VISTA RECOMIÉNDAME ── */}
        {view === "recomienda" && <RecomiendaView />}

        {/* ── VISTA CREAR CATA GRUPAL ── */}
        {view === "crear_cata" && <CrearCataView onVolver={() => setView("home")} />}

        {/* ── VISTA UNIRSE A CATA GRUPAL ── */}
        {view === "unirse_cata" && <UnirseCataView onVolver={() => setView("home")} />}

        {/* ── VISTA NUEVA FICHA ── */}
        {view === "nueva" && (
          <>
            <h1 style={{ fontFamily: F.script, fontSize: 30, fontWeight: 700, color: C.burgundy, margin: "0 0 4px" }}>
              {form.id ? "✏️ Editando Ficha" : "Nueva Ficha de Cata"}
            </h1>
            <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic", margin: "0 0 24px" }}>
              Registra todos los detalles de tu degustación
            </p>

            {/* IDENTIFICACIÓN */}
            <Section title="Identificación del Vino" icon="🍾">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Nombre del Vino">
                  <TInput value={form.nombre} onChange={v => set("nombre", v)} placeholder="Ej: Vega Sicilia Único" />
                </Field>
                <Field label="Precio Aprox. (€)">
                  <TInput value={form.precio} onChange={v => set("precio", v)} placeholder="Ej: 25" type="number" />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              <div style={{ marginTop: 8, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
                <button onClick={() => setShowPista(true)} disabled={!tieneUvas}
                  style={{ background: tieneUvas ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` : C.border,
                    color: tieneUvas ? "#2A1218" : C.muted, border: "none", borderRadius: 9,
                    padding: "12px 22px", fontSize: 15, cursor: tieneUvas ? "pointer" : "not-allowed",
                    fontFamily: F.script, fontWeight: 700,
                    boxShadow: tieneUvas ? `0 4px 14px ${C.gold}50` : "none",
                    display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}>
                  💡 Dame una Pista
                  {!tieneUvas && <span style={{ fontSize: 11, fontFamily: F.serif, fontWeight: "normal", fontStyle: "italic" }}>(introduce al menos una uva)</span>}
                </button>
              </div>
            </Section>

            {/* VISUAL */}
            <Section title="Análisis Visual" icon="👁">
              <Field label="Descripción del Color">
                <TInput value={form.color} onChange={v => set("color", v)} placeholder="Ej: Rojo cereza con ribete granate" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["int_color","Intensidad del Color"],["lagrima","Lágrima"],["opacidad","Opacidad"],["limpieza","Limpieza"],["punt_vis","Punt. General Visual"]].map(([k, l]) => (
                  <Field key={k} label={l}><ScalePicker value={form[k]} onChange={v => set(k, v)} /></Field>
                ))}
              </div>
            </Section>

            {/* OLFATIVA */}
            <Section title="Análisis Olfativo" icon="👃">
              <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 12px", fontFamily: F.serif }}>— Copa en reposo —</p>
              {form.arp.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("arp", i, v)} label="Aroma detectado" index={i} />)}
              {form.arp.length < 5 && <AddBtn onClick={() => addRow("arp")} label="Añadir aroma" />}
              <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
              <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", margin: "0 0 12px", fontFamily: F.serif }}>— Tras agitar la copa —</p>
              {form.ara.map((a, i) => <AromaRow key={i} item={a} onChange={v => updRow("ara", i, v)} label="Aroma detectado" index={i} />)}
              {form.ara.length < 5 && <AddBtn onClick={() => addRow("ara")} label="Añadir aroma" />}
              <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
              <Field label="Puntuación General Olfativa"><ScalePicker value={form.punt_olf} onChange={v => set("punt_olf", v)} /></Field>
            </Section>

            {/* GUSTATIVA */}
            <Section title="Análisis Gustativo" icon="👅">
              {form.sab.map((s, i) => <AromaRow key={i} item={s} onChange={v => updRow("sab", i, v)} label="Sabor detectado" index={i} />)}
              {form.sab.length < 5 && <AddBtn onClick={() => addRow("sab")} label="Añadir sabor" />}
              <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
              <Field label={`Escala Seco → Dulce · ${SECO_LABELS[form.seco_dulce]}`}>
                <input type="range" min={0} max={5} value={form.seco_dulce}
                  onChange={e => set("seco_dulce", +e.target.value)}
                  style={{ width: "100%", accentColor: C.burgundy, cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4, fontFamily: F.serif }}>
                  {SECO_LABELS.map(l => <span key={l} style={{ fontSize: 9 }}>{l}</span>)}
                </div>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Astringencia"><ScalePicker value={form.astringencia} onChange={v => set("astringencia", v)} /></Field>
                <Field label="Retrogusto (intensidad)"><ScalePicker value={form.retro_p} onChange={v => set("retro_p", v)} /></Field>
              </div>
              <Field label="Retrogusto (descripción)">
                <TInput value={form.retro_t} onChange={v => set("retro_t", v)} placeholder="Describe el retrogusto..." />
              </Field>
              <Field label="Punt. General Gustativa"><ScalePicker value={form.punt_gus} onChange={v => set("punt_gus", v)} /></Field>
            </Section>

            {/* FINAL */}
            <Section title="Puntuación Final" icon="🏅">
              {/* Media orientativa */}
              {(form.punt_vis > 0 || form.punt_olf > 0 || form.punt_gus > 0) && (() => {
                const vals = [form.punt_vis, form.punt_olf, form.punt_gus].filter(v => v > 0);
                const media = Math.round((vals.reduce((a,b) => a+b, 0) / vals.length) * 20);
                return (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      Media orientativa
                    </div>
                    <div style={{ fontFamily: F.script, fontSize: 22, color: C.burgundy, fontWeight: 700 }}>{media}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: F.serif, fontStyle: "italic" }}>
                      (visual + olfativa + gustativa)
                    </div>
                  </div>
                );
              })()}
              <Field label="Puntuación Final (0 – 100)">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input type="range" min={0} max={100} value={form.puntuacion || 0}
                    onChange={e => set("puntuacion", +e.target.value)}
                    style={{ flex: 1, accentColor: C.burgundy, cursor: "pointer", height: 6 }} />
                  <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FDF7F0", fontSize: 18, fontFamily: F.script, fontWeight: 700,
                    boxShadow: `0 3px 12px ${C.burgundy}40` }}>
                    {form.puntuacion || 0}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10,
                  color: C.muted, marginTop: 6, fontFamily: F.serif, fontStyle: "italic" }}>
                  <span>0 · Inaceptable</span>
                  <span>50 · Correcto</span>
                  <span>100 · Excepcional</span>
                </div>
              </Field>
              <Field label="Notas libres">
                <textarea value={form.notas} onChange={e => set("notas", e.target.value)}
                  placeholder="Observaciones adicionales, maridajes, ocasión de cata..."
                  onFocus={e => e.target.style.borderColor = C.gold}
                  onBlur={e => e.target.style.borderColor = C.border}
                  style={{ ...iBase, minHeight: 90, resize: "vertical", lineHeight: 1.7 }} />
              </Field>
            </Section>

            {/* BOTONES */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={guardar}
                style={{ flex: 1, background: `linear-gradient(135deg, ${C.burgundy}, ${C.burDark})`,
                  color: "#FDF7F0", border: "none", borderRadius: 9, padding: "15px",
                  fontSize: 16, cursor: "pointer", fontFamily: F.script, fontWeight: 700,
                  boxShadow: `0 4px 16px ${C.burgundy}40` }}>
                {form.id ? "💾 Actualizar Ficha" : "🍷 Guardar Ficha"}
              </button>
              <button onClick={() => setForm(newForm())}
                style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
                  borderRadius: 9, padding: "15px 20px", fontSize: 14, cursor: "pointer", fontFamily: F.serif }}>
                Limpiar
              </button>
            </div>

            <p style={{ textAlign: "center", color: C.muted, marginTop: 40, fontFamily: F.script, fontSize: 15 }}>
              ✦ Winetastic App · Tu cuaderno de catas digital ✦
            </p>
          </>
        )}
      </div>}
    </div>
  );
}
// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
const LoginScreen = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.burgundy} 0%, ${C.burDark} 100%)`,
        padding: "60px 28px 48px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <img src={LOGO} alt="" aria-hidden="true" style={{
          position: "absolute", right: -20, bottom: -20, width: 160, height: 160,
          objectFit: "contain", opacity: 0.08, filter: "brightness(0) invert(1)", pointerEvents: "none",
        }} />
        <img src={LOGO} alt="Winetastic"
          style={{ height: 70, display: "block", margin: "0 auto 20px" }} />
        <div style={{ color: C.gold, fontSize: 10, fontFamily: F.serif,
          letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>
          Tu diario de cata
        </div>
        <div style={{ color: "#fff", fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 26, fontWeight: 600, lineHeight: 1.3 }}>
          Vive tu momento<br/>Winetastic
        </div>
      </div>

      {/* Login card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <p style={{ textAlign: "center", color: C.muted, fontFamily: F.serif,
            fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
            Accede para guardar tus catas<br/>y tenerlas siempre disponibles
          </p>
          {/* Clerk monta aquí su widget de login */}
          <div id="clerk-sign-in" />
        </div>
      </div>
    </div>
  );
};

// ─── ROOT EXPORT ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignInUrl="/" afterSignUpUrl="/">
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <WinetasticApp />
      </SignedIn>
    </ClerkProvider>
  );
}
