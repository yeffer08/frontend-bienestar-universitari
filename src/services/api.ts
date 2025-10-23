// api.ts
import axios from 'axios';
import type { User } from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5050/';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/* ================================
   Interceptor de REQUEST (JWT)
================================ */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================================
   Interceptor de RESPONSE
   - Manejo 401 + mensaje normalizado
================================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const msg = error.response.data?.msg;

      if (msg?.includes('expirado')) {
        alert('⚠️ Tu sesión ha expirado. Vuelve a iniciar sesión.');
      } else {
        alert('⚠️ Sesión inválida. Por favor, inicia sesión nuevamente.');
      }

      // Limpia sesión y redirige
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('nombre');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const normalizedMsg =
      error?.response?.data?.msg ||
      (typeof error?.response?.data === 'string'
        ? error.response.data
        : undefined) ||
      error?.message ||
      'Error de red. Intenta nuevamente.';

    return Promise.reject({ ...error, normalizedMsg });
  }
);

/** Helper opcional para inyectar/remover el JWT manualmente */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

type ApiSuccess<T = any> = T;
type ApiError = { msg?: string };

/* ================================
   Auth
================================ */

/** Login */
export const login = async (correo: string, password: string) => {
  const response = await api.post<{
    rol: any;
    access_token: string;
    user_id: number;
    nombre: string;
    correo: string;
  }>('auth/login', { correo, password });

  const { access_token, user_id, nombre: nombreResp, correo: userEmail } =
    response.data;

  if (access_token && user_id !== undefined) {
    // Persistir sesión
    localStorage.setItem('token', access_token);
    localStorage.setItem('user_id', user_id.toString());
    localStorage.setItem('nombre', nombreResp);

    const userData = {
      id: user_id,
      nombre: nombreResp,
      correo: userEmail,
    };
    localStorage.setItem('user', JSON.stringify(userData));
  } else {
    throw new Error('Token o ID de usuario no recibido desde el backend');
  }

  return response.data;
};

/** Registro vía auth (si lo sigues usando en otra vista) */
export const registerAuth = async (userData: {
  nombre: string;
  correo: string;
  password: string;
  rol: string;
}) => {
  const response = await api.post('auth/register', userData);
  return response.data;
};

/* ================================
   SOLICITUDES (Bienestar)
   Estados: pendiente | asignada | agendado
================================ */

export type Bloque = "Mañana" | "Tarde" | "Noche";
export type Sexo = "Femenino" | "Masculino" | "Otro";
export type EstadoSolicitud = "pendiente" | "asignada" | "agendado";

export type Solicitud = {
  id_solicitud: number;
  fecha_solicitud: string; // YYYY-MM-DD
  nombre_completo: string;
  documento: string;
  programa: string;
  semestre: number;
  edad: number;
  sexo: Sexo;
  celular: string;
  disponibilidad: Bloque[];
  comentario_disp: string | null;
  estado: EstadoSolicitud;
  id_usuario: number | null; // psicólogo asignado
  nombre_psicologo?: string | null; // opcional, para listar
  created_at: string; // ISO
  updated_at: string; // ISO
};

export type SolicitudCreatePayload = {
  fechaSolicitud: string;          // YYYY-MM-DD
  nombreCompleto: string;
  documento: string;
  programa: string;
  semestre: number | string;
  edad: number | string;
  sexo: Sexo;
  celular: string;
  disponibilidad: Bloque[];
  comentarioDisp?: string;
};

export type SolicitudUpdatePayload = Partial<{
  fechaSolicitud: string;
  nombreCompleto: string;
  documento: string;
  programa: string;
  semestre: number | string;
  edad: number | string;
  sexo: Sexo;
  celular: string;
  disponibilidad: Bloque[];
  comentarioDisp: string | null;
  estado: EstadoSolicitud;
  id_usuario: number | null;
}>;

export type SolicitudesListParams = Partial<{
  estado: EstadoSolicitud;
  id_usuario: number;
  search: string;
  page: number;       // default 1
  per_page: number;   // default 20 (máx 100)
}>;

