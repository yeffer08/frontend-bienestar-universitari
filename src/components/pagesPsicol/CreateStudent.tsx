import { useEffect, useState } from "react";
import "./CreateStudent.css";

import { createStudent } from "../../services/api";
import type { EstudianteCreatePayload, TipoSeguridadMedica } from "../../types";

type Seguridad = TipoSeguridadMedica | "";

type StudentForm = {
  nombre: string;
  apellido: string;
  cedula: string;
  carrera: string;
  semestre: string;
  correo: string;
  telefono: string;
  edad: string;
  estado_civil: string;
  direccion: string;

  nombre_familiar: string;
  documento_familiar: string;
  telefono_familiar: string;
  correo_familiar: string;
  direccion_familiar: string;

  motivo_consulta: string;
  info_familiar_relevante: string;
  con_quien_vive: string;
  tiene_hijos: boolean | "";
  cambios_en_la_familia: string;
  dinamica_familiar: string;

  posee_seguridad_medica: boolean | "";
  tipo_seguridad_medica: Seguridad;
  nombre_seguridad_medica: string;

  diagnostico_medico: string;
  terapia_medicamentosa: string;
};

const initialState: StudentForm = {
  nombre: "",
  apellido: "",
  cedula: "",
  carrera: "",
  semestre: "",
  correo: "",
  telefono: "",
  edad: "",
  estado_civil: "",
  direccion: "",

  nombre_familiar: "",
  documento_familiar: "",
  telefono_familiar: "",
  correo_familiar: "",
  direccion_familiar: "",

  motivo_consulta: "",
  info_familiar_relevante: "",
  con_quien_vive: "",
  tiene_hijos: "",
  cambios_en_la_familia: "",
  dinamica_familiar: "",

  posee_seguridad_medica: "",
  tipo_seguridad_medica: "",
  nombre_seguridad_medica: "",

  diagnostico_medico: "",
  terapia_medicamentosa: "",
};

