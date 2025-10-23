import { useEffect, useState } from "react";
// En StudentsList.tsx
import { useNavigate } from "react-router-dom";
import "./StudentsList.css";
import { getStudents } from "../../services/api"; // 👈 usamos tu función real

type Student = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  carrera?: string;
};

export default function StudentsList() {
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getStudents();
        setEstudiantes(
          (data || []).map((e: any) => ({
            id_estudiante: e.id_estudiante,
            nombre: e.nombre,
            apellido: e.apellido,
            cedula: e.cedula ?? e.Cedula ?? "", // fallback
            correo: e.correo,
            carrera: e.carrera,
          }))
        );
      } catch (err: any) {
        setError(err?.normalizedMsg || "Error al cargar estudiantes.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = estudiantes.filter(
    (e) =>
      (e.nombre + " " + e.apellido).toLowerCase().includes(q.toLowerCase()) ||
      (e.correo || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar por nombre o correo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando…</p>
      ) : filtered.length === 0 ? (
        <p>No hay estudiantes.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Programa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id_estudiante}>
                <td>{`${s.nombre} ${s.apellido}`}</td>
                <td>{s.cedula || "—"}</td>
                <td>{s.correo || "—"}</td>
                <td>{s.carrera || "—"}</td>
                <td>
                  <button className="btn-primary" onClick={() => navigate(`estudiantes/${s.id_estudiante}`)}>
                    👁 Ver información
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
