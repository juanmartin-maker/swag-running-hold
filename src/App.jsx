import { useState, useEffect, useRef } from "react";

const ORGANIZER_PASSWORD = "swag2024";

const COLORS = {
  hold: { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" },
  presente: { bg: "#EAF3DE", text: "#3B6D11", border: "#639922" },
  noshow: { bg: "#FCEBEB", text: "#A32D2D", border: "#E24B4A" },
  expirado: { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
};

const STATUS_LABEL = {
  hold: "Hold activo",
  presente: "Presente",
  noshow: "No-show",
  expirado: "Expirado",
};

const DEFAULT_CONFIG = {
  nombre: "Swag Running Event",
  descripcion: "",
  flyer: null,
  monto: 5000,
};

function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-AR")}`;
}

function getConfig() {
  try {
    const c = JSON.parse(localStorage.getItem("eventoConfig") || "{}");
    return { ...DEFAULT_CONFIG, ...c };
  } catch { return DEFAULT_CONFIG; }
}

function saveConfig(c) {
  localStorage.setItem("eventoConfig", JSON.stringify(c));
}

function getRegistros() {
  try { return JSON.parse(localStorage.getItem("registros") || "[]"); } catch { return []; }
}

function saveRegistros(r) {
  localStorage.setItem("registros", JSON.stringify(r));
}

function Badge({ status }) {
  const c = COLORS[status] || COLORS.expirado;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, fontSize: 12, padding: "2px 10px", fontWeight: 500 }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function QRCode({ value, size = 140 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    const cells = 21;
    const cell = Math.floor(size / cells);
    const hash = [...value].reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let r = 0; r < cells; r++) {
      for (let c2 = 0; c2 < cells; c2++) {
        const tl = r < 7 && c2 < 7;
        const tr = r < 7 && c2 >= cells - 7;
        const bl = r >= cells - 7 && c2 < 7;
        if (tl || tr || bl) {
          const outer = (tl && (r === 0 || r === 6 || c2 === 0 || c2 === 6)) ||
            (tr && (r === 0 || r === 6 || c2 === cells - 7 || c2 === cells - 1)) ||
            (bl && (r === cells - 7 || r === cells - 1 || c2 === 0 || c2 === 6));
          const inner = (tl && r >= 2 && r <= 4 && c2 >= 2 && c2 <= 4) ||
            (tr && r >= 2 && r <= 4 && c2 >= cells - 5 && c2 <= cells - 3) ||
            (bl && r >= cells - 5 && r <= cells - 3 && c2 >= 2 && c2 <= 4);
          if (outer || inner) ctx.fillRect(c2 * cell, r * cell, cell, cell);
        } else {
          if ((hash * (r * cells + c2 + 1) * 7 + r * 13 + c2 * 17) % 3 === 0)
            ctx.fillRect(c2 * cell, r * cell, cell, cell);
        }
      }
    }
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 4, display: "block" }} />;
}