export default function CreateStudent() {
  const [form, setForm] = useState<StudentForm>(initialState);
  const [docAutorizacion, setDocAutorizacion] = useState<File | null>(null);
  const [docHistoria, setDocHistoria] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 30000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 30000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");


    //*****************************************************************************/
    // Pendiente para realizar la carga de documentos en la app  ******************/

    // if (!docAutorizacion || !docHistoria) {
    //   setError("Debes adjuntar Autorización de datos e Historia clínica.");
    //   return;
    // }
    //*****************************************************************************/

    const payload: EstudianteCreatePayload = {
      nombre: form.nombre,
      apellido: form.apellido,
      cedula: form.cedula,
      carrera: form.carrera || undefined,
      semestre: form.semestre ? Number(form.semestre) : null,
      correo: form.correo || undefined,
      telefono: form.telefono || undefined,
      edad: form.edad ? Number(form.edad) : null,
      estado_civil: form.estado_civil || undefined,
      direccion: form.direccion || undefined,
      informacion: {
        nombre_familiar: form.nombre_familiar || undefined,
        documento_familiar: form.documento_familiar || undefined,
        telefono_familiar: form.telefono_familiar || undefined,
        correo_familiar: form.correo_familiar || undefined,
        direccion_familiar: form.direccion_familiar || undefined,

        motivo_consulta: form.motivo_consulta || undefined,
        info_familiar_relevante: form.info_familiar_relevante || undefined,
        con_quien_vive: form.con_quien_vive || undefined,
        tiene_hijos: form.tiene_hijos === "" ? null : Boolean(form.tiene_hijos),

        cambios_en_la_familia: form.cambios_en_la_familia || undefined,
        dinamica_familiar: form.dinamica_familiar || undefined,

        posee_seguridad_medica:
          form.posee_seguridad_medica === "" ? null : Boolean(form.posee_seguridad_medica),
        tipo_seguridad_medica: (form.tipo_seguridad_medica as any) || null,
        nombre_seguridad_medica: form.nombre_seguridad_medica || undefined,

        diagnostico_medico: form.diagnostico_medico || undefined,
        terapia_medicamentosa: form.terapia_medicamentosa || undefined,
      },
    };

    try {
      setIsSubmitting(true);
      const created = await createStudent(payload);

      // TODO: cuando tengas endpoint, subir archivos aquí
      // const fd = new FormData();
      // fd.append("autorizacion_datos", docAutorizacion);
      // fd.append("historia_clinica", docHistoria);
      // await uploadStudentDocuments(created.estudiante.id_estudiante, fd);

      setSuccess("Estudiante creado correctamente.");
      setForm(initialState);
      setDocAutorizacion(null);
      setDocHistoria(null);
    } catch (err: any) {
      setError(err?.normalizedMsg || err?.response?.data?.msg || "No se pudo crear el estudiante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cs-wrapper">
      <h2 className="cs-title">Registrar estudiante</h2>
      <div className="cs-divider" />

      {error && <div className="cs-alert error">{error}</div>}
      {success && <div className="cs-alert success">{success}</div>}

      <form className="cs-form" onSubmit={handleSubmit}>
        {/* Datos básicos */}
        <fieldset>
          <legend>Datos básicos</legend>
          <div className="grid-2">
            <div className="form-group">
              <label>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Cédula *</label>
              <input name="cedula" value={form.cedula} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Carrera</label>
              <input name="carrera" value={form.carrera} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Semestre</label>
              <input
                type="number"
                min={1}
                max={20}
                name="semestre"
                value={form.semestre}
                onChange={onChange}
              />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={onChange}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Edad</label>
              <input
                type="number"
                min={1}
                max={120}
                name="edad"
                value={form.edad}
                onChange={onChange}
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Estado civil</label>
              <input
                name="estado_civil"
                value={form.estado_civil}
                onChange={onChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Familiar */}
        <fieldset>
          <legend>Información del familiar</legend>
          <div className="grid-2">
            <div className="form-group">
              <label>Nombre del familiar</label>
              <input name="nombre_familiar" value={form.nombre_familiar} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Documento del familiar</label>
              <input name="documento_familiar" value={form.documento_familiar} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Teléfono del familiar</label>
              <input name="telefono_familiar" value={form.telefono_familiar} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Correo del familiar</label>
              <input type="email" name="correo_familiar" value={form.correo_familiar} onChange={onChange} />
            </div>
            <div className="form-group full">
              <label>Dirección del familiar</label>
              <input name="direccion_familiar" value={form.direccion_familiar} onChange={onChange} />
            </div>
          </div>
        </fieldset>

        {/* Contexto y motivos */}
        <fieldset>
          <legend>Contexto y motivo de consulta</legend>
          <div className="grid-2">
            <div className="form-group full">
              <label>Motivo de consulta</label>
              <textarea name="motivo_consulta" value={form.motivo_consulta} onChange={onChange} rows={3} />
            </div>
            <div className="form-group full">
              <label>Información familiar relevante</label>
              <textarea name="info_familiar_relevante" value={form.info_familiar_relevante} onChange={onChange} rows={3} />
            </div>
            <div className="form-group">
              <label>¿Con quién vive?</label>
              <input name="con_quien_vive" value={form.con_quien_vive} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>¿Tiene hijos?</label>
              <select name="tiene_hijos" value={String(form.tiene_hijos)} onChange={onChange}>
                <option value="">Selecciona…</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Cambios en la familia</label>
              <textarea name="cambios_en_la_familia" value={form.cambios_en_la_familia} onChange={onChange} rows={2} />
            </div>
            <div className="form-group full">
              <label>Dinámica familiar</label>
              <textarea name="dinamica_familiar" value={form.dinamica_familiar} onChange={onChange} rows={2} />
            </div>
          </div>
        </fieldset>

        {/* Información médica */}
        <fieldset>
          <legend>Información médica</legend>
          <div className="grid-2">
            <div className="form-group">
              <label>¿Posee seguridad médica?</label>
              <select name="posee_seguridad_medica" value={String(form.posee_seguridad_medica)} onChange={onChange}>
                <option value="">Selecciona…</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de seguridad</label>
              <select
                name="tipo_seguridad_medica"
                value={form.tipo_seguridad_medica}
                onChange={onChange}
                disabled={String(form.posee_seguridad_medica) !== "true"}
              >
                <option value="">—</option>
                <option value="SISBEN">SISBEN</option>
                <option value="EPS">EPS</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombre Eps / Nivel de Sisben</label>
              <input
                name="nombre_seguridad_medica"
                value={form.nombre_seguridad_medica}
                onChange={onChange}
                disabled={String(form.posee_seguridad_medica) !== "true"}
              />
            </div>
            <div className="form-group full">
              <label>Diagnóstico médico</label>
              <textarea name="diagnostico_medico" value={form.diagnostico_medico} onChange={onChange} rows={2} />
            </div>
            <div className="form-group full">
              <label>Terapia medicamentosa</label>
              <textarea name="terapia_medicamentosa" value={form.terapia_medicamentosa} onChange={onChange} rows={2} />
            </div>
          </div>
        </fieldset>

        {/* /* Documentos obligatorios 
        <fieldset>
          <legend>Documentos obligatorios</legend>
          <div className="grid-2">
            <div className="form-group">
              <label>Autorización de datos (PDF/JPG/PNG) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocAutorizacion(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="form-group">
              <label>Historia clínica (PDF/JPG/PNG) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocHistoria(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>
        </fieldset> */}

        <div className="cs-actions">
          <button className="cs-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar estudiante"}
          </button>
        </div>
      </form>
    </div>
  );
}
