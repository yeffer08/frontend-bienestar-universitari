import React, { useEffect, useState } from "react";
import "./CreateFormulario.css";
import { createFormulario } from "../../services/api"; // asegúrate de tener esta función en api.ts

type TipoPregunta = "Texto" | "Número" | "Fecha" | "Selección";

type PreguntaUI = {
  texto: string;            // título de la pregunta en UI
  tipo: TipoPregunta;       // Texto | Número | Selección
  obligatoria: boolean;
  opciones?: string[];      // solo aplica si tipo = Selección
};

const CreateFormulario: React.FC = () => {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [preguntas, setPreguntas] = useState<PreguntaUI[]>([
    { texto: "", tipo: "Texto", obligatoria: false },
  ]);
  const [mensaje, setMensaje] = useState("");

  // Limpia mensaje a los 30s
  useEffect(() => {
    if (mensaje) {
      const t = setTimeout(() => setMensaje(""), 30000);
      return () => clearTimeout(t);
    }
  }, [mensaje]);

  const handlePreguntaChange = (
    index: number,
    field: keyof PreguntaUI,
    value: any
  ) => {
    const nuevas = [...preguntas];
    (nuevas as any)[index][field] = value;

    // Si cambia a "Selección" y no hay opciones, creamos 2 por defecto
    if (field === "tipo" && value === "Selección" && !nuevas[index].opciones) {
      nuevas[index].opciones = ["Opción 1", "Opción 2"];
    }
    // Si deja de ser "Selección", removemos opciones
    if (field === "tipo" && value !== "Selección") {
      delete nuevas[index].opciones;
    }

    setPreguntas(nuevas);
  };

  const addPregunta = () => {
    setPreguntas([
      ...preguntas,
      { texto: "", tipo: "Texto", obligatoria: false },
    ]);
  };

  const removePregunta = (index: number) => {
    setPreguntas(preguntas.filter((_, i) => i !== index));
  };

  // Opciones (solo para Selección)
  const addOpcion = (pIndex: number) => {
    setPreguntas((prev) => {
      const copy = [...prev];
      if (!copy[pIndex].opciones) copy[pIndex].opciones = [];
      copy[pIndex].opciones!.push(`Opción ${copy[pIndex].opciones!.length + 1}`);
      return copy;
    });
  };

  const changeOpcion = (pIndex: number, oIndex: number, value: string) => {
    setPreguntas((prev) => {
      const copy = [...prev];
      if (!copy[pIndex].opciones) return prev;
      copy[pIndex].opciones![oIndex] = value;
      return copy;
    });
  };

  const removeOpcion = (pIndex: number, oIndex: number) => {
    setPreguntas((prev) => {
      const copy = [...prev];
      if (!copy[pIndex].opciones) return prev;
      copy[pIndex].opciones = copy[pIndex].opciones!.filter((_, i) => i !== oIndex);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mínimas antes de enviar
    if (!titulo.trim()) {
      setMensaje("⚠️ El formulario necesita un título.");
      return;
    }
    if (preguntas.length === 0) {
      setMensaje("⚠️ Agrega al menos una pregunta.");
      return;
    }
    if (preguntas.some((p) => !p.texto.trim())) {
      setMensaje("⚠️ Todas las preguntas deben tener texto.");
      return;
    }
    for (const p of preguntas) {
      if (p.tipo === "Selección") {
        if (!p.opciones || p.opciones.length < 2) {
          setMensaje(`⚠️ La pregunta “${p.texto || "sin texto"}” necesita al menos 2 opciones.`);
          return;
        }
        if (p.opciones.some((o) => !o.trim())) {
          setMensaje(`⚠️ Hay opciones vacías en “${p.texto || "sin texto"}”.`);
          return;
        }
      }
    }

    // Payload que espera tu backend (controller nuevo)
    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      preguntas: preguntas.map((p, i) => ({
        titulo: p.texto.trim(),                     // backend acepta titulo/texto/texto_pregunta
        tipo: p.tipo,                               // "Texto" | "Número" | "Selección"
        obligatoria: p.obligatoria || undefined,
        orden: i + 1,
        opciones:
          p.tipo === "Selección"
            ? p.opciones!.map((label, j) => ({
                label: label.trim(),
                orden: j + 1,
              }))
            : undefined,
      })),
    };

    try {
      await createFormulario(payload);
      setMensaje("✅ Formulario guardado correctamente");
      // Reset UI
      setTitulo("");
      setDescripcion("");
      setPreguntas([{ texto: "", tipo: "Texto", obligatoria: false }]);
    } catch (err: any) {
      setMensaje(
        err?.normalizedMsg ||
          err?.response?.data?.msg ||
          err?.response?.data?.error ||
          "❌ No se pudo guardar el formulario."
      );
    }
  };

  return (
    <div className="formulario-wrapper">
      <div className="formulario-card">
        <div className="formulario-header">
          <h2>📝 Crear Formulario</h2>
        </div>

        {mensaje && <div className="mensaje">{mensaje}</div>}

        <form onSubmit={handleSubmit} className="formulario-body">
          <input
            type="text"
            placeholder="Título del formulario"
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea
            placeholder="Descripción"
            className="input"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <h3 className="formulario-subtitle">Preguntas</h3>
          {preguntas.map((p, index) => (
            <div key={index} className="pregunta-card">
              <textarea
                placeholder={`Pregunta ${index + 1}`}
                className="pregunta-textarea"
                value={p.texto}
                onChange={(e) =>
                  handlePreguntaChange(index, "texto", e.target.value)
                }
              />

              <div className="pregunta-opciones">
                <select
                  className="select"
                  value={p.tipo}
                  onChange={(e) =>
                    handlePreguntaChange(index, "tipo", e.target.value as TipoPregunta)
                  }
                >
                  <option value="Texto">Texto</option>
                  <option value="Número">Número</option>
                  <option value="Fecha">Fecha</option>
                  <option value="Selección">Selección</option>
                </select>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={p.obligatoria}
                    onChange={(e) =>
                      handlePreguntaChange(index, "obligatoria", e.target.checked)
                    }
                  />
                  Obligatoria
                </label>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removePregunta(index)}
                >
                  ✖ Eliminar
                </button>
              </div>

              {p.tipo === "Selección" && (
                <div className="opciones-wrap">
                  <div className="opciones-title">Opciones</div>
                  {(p.opciones || []).map((opt, i) => (
                    <div key={i} className="opcion-row">
                      <input
                        className="input opcion-input"
                        value={opt}
                        placeholder={`Opción ${i + 1}`}
                        onChange={(e) => changeOpcion(index, i, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-opcion"
                        onClick={() => removeOpcion(index, i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addOpcion(index)}
                  >
                    + Añadir opción
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="botones">
            <button
              type="button"
              className="btn btn-primary"
              onClick={addPregunta}
            >
              ➕ Añadir Pregunta
            </button>
            <button type="submit" className="btn btn-success">
              ✅ Guardar Formulario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormulario;