const s = {
  container: { maxWidth: 480, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif", color: "#1a1a1a" },
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "24px" },
  h1: { fontSize: 22, fontWeight: 600, margin: "0 0 4px" },
  h2: { fontSize: 18, fontWeight: 600, margin: "0 0 20px" },
  label: { fontSize: 13, color: "#666", display: "block", marginBottom: 4 },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, outline: "none" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", minHeight: 160, resize: "vertical", lineHeight: 1.6 },
  btn: { width: "100%", padding: "13px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer" },
  btnOutline: { width: "100%", padding: "13px", background: "transparent", color: "#1a1a1a", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, cursor: "pointer" },
  btnSm: { padding: "8px 14px", background: "transparent", color: "#1a1a1a", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer" },
  error: { color: "#A32D2D", fontSize: 13, background: "#FCEBEB", padding: "10px 14px", borderRadius: 8 },
  warning: { color: "#854F0B", fontSize: 13, background: "#FAEEDA", padding: "10px 14px", borderRadius: 8, border: "1px solid #EF9F27" },
  metric: { background: "#f5f5f5", borderRadius: 8, padding: "14px", textAlign: "center" },
};

function EventoHeader({ config }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {config.flyer && (
        <img src={config.flyer} alt="Flyer del evento" style={{ width: "100%", borderRadius: 10, marginBottom: 16, maxHeight: 320, objectFit: "cover" }} />
      )}
      <h1 style={s.h1}>{config.nombre}</h1>
      {config.descripcion && (
        <p style={{ fontSize: 14, color: "#444", marginTop: 10, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {config.descripcion}
        </p>
      )}
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const isOrganizer = path.startsWith("/organizador");
  return isOrganizer ? <OrganizerApp /> : <PublicApp />;
}

function PublicApp() {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ nombre: "", email: "", dni: "" });
  const [error, setError] = useState("");
  const [reg, setReg] = useState(null);
  const config = getConfig();

  function handleSubmit() {
    if (!form.nombre.trim() || !form.email.trim() || !form.dni.trim()) {
      setError("Por favor completá todos los campos.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("El email no parece válido.");
      return;
    }
    setError("");
    const id = generateId();
    const newReg = {
      id, qr: `SWAG-${id}`,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      dni: form.dni.trim(),
      monto: config.monto,
      status: "hold",
      fecha: new Date().toISOString(),
      payment_id: `PAY-SIM-${id}`,
    };
    saveRegistros([newReg, ...getRegistros()]);
    setReg(newReg);
    setStep("confirmacion");
  }

  if (step === "confirmacion" && reg) return (
    <div style={s.container}>
      <EventoHeader config={config} />
      <div style={{ ...s.card, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#EAF3DE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
        <h2 style={{ ...s.h2, color: "#3B6D11" }}>¡Registro exitoso!</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
          Se realizó un hold de <strong>{formatMoney(reg.monto)}</strong> en tu tarjeta.<br />
          Si te presentás al evento, no se cobra nada.
        </p>
        <div style={{ background: "#f5f5f5", borderRadius: 10, padding: 20, display: "inline-block", marginBottom: 16 }}>
          <QRCode value={reg.qr} size={160} />
          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 10, marginBottom: 0, letterSpacing: 1 }}>{reg.qr}</p>
        </div>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
          Guardá este QR — lo vas a necesitar el día del evento para el check-in.
        </p>
        <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "12px 14px", textAlign: "left" }}>
          <p style={{ fontSize: 13, color: "#854F0B", margin: 0 }}>
            <strong>Nombre:</strong> {reg.nombre}<br />
            <strong>DNI:</strong> {reg.dni}<br />
            <strong>Email:</strong> {reg.email}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      <EventoHeader config={config} />
      <div style={s.card}>
        <h2 style={s.h2}>Registrate</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={s.label}>Nombre completo</label>
            <input style={s.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan García" />
          </div>
          <div>
            <label style={s.label}>Email</label>
            <input style={s.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Ej: juan@email.com" type="email" />
          </div>
          <div>
            <label style={s.label}>DNI</label>
            <input style={s.input} value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} placeholder="Ej: 30123456" />
          </div>
          {error && <p style={s.error}>{error}</p>}
          <div style={s.warning}>
            Se hará un hold de <strong>{formatMoney(config.monto)}</strong> en tu tarjeta. Solo se cobra si no te presentás al evento.
          </div>
          <button style={s.btn} onClick={handleSubmit}>
            Reservar lugar — hold de {formatMoney(config.monto)}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrganizerApp() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [view, setView] = useState("dashboard");
  const [registros, setRegistros] = useState(getRegistros());
  const [config, setConfigState] = useState(getConfig());
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanned, setScanned] = useState(null);
  const [scanError, setScanError] = useState("");
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  function refresh() { setRegistros(getRegistros()); }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function updateConfig(updates) {
    const updated = { ...config, ...updates };
    setConfigState(updated);
    saveConfig(updated);
  }

  function handleFlyer(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateConfig({ flyer: ev.target.result });
    reader.readAsDataURL(file);
  }

  function handleLogin() {
    if (pass === ORGANIZER_PASSWORD) { setAuthed(true); setPassError(""); }
    else setPassError("Contraseña incorrecta.");
  }

  function handleScan() {
    const code = scanCode.trim().toUpperCase();
    const all = getRegistros();
    const found = all.find(r => r.qr === code || r.id === code.replace("SWAG-", ""));
    if (!found) { setScanError("No se encontró ningún corredor con ese código."); setScanned(null); return; }
    setScanError("");
    setScanned(found);
  }

  function confirmar(reg) {
    const all = getRegistros().map(r => r.id === reg.id ? { ...r, status: "presente" } : r);
    saveRegistros(all); setScanned(null); setScanCode(""); refresh();
    showToast(`✓ Presencia confirmada — ${reg.nombre}. Hold liberado.`);
    setView("checkin");
  }

  function cobrar(reg) {
    const all = getRegistros().map(r => r.id === reg.id ? { ...r, status: "noshow" } : r);
    saveRegistros(all); setScanned(null); setScanCode(""); refresh();
    showToast(`✓ No-show — se cobró ${formatMoney(reg.monto)} a ${reg.nombre}.`);
    setView("checkin");
  }

  function marcarNoShow(reg) {
    const all = getRegistros().map(r => r.id === reg.id ? { ...r, status: "noshow" } : r);
    saveRegistros(all); refresh();
    showToast(`✓ No-show — se cobró ${formatMoney(reg.monto)} a ${reg.nombre}.`);
  }

  const stats = {
    total: registros.length,
    hold: registros.filter(r => r.status === "hold").length,
    presentes: registros.filter(r => r.status === "presente").length,
    noshow: registros.filter(r => r.status === "noshow").length,
    cobrado: registros.filter(r => r.status === "noshow").reduce((a, r) => a + r.monto, 0),
  };

  const filtered = registros.filter(r =>
    r.nombre.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.dni.includes(search)
  );

  if (!authed) return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={s.h2}>Panel del organizador</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Ingresá la contraseña" />
          </div>
          {passError && <p style={s.error}>{passError}</p>}
          <button style={s.btn} onClick={handleLogin}>Ingresar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...s.container, maxWidth: 600 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#3B6D11", color: "#EAF3DE", padding: "10px 20px", borderRadius: 20, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ ...s.h1, margin: 0 }}>Panel organizador</h1>
        <span style={{ fontSize: 13, color: "#666" }}>{config.nombre}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["dashboard", "checkin", "registros", "config"].map(v => (
          <button key={v} onClick={() => { setView(v); setScanned(null); setScanCode(""); setScanError(""); }}
            style={{ ...s.btnSm, background: view === v ? "#1a1a1a" : "transparent", color: view === v ? "#fff" : "#1a1a1a" }}>
            {{ dashboard: "Resumen", checkin: "Check-in", registros: "Registros", config: "Configuración" }[v]}
          </button>
        ))}
      </div>

      {view === "dashboard" && (
        <div>
          <EventoHeader config={config} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["Registrados", stats.total], ["Hold activo", stats.hold], ["Presentes", stats.presentes], ["No-shows", stats.noshow]].map(([l, v]) => (
              <div key={l} style={s.metric}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 28, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          {stats.cobrado > 0 && (
            <div style={{ ...s.error, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Total cobrado por no-shows</span>
              <strong>{formatMoney(stats.cobrado)}</strong>
            </div>
          )}
        </div>
      )}

      {view === "checkin" && !scanned && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#f5f5f5", borderRadius: 10, padding: 24, textAlign: "center", border: "2px dashed #ddd" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
            <p style={{ color: "#666", fontSize: 14, margin: 0 }}>En producción, acá se activa la cámara para escanear el QR.</p>
          </div>
          <p style={{ fontSize: 13, color: "#666", textAlign: "center", margin: 0 }}>O ingresá el código manualmente:</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...s.input, flex: 1 }} value={scanCode} onChange={e => setScanCode(e.target.value.toUpperCase())} placeholder="Ej: SWAG-ABC123XYZ" onKeyDown={e => e.key === "Enter" && handleScan()} />
            <button style={{ ...s.btn, width: "auto", padding: "10px 16px" }} onClick={handleScan}>Buscar</button>
          </div>
          {scanError && <p style={s.error}>{scanError}</p>}
        </div>
      )}

      {view === "checkin" && scanned && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={s.card}>
            <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>{scanned.nombre}</p>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 4px" }}>DNI: {scanned.dni}</p>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>Email: {scanned.email}</p>
            <Badge status={scanned.status} />
            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 12, marginBottom: 0 }}>Hold: {formatMoney(scanned.monto)}</p>
          </div>
          {scanned.status === "hold" ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => confirmar(scanned)} style={{ flex: 1, padding: 14, background: "#EAF3DE", color: "#3B6D11", border: "1px solid #639922", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 500 }}>
                ✓ Confirmar presencia<br /><span style={{ fontSize: 12, fontWeight: 400 }}>Libera el hold</span>
              </button>
              <button onClick={() => cobrar(scanned)} style={{ flex: 1, padding: 14, background: "#FCEBEB", color: "#A32D2D", border: "1px solid #E24B4A", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 500 }}>
                ✗ No se presentó<br /><span style={{ fontSize: 12, fontWeight: 400 }}>Cobra {formatMoney(scanned.monto)}</span>
              </button>
            </div>
          ) : (
            <div style={s.warning}>Este corredor ya fue procesado: <strong>{STATUS_LABEL[scanned.status]}</strong></div>
          )}
          <button style={s.btnOutline} onClick={() => { setScanned(null); setScanCode(""); setScanError(""); }}>← Escanear otro</button>
        </div>
      )}

      {view === "registros" && (
        <div>
          <input style={{ ...s.input, marginBottom: 12 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, DNI o email..." />
          {filtered.length === 0 && (
            <p style={{ color: "#666", textAlign: "center", padding: "2rem 0", fontSize: 14 }}>
              {registros.length === 0 ? "Todavía no hay registros." : "Sin resultados."}
            </p>
          )}
          {filtered.map(r => (
            <div key={r.id} style={{ ...s.card, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px" }}>
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{r.nombre}</p>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 2px" }}>DNI: {r.dni} · {r.email}</p>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>{formatMoney(r.monto)} · {new Date(r.fecha).toLocaleDateString("es-AR")}</p>
                <Badge status={r.status} />
              </div>
              {r.status === "hold" && (
                <button onClick={() => marcarNoShow(r)} style={{ fontSize: 11, padding: "4px 8px", color: "#A32D2D", border: "1px solid #E24B4A", borderRadius: 6, background: "transparent", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 8 }}>
                  No-show
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {view === "config" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={s.card}>
            <h2 style={s.h2}>Información del evento</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={s.label}>Nombre del evento</label>
                <input style={s.input} value={config.nombre} onChange={e => updateConfig({ nombre: e.target.value })} placeholder="Ej: Swag Run - Enero 2025" />
              </div>
              <div>
                <label style={s.label}>Descripción</label>
                <textarea style={s.textarea} value={config.descripcion} onChange={e => updateConfig({ descripcion: e.target.value })} placeholder="Descripción del evento, qué incluye, dónde es, etc." />
              </div>
              <div>
                <label style={s.label}>Flyer del evento</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFlyer} />
                <button style={s.btnOutline} onClick={() => fileRef.current.click()}>
                  {config.flyer ? "Cambiar imagen" : "Subir flyer"}
                </button>
                {config.flyer && (
                  <div style={{ marginTop: 10 }}>
                    <img src={config.flyer} alt="Flyer" style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} />
                    <button onClick={() => updateConfig({ flyer: null })} style={{ ...s.btnSm, marginTop: 8, color: "#A32D2D", border: "1px solid #E24B4A" }}>
                      Eliminar imagen
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label style={s.label}>Monto del evento (ARS)</label>
                <input style={s.input} type="number" value={config.monto} onChange={e => updateConfig({ monto: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>

          <div style={{ ...s.warning, borderRadius: 8 }}>
            <strong>URLs de la app:</strong><br />
            <span style={{ fontSize: 12 }}>
              Registro público: swag-running-hold.vercel.app/<br />
              Panel organizador: swag-running-hold.vercel.app/organizador
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
