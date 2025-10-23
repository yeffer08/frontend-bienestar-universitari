import { useEffect, useMemo, useState } from "react";
import { getSolicitudes, cambiarEstadoSolicitud, type Solicitud, type EstadoSolicitud } from "../../services/api";
import "./psicologoSolicitudes.css";

type Notice = { type: "ok" | "warn" | "error"; text: string } | null;

export default function SolicitudesAsignadas() {
  // ID del psicólogo desde la sesión
  const storedUser = localStorage.getItem("user");
  const myId: number | null = storedUser ? Number(JSON.parse(storedUser).id) : null;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Solicitud[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [notice, setNotice] = useState<Notice>(null);

  const from = useMemo(() => (list.length ? (page - 1) * perPage + 1 : 0), [list, page, perPage]);
  const to = useMemo(() => (list.length ? (page - 1) * perPage + list.length : 0), [list, page, perPage]);

  const fetchData = async () => {
    if (!myId) {
      setNotice({ type: "error", text: "No se encontró el usuario en sesión." });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const res = await getSolicitudes({
        id_usuario: myId,
        page,
        per_page: perPage,
        search: search.trim() || undefined,
      });
      setList(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err: any) {
      console.error(err);
      setNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "Error cargando solicitudes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, search]);

  const handleRefresh = () => fetchData();

  // Cambiar estado (pendiente/asignada/agendado)
  const updateEstado = async (s: Solicitud, nuevo: EstadoSolicitud) => {
    try {
      setLoading(true);
      const res = await cambiarEstadoSolicitud(s.id_solicitud, nuevo);
      setList((prev) => prev.map((row) => (row.id_solicitud === s.id_solicitud ? res.solicitud : row)));
      setNotice({ type: "ok", text: "Estado actualizado." });
    } catch (err: any) {
      console.error(err);
      setNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "No se pudo actualizar el estado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const EstadoBadge = ({ value }: { value: EstadoSolicitud }) => {
    const cls =
      value === "pendiente"
        ? "badge badge-pending"
        : value === "asignada"
        ? "badge badge-assigned"
        : "badge badge-scheduled";
    const label = value === "pendiente" ? "Pendiente" : value === "asignada" ? "Asignada" : "Agendado";
    return <span className={cls}>{label}</span>;
  };

  return (
    <div className="psy-requests">
      <div className="psy-card">
        <div className="psy-card-header">
          <h2>Mis solicitudes asignadas</h2>
          <div className="psy-actions">
            <button onClick={handleRefresh} disabled={loading} title="Actualizar">🔄 Actualizar</button>
          </div>
        </div>

        {/* Filtros simples */}
        <div className="filters-row">
          <div className="filter-item grow">
            <label>Búsqueda</label>
            <input
              type="text"
              placeholder="Nombre, documento o programa…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="filter-item">
            <label>Por página</label>
            <select
              value={perPage}
              onChange={(e) => {
                setPage(1);
                setPerPage(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aviso */}
        {notice && (
          <div
            className={`notice ${
              notice.type === "ok" ? "notice-ok" : notice.type === "warn" ? "notice-warn" : "notice-error"
            }`}
            role={notice.type === "error" ? "alert" : "status"}
            style={{ marginBottom: 12 }}
          >
            {notice.text}
          </div>
        )}

        {/* Tabla */}
        <div className="table-wrapper">
          <table className="psy-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Programa</th>
                <th>Sem</th>
                <th>Edad</th>
                <th>Sexo</th>
                <th>Celular</th>
                <th>Disponibilidad</th>
                <th>Comentario</th>
                <th>Estado</th>
                <th style={{ minWidth: 200 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", opacity: 0.8, padding: "16px 0" }}>
                    No tienes solicitudes asignadas.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", opacity: 0.8, padding: "16px 0" }}>
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading &&
                list.map((s) => (
                  <tr key={s.id_solicitud}>
                    <td>{s.id_solicitud}</td>
                    <td>{s.fecha_solicitud}</td>
                    <td>{s.nombre_completo}</td>
                    <td>{s.documento}</td>
                    <td>{s.programa}</td>
                    <td>{s.semestre}</td>
                    <td>{s.edad}</td>
                    <td>{s.sexo}</td>
                    <td>
                      <a href={`https://wa.me/57${s.celular.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        {s.celular}
                      </a>
                    </td>
                    <td>{(s.disponibilidad || []).join(", ")}</td>
                    <td className="ellipsis" title={s.comentario_disp || ""}>
                      {s.comentario_disp || "—"}
                    </td>
                    <td>
                      <EstadoBadge value={s.estado} />
                    </td>
                    <td className="table-actions">
                      {s.estado !== "agendado" && (
                        <button
                          className="btn-primary"
                          onClick={() => updateEstado(s, "agendado")}
                          title="Marcar como agendado"
                        >
                          📅 Agendado
                        </button>
                      )}
                      {s.estado !== "asignada" && (
                        <button
                          className="btn-secondary"
                          onClick={() => updateEstado(s, "asignada")}
                          title="Marcar como asignada"
                        >
                          ✅ Asignada
                        </button>
                      )}
                      {s.estado !== "pendiente" && (
                        <button
                          className="btn-ghost"
                          onClick={() => updateEstado(s, "pendiente")}
                          title="Marcar como pendiente"
                        >
                          ↩︎ Pendiente
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination-row">
          <div className="muted">
            {from}-{to} de {total}
          </div>
          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ◀
            </button>
            <span>
              Página {page} / {pages || 1}
            </span>
            <button disabled={page >= (pages || 1)} onClick={() => setPage((p) => p + 1)}>
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
