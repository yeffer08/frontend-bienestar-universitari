import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./StudentDetail.css";
import {
  getStudentById,
  getFormularios,
  getFormularioById,
  submitRespuestas,
  getHistorialByStudent,
} from "../../services/api";
import type {
  Estudiante,
  Formulario,
  PreguntaForm,
  RespuestaSubmit,
  HistorialItem,
  TipoPreguntaBD,
} from "../../types";

// ------ UI helpers ------
function Section({
  title,
  isOpen,
  onToggle,
  children,
}: PropsWithChildren<{ title: string; isOpen: boolean; onToggle: () => void }>) {
  return (
    <section className={`sd-card sd-section-card ${isOpen ? "open" : "closed"}`}>
      <button
        className="sd-accordion-header"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={title.replace(/\s+/g, "-").toLowerCase()}
      >
        <span className="sd-acc-title">{title}</span>
        <span className={`sd-acc-icon ${isOpen ? "rot" : ""}`} aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div id={title.replace(/\s+/g, "-").toLowerCase()} className="sd-accordion-body">
          {children}
        </div>
      )}
    </section>
  );
}

function InputByTipo({
  q,
  value,
  onChange,
}: {
  q: PreguntaForm;
  value: any;
  onChange: (v: any) => void;
}) {
  const tipo = q.tipo as TipoPreguntaBD;

  if (tipo === "numero") {
    return (
      <input
        className="input"
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder="Ingresa un número"
      />
    );
  }

  if (tipo === "fecha") {
    // Guardamos string "YYYY-MM-DD" tal cual
    return (
      <input
        className="input"
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (tipo === "seleccion") {
    return (
      <select
        className="select"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Selecciona —</option>
        {(q.opciones || []).map((o) => (
          <option key={o.id_opcion ?? o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (tipo === "booleano") {
    return (
      <select
        className="select"
        value={value === true ? "true" : value === false ? "false" : ""} // asegura selección correcta
        onChange={(e) =>
          onChange(
            e.target.value === ""
              ? ""
              : e.target.value === "true"
              ? true
              : false
          )
        }
      >
        <option value="">— Selecciona —</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }

  // texto (default)
  return (
    <textarea
      className="input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escribe aquí…"
    />
  );
}

// ------ Main ------
export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<Estudiante | null>(null);

  // acordeones
  const [open, setOpen] = useState({ basicos: true, familiar: true, medica: true, aplicar: true, historial: true });
  const allOpen = Object.values(open).every(Boolean);
  const toggleAll = (v: boolean) => setOpen({ basicos: v, familiar: v, medica: v, aplicar: v, historial: v });
  const toggle = (k: keyof typeof open) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  // formularios
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [formSelId, setFormSelId] = useState<number | "">("");
  const [formSel, setFormSel] = useState<Formulario | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // historial
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  const nombreCompleto = useMemo(() => {
    if (!student) return "";
    return `${student.nombre ?? ""} ${student.apellido ?? ""}`.trim();
  }, [student]);

  const cedula = student?.cedula ?? (student as any)?.Cedula ?? "—";
  const idEst = Number(id);

  useEffect(() => {
    const load = async () => {
      if (!idEst) { setError("ID de estudiante inválido."); return; }
      setLoading(true);
      setError("");
      try {
        const [stu, forms, hist] = await Promise.all([
          getStudentById(idEst, true),
          getFormularios(),
          getHistorialByStudent(idEst).catch(() => []),
        ]);
        setStudent(stu || null);
        setFormularios(forms || []);
        setHistorial(hist || []);
      } catch (err: any) {
        setError(err?.normalizedMsg || "No se pudo cargar la información del estudiante.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idEst]);

  // cuando se elige un formulario, pedimos su detalle
  useEffect(() => {
    if (!formSelId) { setFormSel(null); setAnswers({}); return; }
    (async () => {
      try {
        const f = await getFormularioById(Number(formSelId));
        setFormSel(f);
        // init respuestas vacías
        const init: Record<number, any> = {};
        (f.preguntas || []).forEach((q) => (init[q.id_pregunta] = ""));
        setAnswers(init);
      } catch (e: any) {
        setMsg(e?.normalizedMsg || "No se pudo cargar el formulario.");
      }
    })();
  }, [formSelId]);

  const handleChangeAnswer = (id_pregunta: number, v: any) => {
    setAnswers((p) => ({ ...p, [id_pregunta]: v }));
  };

  const handleSubmitRespuestas = async () => {
    if (!formSel || !idEst) return;
    // validaciones mínimas de obligatorias
    const oblig = (formSel.preguntas || []).filter((q) => q.obligatoria);
    for (const q of oblig) {
      const val = answers[q.id_pregunta];
      if (val === "" || val === undefined || val === null) {
        setMsg(`⚠️ La pregunta obligatoria “${q.texto_pregunta}” está vacía.`);
        return;
      }
    }

    const payload = {
      id_formulario: formSel.id_formulario,
      id_estudiante: idEst,
      respuestas: Object.entries(answers).map(([id_p, respuesta]) => ({
        id_pregunta: Number(id_p),
        respuesta: respuesta === "" ? null : respuesta, // fecha ya va como string "YYYY-MM-DD"
      })) as RespuestaSubmit[],
    };

    try {
      setSaving(true);
      setMsg("");
      await submitRespuestas(payload);
      setMsg("✅ Respuestas guardadas.");

      // refrescar historial
      const hist = await getHistorialByStudent(idEst).catch(() => []);
      setHistorial(hist || []);

      // 🔄 limpiar selección y respuestas
      setFormSelId("");
      setFormSel(null);
      setAnswers({});
    } catch (e: any) {
      setMsg(e?.normalizedMsg || "❌ No se pudieron guardar las respuestas.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 30000);
    }
  };

  return (
    <div className="student-detail">
      <div className="sd-header">
        <div className="sd-title-wrap">
          <h2 className="sd-title">👤 {nombreCompleto || "Estudiante"}</h2>
        </div>

        <div className="sd-actions">
          <button className="btn" onClick={() => navigate(-1)}>← Volver</button>
          <button
            className="btn-primary"
            onClick={() => toggleAll(!allOpen)}
            title={allOpen ? "Colapsar todo" : "Expandir todo"}
          >
            {allOpen ? "− Colapsar todo" : "+ Expandir todo"}
          </button>
        </div>
      </div>

      {loading && <div className="sd-card"><p>Cargando…</p></div>}
      {error && !loading && <div className="sd-card error">{error}</div>}

      {student && !loading && !error && (
        <div className="sd-stack">
          {/* Datos básicos */}
          <Section title="Datos básicos" isOpen={open.basicos} onToggle={() => toggle("basicos")}>
            <div className="sd-cascade">
              <div className="sd-item"><label>Nombre</label><div>{nombreCompleto || "—"}</div></div>
              <div className="sd-item"><label>Documento</label><div>{cedula}</div></div>
              <div className="sd-item"><label>Programa</label><div>{student?.carrera || "—"}</div></div>
              <div className="sd-item"><label>Semestre</label><div>{student?.semestre ?? "—"}</div></div>
              <div className="sd-item"><label>Correo</label><div>{student.correo || "—"}</div></div>
              <div className="sd-item"><label>Teléfono</label><div>{student.telefono || "—"}</div></div>
              <div className="sd-item"><label>Dirección</label><div>{student.direccion || "—"}</div></div>
              <div className="sd-item"><label>Estado civil</label><div>{student.estado_civil || "—"}</div></div>
              <div className="sd-item"><label>Edad</label><div>{student.edad ?? "—"}</div></div>
            </div>
          </Section>

          {/* Familiar/social */}
          <Section title="Información familiar y social" isOpen={open.familiar} onToggle={() => toggle("familiar")}>
            <div className="sd-cascade">
              <div className="sd-item"><label>Nombre familiar</label><div>{student.informacion?.nombre_familiar || "—"}</div></div>
              <div className="sd-item"><label>Documento familiar</label><div>{student.informacion?.documento_familiar || "—"}</div></div>
              <div className="sd-item"><label>Teléfono familiar</label><div>{student.informacion?.telefono_familiar || "—"}</div></div>
              <div className="sd-item"><label>Correo familiar</label><div>{student.informacion?.correo_familiar || "—"}</div></div>
              <div className="sd-item"><label>Dirección familiar</label><div>{student.informacion?.direccion_familiar || "—"}</div></div>
              <div className="sd-item"><label>Motivo de consulta</label><p className="sd-text">{student.informacion?.motivo_consulta || "—"}</p></div>
              <div className="sd-item"><label>Información familiar relevante</label><p className="sd-text">{student.informacion?.info_familiar_relevante || "—"}</p></div>
              <div className="sd-item"><label>Con quién vive</label><div>{student.informacion?.con_quien_vive || "—"}</div></div>
              <div className="sd-item"><label>Tiene hijos</label><div>{student.informacion?.tiene_hijos === true ? "Sí" : student.informacion?.tiene_hijos === false ? "No" : "—"}</div></div>
              <div className="sd-item"><label>Cambios en la familia</label><p className="sd-text">{student.informacion?.cambios_en_la_familia || "—"}</p></div>
              <div className="sd-item"><label>Dinámica familiar</label><p className="sd-text">{student.informacion?.dinamica_familiar || "—"}</p></div>
            </div>
          </Section>

          {/* Médica */}
          <Section title="Información médica" isOpen={open.medica} onToggle={() => toggle("medica")}>
            <div className="sd-cascade">
              <div className="sd-item"><label>Seguridad médica</label><div>{student.informacion?.posee_seguridad_medica === true ? "Sí" : student.informacion?.posee_seguridad_medica === false ? "No" : "—"}</div></div>
              <div className="sd-item"><label>Tipo</label><div>{student.informacion?.tipo_seguridad_medica || "—"}</div></div>
              <div className="sd-item"><label>Nombre de la seguridad</label><div>{student.informacion?.nombre_seguridad_medica || "—"}</div></div>
              <div className="sd-item"><label>Diagnóstico médico</label><p className="sd-text">{student.informacion?.diagnostico_medico || "—"}</p></div>
              <div className="sd-item"><label>Terapia medicamentosa</label><p className="sd-text">{student.informacion?.terapia_medicamentosa || "—"}</p></div>
            </div>
          </Section>

          {/* Aplicar formulario */}
          <Section title="Aplicar formulario" isOpen={open.aplicar} onToggle={() => toggle("aplicar")}>
            <div className="sd-cascade">
              <div className="sd-item">
                <label>Formulario</label>
                <select className="select" value={formSelId} onChange={(e) => setFormSelId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">— Selecciona un formulario —</option>
                  {formularios.map((f) => (
                    <option key={f.id_formulario} value={f.id_formulario}>
                      {f.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {formSel && (formSel.preguntas || []).length > 0 && (
                <div className="sd-cascade">
                  {(formSel.preguntas || []).map((q) => (
                    <div key={q.id_pregunta} className="sd-item">
                      <label>
                        {q.texto_pregunta}
                        {q.obligatoria ? " *" : ""}
                      </label>
                      <InputByTipo
                        q={q}
                        value={answers[q.id_pregunta]}
                        onChange={(v) => handleChangeAnswer(q.id_pregunta, v)}
                      />
                    </div>
                  ))}

                  {msg && <div className="sd-item" style={{ borderColor: "rgba(56,189,248,.35)" }}>{msg}</div>}

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn" onClick={() => { setFormSelId(""); setFormSel(null); setAnswers({}); }}>Cancelar</button>
                    <button className="btn-primary" disabled={saving} onClick={handleSubmitRespuestas}>
                      {saving ? "Guardando…" : "Guardar respuestas"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Historial */}
          <Section title="Historial de formularios" isOpen={open.historial} onToggle={() => toggle("historial")}>
            {historial.length === 0 ? (
              <div className="sd-item"><div>No hay aplicaciones registradas.</div></div>
            ) : (
              <div className="sd-cascade">
                {historial.map((h) => (
                  <details key={`${h.id_respuesta_lote}-${h.id_formulario}`} className="sd-item">
                    <summary style={{ cursor: "pointer" }}>
                      <b>{h.titulo_formulario}</b> · {new Date(h.fecha_respuesta).toLocaleString()}
                    </summary>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                      {h.respuestas.map((r, i) => (
                        <div key={i} className="sd-item">
                          <label>{r.texto_pregunta}</label>
                          <div>{String(r.respuesta ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