export type PaginatedSolicitudes = {
  items: Solicitud[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
};

/** Crear solicitud */
export const createSolicitud = async (payload: SolicitudCreatePayload) => {
  // el backend ya valida/convierte; aquí casteamos números por prolijidad
  const body = {
    ...payload,
    semestre: Number(payload.semestre),
    edad: Number(payload.edad),
    comentarioDisp: payload.comentarioDisp ?? "",
  };
  const { data } = await api.post<{ msg: string; solicitud: Solicitud }>("/solicitudes/", body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

/** Listar solicitudes (con filtros opcionales y paginación) */
export const getSolicitudes = async (params?: SolicitudesListParams) => {
  const { data } = await api.get<PaginatedSolicitudes>("/solicitudes/", { params });
  return data;
};

/** Obtener una solicitud por ID */
export const getSolicitudById = async (id_solicitud: number) => {
  const { data } = await api.get<Solicitud>(`/solicitudes/${id_solicitud}`);
  return data;
};

/** Actualizar una solicitud (parcial) */
export const updateSolicitud = async (id_solicitud: number, payload: SolicitudUpdatePayload) => {
  const { data } = await api.put<{ msg: string; solicitud: Solicitud }>(
    `/solicitudes/${id_solicitud}`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

/** Asignar solicitud a psicólogo (cambia estado a 'asignada') */
export const asignarSolicitud = async (id_solicitud: number, id_usuario: number) => {
  const { data } = await api.put<{ msg: string; solicitud: Solicitud }>(
    `/solicitudes/asignar/${id_solicitud}`,
    { id_usuario },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

/** Cambiar estado de la solicitud: pendiente | asignada | agendado */
export const cambiarEstadoSolicitud = async (
  id_solicitud: number,
  estado: EstadoSolicitud
) => {
  const { data } = await api.put<{ msg: string; solicitud: Solicitud }>(
    `/solicitudes/estado/${id_solicitud}`,
    { estado },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};


/* ================================
   PREDICT (ML)
   Soporta ambos esquemas de ruta:
   - /predict/train  y  /predict/predict
   - /train          y  /predict
================================ */

/** Tipos estrictos según tu payload requerido */
export type YesNo = "Yes" | "No";
export type Gender = "Male" | "Female" | "Other";
export type WorkInterest = "Low" | "High";

export type PredictRow = {
  Gender: Gender;                 // "Male" | "Female" | "Other"
  Occupation: string;             // "Student" u otro texto
  Days_Indoors: number;           // numérico (p.ej. 30)
  self_employed: YesNo;
  family_history: YesNo;
  Growing_Stress: YesNo;
  Changes_Habits: YesNo;
  Mental_Health_History: YesNo;
  Mood_Swings: YesNo;
  Coping_Struggles: YesNo;
  Work_Interest: WorkInterest;    // "Low" | "High"
  Social_Weakness: YesNo;
  mental_health_interview: YesNo;
  care_options: YesNo;
};

type TrainResponse = {
  status: "ok" | "error";
  model_path?: string;
  metrics?: Record<string, number>;
  meta?: unknown;
  msg?: string;
};

type PredictItem = { predicted_label: number; probability: number };
type PredictResponse = {
  status: "ok" | "error";
  predictions?: PredictItem[];
  msg?: string;
};

const PREDICT_PATHS = {
  train: ["/predict/ml/train", "/ml/train"],
  predict: ["/predict/ml/predict", "/ml/predict"],
};

/** Helper que intenta varias rutas (blueprint con/sin url_prefix) */
async function postWithFallback<T>(paths: string[], payload: unknown): Promise<T> {
  let lastError: any = null;
  for (const p of paths) {
    try {
      const { data } = await api.post<T>(p, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return data;
    } catch (err: any) {
      lastError = err;
      continue; // probamos la siguiente ruta
    }
  }
  throw lastError ?? new Error("No fue posible contactar el endpoint de predicción.");
}

/** Entrena el modelo (usa ds.csv del repo en el backend) */
export const trainPredictModel = async () => {
  return await postWithFallback<TrainResponse>(PREDICT_PATHS.train, {});
};

/** Predice para un solo registro (usa exactamente el formato requerido) */
export const predictOne = async (row: PredictRow) => {
  return await postWithFallback<PredictResponse>(PREDICT_PATHS.predict, { row });
};

/** Predice para múltiples registros */
export const predictMany = async (rows: PredictRow[]) => {
  return await postWithFallback<PredictResponse>(PREDICT_PATHS.predict, { rows });
};



/* ================================
   Usuarios (módulo administración)
   Endpoints esperados del backend:
   - GET  /usuarios/               → listar
   - POST /usuarios/               → crear (admin)
   - PUT  /usuarios/:id            → desactivar
   - PUT  /usuarios/activar/:id    → activar
================================ */

/** Listar usuarios (usa tipos importados desde ../types) */
export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get<ApiSuccess<User[]>>('/usuarios/');
  return data;
};

/** Crear usuario (módulo de administración) */
export const register = async (userData: {
  nombre: string;
  correo: string;
  password: string;
  rol: string | number; // "1"/"2" o 1/2
}) => {
  // Nota: esta función la usa tu Register.tsx
  const { data } = await api.post('/usuarios/', userData);
  return data;
};

/** Desactivar usuario (active = false) */
export const deactivateUser = async (
  id: number | string
): Promise<ApiSuccess | ApiError> => {
  // PUT /usuarios/:id
  console.log(`Desactivando usuario con ID: ${id}`);
  const { data } = await api.put(`/usuarios/desactivar/${id}`);
  return data;
};

/** Activar usuario (active = true) */
export const activateUser = async (
  id: number | string
): Promise<ApiSuccess | ApiError> => {
  // PUT /usuarios/activar/:id
  const { data } = await api.put(`/usuarios/activar/${id}`);
  return data;
};

/* ================================
   (Legacy) getAllUsers
   — mantenida por si la usa otra parte
================================ */
export const getAllUsers = async () => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

// --- ESTUDIANTES ---
import type {
  Estudiante,
  EstudianteCreatePayload,
  EstudianteUpdatePayload,
} from '../types';

// Crear estudiante
export const createStudent = async (payload: EstudianteCreatePayload) => {
  const { data } = await api.post('/estudiantes/', payload);
  // el controller retorna { msg, estudiante }
  return data as { msg: string; estudiante: Estudiante };
};

// Listar estudiantes (?include_info=true)
export const getStudents = async (includeInfo = false) => {
  const { data } = await api.get<Estudiante[]>(
    `/estudiantes/?include_info=${includeInfo ? 'true' : 'false'}`
  );
  return data;
};

// Obtener uno (?include_info=true por defecto)
export const getStudentById = async (id: number, includeInfo = true) => {
  const { data } = await api.get<Estudiante>(
    `/estudiantes/${id}?include_info=${includeInfo ? 'true' : 'false'}`
  );
  return data;
};

// Actualizar (estudiante + informacion anidada opcional)
export const updateStudent = async (id: number, payload: EstudianteUpdatePayload) => {
  const { data } = await api.put(`/estudiantes/${id}`, payload);
  // { msg, estudiante }
  return data as { msg: string; estudiante: Estudiante };
};

// Eliminar
export const deleteStudent = async (id: number) => {
  const { data } = await api.delete(`/estudiantes/${id}`);
  // { msg }
  return data as { msg: string };
};

/* (Opcional) Subida de documentos si habilitas el endpoint:
export const uploadStudentDocuments = async (id: number, formData: FormData) => {
  const { data } = await api.post(`/estudiantes/${id}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
*/

// Crear formulario
export const createFormulario = async (payload: {
  // puedes enviar cualquiera de estos dos:
  titulo?: string;   // recomendado
  nombre?: string;   // alias por si tu UI lo usa así
  descripcion?: string;
  preguntas: {
    // cualquiera de estos 3 nombres funciona en el controller:
    titulo?: string;
    texto?: string;
    texto_pregunta?: string;

    // tipos admitidos por el Enum del backend:
    tipo: "Texto" | "Número" | "Fecha" | "Selección"; // (también acepta "texto"/"numero"/"fecha"/"seleccion" en minúsculas)
    obligatoria?: boolean;
    orden?: number;

    // solo si tipo = "Selección"
    opciones?: { label: string; valor?: string; orden?: number }[];
  }[];
}) => {
  const { data } = await api.post("/formularios/", payload);
  // esperado: { msg, formulario }
  return data;
};

import type { Formulario, HistorialItem, RespuestaSubmit } from "../types";

// Lista formularios (sin preguntas)
export const getFormularios = async (): Promise<Formulario[]> => {
  const { data } = await api.get<Formulario[]>("/formularios/");
  return data;
};

// Detalle de un formulario con preguntas/opciones
export const getFormularioById = async (id: number): Promise<Formulario> => {
  const { data } = await api.get<Formulario>(`/formularios/${id}?include_preguntas=true`);
  return data;
};

// Enviar respuestas (el backend toma id_psicologo desde el JWT)
export const submitRespuestas = async (payload: {
  id_formulario: number;
  id_estudiante: number;
  respuestas: RespuestaSubmit[];
}) => {
  const { data } = await api.post("/respuestas/submit", payload);
  return data; // { msg, ... }
};

// Historial por estudiante (agrupado por aplicación/fecha)
export const getHistorialByStudent = async (id_estudiante: number): Promise<HistorialItem[]> => {
  const { data } = await api.get<HistorialItem[]>(`/respuestas/estudiante/${id_estudiante}`);
  return data;
};

// En tu archivo api.ts

/* ================================
   REPORTES (Descarga de .xlsx)
================================ */

/**
 * Define la estructura del payload que se enviará al backend
 * para solicitar un reporte.
 */
export type ReportPayload = {
  type: 'consultas' | 'usuarios' | 'solicitudes' | string; // 'consultas', 'usuarios' y 'solicitudes' son los tipos que definimos
  from: string; // Formato YYYY-MM-DD
  to: string; // Formato YYYY-MM-DD
};

/**
 * Solicita la generación de un reporte al backend y dispara la descarga
 * del archivo Excel (.xlsx) resultante en el navegador.
 *
 * @param payload - Objeto con el tipo de reporte y el rango de fechas.
 */
export const downloadReport = async (payload: ReportPayload): Promise<void> => {
  try {
    const response = await api.post('/reports/', payload, {
      // ¡Muy importante! Le decimos a axios que la respuesta será un blob (un archivo).
      responseType: 'blob',
    });

    // 1. Extraer el nombre del archivo del header 'Content-Disposition'
    const contentDisposition = response.headers['content-disposition'];
    let filename = `reporte_${payload.type}.xlsx`; // Nombre por defecto

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }

    // 2. Crear una URL temporal para el blob recibido
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));

    // 3. Crear un enlace <a> invisible en el DOM
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Asignar el nombre del archivo

    // 4. Simular un clic en el enlace para iniciar la descarga
    document.body.appendChild(link);
    link.click();

    // 5. Limpiar: remover el enlace y la URL del objeto para liberar memoria
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
    
  } catch (error: any) {
    // Si el error es un blob (porque el backend devolvió un error JSON en lugar de un archivo),
    // intentamos leerlo para mostrar un mensaje más claro.
    if (error.response?.data instanceof Blob) {
      const errorText = await error.response.data.text();
      try {
        const errorJson = JSON.parse(errorText);
        // Lanzamos un error con el mensaje normalizado para que el interceptor lo capture si es necesario,
        // o para que el componente que llama a la función pueda manejarlo.
        throw new Error(errorJson.msg || 'Error al generar el reporte.');
      } catch (e) {
        throw new Error('No se pudo generar el reporte. El servidor devolvió una respuesta inesperada.');
      }
    }
    // Si no es un blob, el interceptor de errores ya lo manejará
    throw error;
  }
};


export default api;
