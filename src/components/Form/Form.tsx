import { useEffect, useState } from "react";
import "./Form.css";
import darkLogo from "../../assets/logo-universidad.png";
import lightLogo from "../../assets/logo-universidad2.png";
import {
  predictOne,
  trainPredictModel,
  type PredictRow,
  createSolicitud,
  type Bloque,
  type Sexo,
} from "../../services/api";

interface FormData {
  fechaSolicitud: string;
  nombreCompleto: string;
  documento: string;
  programa: string;
  semestre: string;
  edad: string;
  sexo: Sexo | "";
  celular: string;
  disponibilidad: Bloque[];
  comentarioDisp: string;
}

const initialState: FormData = {
  fechaSolicitud: "",
  nombreCompleto: "",
  documento: "",
  programa: "",
  semestre: "",
  edad: "",
  sexo: "",
  celular: "",
  disponibilidad: [],
  comentarioDisp: "",
};

type Notice = { type: "ok" | "warn" | "error"; text: string } | null;

export default function Form() {
  // ===== THEME =====
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  // ===== FORM STATE =====
  const [data, setData] = useState<FormData>(initialState);
  const [sending, setSending] = useState(false);
  const [formNotice, setFormNotice] = useState<Notice>(null);

  // ===== MODAL STATE =====
  const [showTest, setShowTest] = useState(false);
  const [gender, setGender] = useState<"" | "Female" | "Male" | "Other">("");
  const [occupation, setOccupation] = useState("");
  const [daysIndoors, setDaysIndoors] = useState<number>(30);
  const [flags, setFlags] = useState({
    self_employed: false,
    family_history: false,
    Growing_Stress: false,
    Changes_Habits: false,
    Mental_Health_History: false,
    Mood_Swings: false,
    Coping_Struggles: false,
    Work_Interest_low: true, // true => Low, false => High
    Social_Weakness: false,
    mental_health_interview: false,
    care_options: false,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalNotice, setModalNotice] = useState<Notice>(null);

  // Auto-cerrar avisos
  useEffect(() => {
    if (!formNotice) return;
    const t = setTimeout(() => setFormNotice(null), 4500);
    return () => clearTimeout(t);
  }, [formNotice]);

  useEffect(() => {
    if (!modalNotice) return;
    const t = setTimeout(() => setModalNotice(null), 4500);
    return () => clearTimeout(t);
  }, [modalNotice]);

  // ===== HANDLERS =====
  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setData((d) => ({ ...d, [field]: e.target.value }));

  const toggleBloque = (b: Bloque) =>
    setData((d) => ({
      ...d,
      disponibilidad: d.disponibilidad.includes(b)
        ? d.disponibilidad.filter((x) => x !== b)
        : [...d.disponibilidad, b],
    }));

  // Crear solicitud
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);
    setSending(true);
    try {
      if (!data.fechaSolicitud || !data.nombreCompleto || !data.documento || !data.programa) {
        setFormNotice({ type: "error", text: "Por favor completa los campos obligatorios." });
        return;
      }
      if (!data.sexo) {
        setFormNotice({ type: "error", text: "Selecciona el sexo." });
        return;
      }
      if (data.disponibilidad.length === 0) {
        setFormNotice({
          type: "error",
          text: "Selecciona al menos un bloque de disponibilidad (Mañana/Tarde/Noche).",
        });
        return;
      }

      const payload = {
        fechaSolicitud: data.fechaSolicitud,
        nombreCompleto: data.nombreCompleto.trim(),
        documento: String(data.documento).trim(),
        programa: data.programa.trim(),
        semestre: Number(data.semestre || 0),
        edad: Number(data.edad || 0),
        sexo: data.sexo as Sexo,
        celular: String(data.celular).trim(),
        disponibilidad: data.disponibilidad as Bloque[],
        comentarioDisp: data.comentarioDisp || "",
      };

      const res = await createSolicitud(payload);
      console.log("Solicitud creada:", res.solicitud);

      setFormNotice({ type: "ok", text: "Solicitud registrada correctamente." });
      setData(initialState);
    } catch (err: any) {
      console.error(err);
      setFormNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "Error al registrar la solicitud.",
      });
    } finally {
      setSending(false);
    }
  };

  // Entrenar/actualizar motor
  const handleTrain = async () => {
    try {
      setModalLoading(true);
      setModalNotice(null);
      const res = await trainPredictModel();
      if (res?.status === "ok") {
        setModalNotice({ type: "ok", text: "Motor actualizado correctamente." });
      } else {
        setModalNotice({ type: "error", text: res?.msg || "No fue posible actualizar el motor." });
      }
    } catch (err: any) {
      console.error(err);
      setModalNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "Error al actualizar el motor.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Evaluación (predicción)
  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalNotice(null);

      const row: PredictRow = {
        Gender: (gender as "Male" | "Female" | "Other") || "Male",
        Occupation: occupation || "Student",
        Days_Indoors: Number.isFinite(daysIndoors) ? Number(daysIndoors) : 30,
        self_employed: flags.self_employed ? "Yes" : "No",
        family_history: flags.family_history ? "Yes" : "No",
        Growing_Stress: flags.Growing_Stress ? "Yes" : "No",
        Changes_Habits: flags.Changes_Habits ? "Yes" : "No",
        Mental_Health_History: flags.Mental_Health_History ? "Yes" : "No",
        Mood_Swings: flags.Mood_Swings ? "Yes" : "No",
        Coping_Struggles: flags.Coping_Struggles ? "Yes" : "No",
        Work_Interest: flags.Work_Interest_low ? "Low" : "High",
        Social_Weakness: flags.Social_Weakness ? "Yes" : "No",
        mental_health_interview: flags.mental_health_interview ? "Yes" : "No",
        care_options: flags.care_options ? "Yes" : "No",
      };

      const resp = await predictOne(row);

      if (resp?.status !== "ok" || !resp?.predictions?.length) {
        setModalNotice({
          type: "error",
          text: resp?.msg || "No se pudo completar la evaluación en este momento.",
        });
        return;
      }

      const result = resp.predictions[0];
      if (result.predicted_label === 1) {
        setModalNotice({
          type: "warn",
          text:
            "Gracias por realizar la evaluación. Detectamos señales que indican que podrías beneficiarte de un acompañamiento profesional. Te sugerimos agendar una sesión con Bienestar.",
        });
      } else {
        setModalNotice({
          type: "ok",
          text:
            "Gracias por realizar la evaluación. No identificamos señales de riesgo en este momento. Si lo deseas, puedes agendar una charla de orientación.",
        });
      }

      console.log("Evaluación (para uso interno):", { row, result });
    } catch (err: any) {
      console.error(err);
      setModalNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "Error al realizar la evaluación.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="formx-fullscreen">
      {/* FAB (evaluación preliminar) */}
      <button
        className="fab-btn"
        type="button"
        onClick={() => {
          setModalNotice(null);
          setShowTest(true);
        }}
        title="Abrir evaluación preliminar"
      >
        🧠<span className="fab-label">Evaluación preliminar</span>
      </button>

      {/* Modal */}
      {showTest && (
        <div className="modal-overlay" onClick={() => setShowTest(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Evaluación preliminar</h3>
              <button className="modal-close" onClick={() => setShowTest(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form className="modal-body" onSubmit={handleEvaluate}>
              <div className="modal-row-2">
                <div className="formx-group">
                  <label>
                    Sexo <span className="req">*</span>
                    <span className="info-badge" title="Selecciona una opción." aria-label="Ayuda sobre el campo Sexo">ℹ️</span>
                  </label>
                  <select
                    className="formx-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    required
                  >
                    <option value="">Selecciona…</option>
                    <option value="Female">Femenino</option>
                    <option value="Male">Masculino</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>

                <div className="formx-group">
                  <label>
                    Ocupación <span className="req">*</span>
                    <span className="info-badge" title='Ejemplo: "Student", "Engineer".' aria-label="Ayuda sobre el campo Ocupación">ℹ️</span>
                  </label>
                  <input
                    className="formx-input"
                    type="text"
                    placeholder="Estudiante / Ingeniero / …"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-row-2">
                <div className="formx-group">
                  <label>
                    Días en interiores <span className="req">*</span>
                    <span className="info-badge" title="Número de días que has permanecido mayormente en interiores en el último periodo." aria-label="Ayuda sobre Días en interiores">ℹ️</span>
                  </label>
                  <input
                    className="formx-input"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={120}
                    value={daysIndoors}
                    onChange={(e) => setDaysIndoors(Number(e.target.value))}
                    onKeyDown={(e) => {
                      const block = ["e", "E", "+", "-", ".", ","];
                      if (block.includes(e.key)) e.preventDefault();
                    }}
                    required
                  />
                </div>

                <div className="formx-group">
                  <label style={{ opacity: 0 }}>.</label>
                  <div style={{ height: 40 }} />
                </div>
              </div>

              <h4 className="modal-subtitle">Características identificadas</h4>

              <div className="switch-grid">
                {[
                  ["self_employed", "¿Trabaja por cuenta propia?", "Indica si actualmente trabajas de manera independiente."],
                  ["family_history", "Antecedentes familiares", "Antecedentes de salud mental en la familia cercana."],
                  ["Growing_Stress", "Estrés creciente", "Percepción reciente de incremento en el nivel de estrés."],
                  ["Changes_Habits", "Cambios de hábitos", "Cambios notorios en sueño, alimentación u otros hábitos."],
                  ["Mental_Health_History", "Historial de salud mental", "Algún diagnóstico o tratamiento previo."],
                  ["Mood_Swings", "Cambios de humor", "Variaciones de humor más marcadas de lo habitual."],
                  ["Coping_Struggles", "Dificultades de afrontamiento", "Dificultad para manejar emociones o situaciones."],
                  ["Social_Weakness", "Debilidad social", "Sensación de retraimiento o aislamiento social."],
                  ["mental_health_interview", "Entrevista de salud mental", "Disposición a una entrevista de evaluación."],
                  ["care_options", "Opciones de cuidado", "Conocimiento o acceso a opciones de apoyo/terapia."],
                ].map(([key, label, tip]) => (
                  <label key={key as string} className="switch-item">
                    <input
                      type="checkbox"
                      checked={(flags as any)[key as string]}
                      onChange={(e) => setFlags((f) => ({ ...f, [key as string]: e.target.checked }))}
                    />
                    <span>
                      {label}{" "}
                      <span className="info-badge" title={String(tip)} aria-label={`Ayuda: ${label}`}>ℹ️</span>
                    </span>
                  </label>
                ))}

                {/* Work_Interest LOW/HIGH */}
                <label className="switch-item">
                  <input
                    type="checkbox"
                    checked={flags.Work_Interest_low}
                    onChange={(e) => setFlags((f) => ({ ...f, Work_Interest_low: e.target.checked }))}
                  />
                  <span>
                    Interés laboral bajo{" "}
                    <span
                      className="info-badge"
                      title="Marca si tu interés por actividades laborales/estudio está más bajo de lo habitual."
                      aria-label="Ayuda: Interés laboral bajo"
                    >
                      ℹ️
                    </span>
                  </span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="formx-button formx-btn-ghost"
                  onClick={handleTrain}
                  disabled={modalLoading}
                  title="Actualizar el motor con el dataset del servidor"
                >
                  {modalLoading ? "Procesando…" : "Actualizar motor"}
                </button>
                <button type="submit" className="formx-button" disabled={modalLoading}>
                  {modalLoading ? "Evaluando…" : "Evaluar"}
                </button>
              </div>

              {modalNotice && (
                <div
                  className={`notice ${
                    modalNotice.type === "ok"
                      ? "notice-ok"
                      : modalNotice.type === "warn"
                      ? "notice-warn"
                      : "notice-error"
                  }`}
                  role={modalNotice.type === "error" ? "alert" : "status"}
                >
                  {modalNotice.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* FORMULARIO PRINCIPAL */}
      <div className="formx-center-container">
        <div className="formx-card">
          {/* Header: Logo + botón tema */}
          <div className="formx-logo-container" style={{ gap: 12, alignItems: "center", flexDirection: "column" as const }}>
            <img src={currentLogo} alt="Logo universidad" className="formx-logo" />
            <button
              type="button"
              onClick={toggleTheme}
              className="formx-button"
              aria-label="Cambiar tema"
              title="Cambiar tema"
              style={{ padding: "10px 14px" }}
            >
              {theme === "dark" ? "🌞 Modo claro" : "🌙 Modo oscuro"}
            </button>
          </div>

          <h2 className="formx-title">Formulario de Solicitud</h2>

          {formNotice && (
            <div
              className={`notice ${
                formNotice.type === "ok"
                  ? "notice-ok"
                  : formNotice.type === "warn"
                  ? "notice-warn"
                  : "notice-error"
              }`}
              role={formNotice.type === "error" ? "alert" : "status"}
              style={{ marginBottom: 12 }}
            >
              {formNotice.text}
            </div>
          )}

          <div className="formx-divider" />

          <form className="formx-form" onSubmit={handleSubmit} noValidate>
            <div className="formx-group">
              <label>Fecha de solicitud</label>
              <input
                className="formx-input"
                type="date"
                value={data.fechaSolicitud}
                onChange={handleChange("fechaSolicitud")}
                required
              />
            </div>

            <div className="formx-group">
              <label>Nombre completo</label>
              <input
                className="formx-input"
                type="text"
                placeholder="Nombres y apellidos"
                value={data.nombreCompleto}
                onChange={handleChange("nombreCompleto")}
                required
              />
            </div>

            <div className="formx-row-2">
              <div className="formx-group">
                <label>Documento</label>
                <input
                  className="formx-input"
                  type="number"
                  placeholder="000000000"
                  value={data.documento}
                  onChange={handleChange("documento")}
                  required
                />
              </div>

              <div className="formx-group">
                <label>Programa</label>
                <input
                  className="formx-input"
                  type="text"
                  placeholder="Programa académico"
                  value={data.programa}
                  onChange={handleChange("programa")}
                  required
                />
              </div>
            </div>

            <div className="formx-row-2">
              <div className="formx-group">
                <label>Semestre</label>
                <input
                  className="formx-input"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="1–20"
                  value={data.semestre}
                  onChange={handleChange("semestre")}
                  required
                />
              </div>

              <div className="formx-group">
                <label>Edad</label>
                <input
                  className="formx-input"
                  type="number"
                  min={1}
                  max={90}
                  placeholder="Años"
                  value={data.edad}
                  onChange={handleChange("edad")}
                  required
                />
              </div>
            </div>

            <div className="formx-row-2">
              <div className="formx-group">
                <label>Sexo</label>
                <select className="formx-input" value={data.sexo} onChange={handleChange("sexo")} required>
                  <option value="">Selecciona…</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro / Prefiero no decir</option>
                </select>
              </div>

              <div className="formx-group">
                <label>Celular</label>
                <input
                  className="formx-input"
                  type="number"
                  placeholder="300 0000 000"
                  value={data.celular}
                  onChange={handleChange("celular")}
                  required
                />
              </div>
            </div>

            <div className="formx-group">
              <label>Disponibilidad</label>
              <div className="formx-chips">
                {(["Mañana", "Tarde", "Noche"] as Bloque[]).map((b) => {
                  const active = data.disponibilidad.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      className={`formx-chip ${active ? "active" : ""}`}
                      onClick={() => toggleBloque(b)}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="formx-group">
              <label>Comentario de disponibilidad (opcional)</label>
              <textarea
                className="formx-input"
                rows={3}
                placeholder="Indica días/horas específicas u observaciones"
                value={data.comentarioDisp}
                onChange={handleChange("comentarioDisp")}
              />
            </div>

            <div className="formx-actions">
              <button
                type="button"
                className="formx-button formx-btn-ghost"
                onClick={() => setData(initialState)}
                disabled={sending}
              >
                Limpiar
              </button>
              <button className="formx-button" type="submit" disabled={sending}>
                {sending ? "Enviando…" : "Guardar solicitud"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
