// src/types/index.ts

// src/types/index.ts

// --- Formularios ---
export type TipoPreguntaBD = "texto" | "numero" | "fecha" | "seleccion" | "booleano";

export interface OpcionPregunta {
  id_opcion?: number;
  label: string;            // mapeado desde texto_opcion en backend
}

export interface PreguntaForm {
  id_pregunta: number;
  texto_pregunta: string;
  tipo: TipoPreguntaBD;     // enum en BD en minúsculas
  obligatoria: boolean;
  opciones?: OpcionPregunta[];
}

export interface Formulario {
  id_formulario: number;
  titulo: string;
  descripcion?: string;
  preguntas?: PreguntaForm[]; // cuando pedimos include_preguntas
}

// --- Submisión de respuestas ---
export interface RespuestaSubmit {
  id_pregunta: number;
  respuesta: string | number | boolean | null;
}

export interface HistorialItem {
  id_respuesta_lote: number;     // id de la "aplicación" (si tu backend usa un lote / fecha)
  id_formulario: number;
  titulo_formulario: string;
  fecha_respuesta: string;       // ISO
  respuestas: Array<{
    id_pregunta: number;
    texto_pregunta: string;
    respuesta: string | number | boolean | null;
  }>;
}

// === Estudiantes ===
export type TipoSeguridadMedica = 'SISBEN' | 'EPS';

export interface InformacionEstudiante {
  id_info?: number;
  id_estudiante?: number;

  nombre_familiar?: string;
  documento_familiar?: string;
  telefono_familiar?: string;
  correo_familiar?: string;
  direccion_familiar?: string;

  motivo_consulta?: string;
  info_familiar_relevante?: string;
  con_quien_vive?: string;
  tiene_hijos?: boolean | null;
  cambios_en_la_familia?: string;
  dinamica_familiar?: string;

  posee_seguridad_medica?: boolean | null;
  tipo_seguridad_medica?: TipoSeguridadMedica | null;
  nombre_seguridad_medica?: string;

  diagnostico_medico?: string;
  terapia_medicamentosa?: string;

  fecha_creacion?: string; // ISO
}

export interface Estudiante {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: string;

  carrera?: string | null;
  semestre?: number | null;
  correo?: string | null;

  telefono?: string | null;
  edad?: number | null;
  estado_civil?: string | null;
  direccion?: string | null;
  fecha_nac?: string | null; // 'YYYY-MM-DD' o null

  informacion?: InformacionEstudiante | null;
}

// payloads para API
export interface EstudianteCreatePayload {
  nombre: string;
  apellido: string;
  cedula: string;

  carrera?: string;
  semestre?: number | null;
  correo?: string;

  telefono?: string;
  edad?: number | null;
  estado_civil?: string;
  direccion?: string;
  fecha_nac?: string | null; // 'YYYY-MM-DD' o null

  informacion?: InformacionEstudiante; // parcial, tus controladores ignoran desconocidos
}

export type EstudianteUpdatePayload = Partial<EstudianteCreatePayload>;


// ===========================
// Paginación genérica
// ===========================
export interface PaginationResponse<T> {
  items?: T[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ===========================
// Usuarios
// ===========================

export type User = {
  email: string;
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  active?: boolean;   // true = activo, false = inactivo
  createdAt?: string; // opcional si el backend lo devuelve
};
