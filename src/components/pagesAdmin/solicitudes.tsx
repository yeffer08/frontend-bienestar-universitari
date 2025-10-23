// src/pages/admin/solicitudesAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getSolicitudes,
  asignarSolicitud,
  cambiarEstadoSolicitud,
  getUsers,
  type Solicitud,
  type EstadoSolicitud,
} from "../../services/api";
import type { User } from "../../types"; // ajusta si tu tipo está en otra ruta
import "./solicitudesAdmin.css";

type Notice = { type: "ok" | "warn" | "error"; text: string } | null;

// const ESTADOS: EstadoSolicitud[] = ["pendiente", "asignada", "agendado"];

export default function SolicitudesAdmin() {
  // Filtros y control
  const [estado, setEstado] = useState<"" | EstadoSolicitud>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Data & UI state
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Solicitud[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState<Notice>(null);

  // Modal asignación
  const [showAssign, setShowAssign] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignNotice, setAssignNotice] = useState<Notice>(null);
  const [assignTarget, setAssignTarget] = useState<Solicitud | null>(null);
  const [psicologos, setPsicologos] = useState<User[]>([]);
  const [selectedPsic, setSelectedPsic] = useState<number | "">("");

  // Helpers calculados
  const from = useMemo(() => (list.length ? (page - 1) * perPage + 1 : 0), [list, page, perPage]);
  const to = useMemo(() => (list.length ? (page - 1) * perPage + list.length : 0), [list, page, perPage]);

  // Cargar psicólogos para el modal
  useEffect(() => {
    (async () => {
      try {
        const users = await getUsers();
        const onlyP = users.filter((u) => (u as any).rol === "psicologo" && (u as any).active !== 0);
        setPsicologos(onlyP);
      } catch (err) {
        // si falla, mantenemos array vacío; el modal mostrará un aviso
        console.error(err);
      }
    })();
  }, []);

  // Cargar solicitudes
  const fetchSolicitudes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (estado) params.estado = estado;
      if (search.trim()) params.search = search.trim();
      const res = await getSolicitudes(params);
      setList(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err: any) {
      console.error(err);
      setError({
        type: "error",
        text: err?.normalizedMsg || err?.message || "Error cargando solicitudes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce básico de 400ms para búsqueda
    const t = setTimeout(fetchSolicitudes, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, search, page, perPage]);

  const handleRefresh = () => {
    fetchSolicitudes();
  };

  // Abrir modal de asignación
  const openAssignModal = (s: Solicitud) => {
    setAssignTarget(s);
    setSelectedPsic("");
    setAssignNotice(null);
    setShowAssign(true);
  };

  // Confirmar asignación
  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    if (!selectedPsic || typeof selectedPsic !== "number") {
      setAssignNotice({ type: "error", text: "Selecciona un psicólogo." });
      return;
    }
    try {
      setAssignLoading(true);
      setAssignNotice(null);
      const res = await asignarSolicitud(assignTarget.id_solicitud, selectedPsic);
      setAssignNotice({ type: "ok", text: "Solicitud asignada correctamente." });
      handleRefresh();

      // Refrescar fila en memoria (sin recargar toda la página)
      setList((prev) =>
        prev.map((row) =>
          row.id_solicitud === assignTarget.id_solicitud ? res.solicitud : row
        )
      );
      // Cerrar modal en breve
      setTimeout(() => setShowAssign(false), 600);
    } catch (err: any) {
      console.error(err);
      setAssignNotice({
        type: "error",
        text: err?.normalizedMsg || err?.message || "No se pudo asignar la solicitud.",
      });
    } finally {
      setAssignLoading(false);
    }
  };

  // Cambiar estado genérico
  const updateEstado = async (s: Solicitud, nuevo: EstadoSolicitud) => {
    try {
      setLoading(true);
      const res = await cambiarEstadoSolicitud(s.id_solicitud, nuevo);
      // Actualizar solo esa fila
      setList((prev) =>
        prev.map((row) => (row.id_solicitud === s.id_solicitud ? res.solicitud : row))
      );
    } catch (err: any) {
      console.error(err);
      setError({
        type: "error",
        text: err?.normalizedMsg || err?.message || "No se pudo actualizar el estado.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render: badge de estado
  const EstadoBadge = ({ value }: { value: EstadoSolicitud }) => {
    const cls =
      value === "pendiente"
        ? "badge badge-pending"
        : value === "asignada"
        ? "badge badge-assigned"
        : "badge badge-scheduled";
    const label =
      value === "pendiente" ? "Pendiente" : value === "asignada" ? "Asignada" : "Agendado";
    return <span className={cls}>{label}</span>;
  };

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Solicitudes</h2>
          <div className="admin-card-actions">
            <button onClick={handleRefresh} disabled={loading} title="Actualizar">
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-row">
          <div className="filter-item">
            <label>Estado</label>
            <select
              value={estado}
              onChange={(e) => {
                setPage(1);
                setEstado(e.target.value as EstadoSolicitud | "");
              }}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="asignada">Asignada</option>
              <option value="agendado">Agendado</option>
            </select>
          </div>

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
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aviso general */}
        {error && (
          <div
            className={`notice ${
              error.type === "ok" ? "notice-ok" : error.type === "warn" ? "notice-warn" : "notice-error"
            }`}
            role={error.type === "error" ? "alert" : "status"}
            style={{ marginBottom: 12 }}
          >
            {error.text}
          </div>
        )}

        {/* Tabla */}
        <div className="table-wrapper">
          <table className="admin-table">
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
                <th>Asignado</th>
                <th style={{ minWidth: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", opacity: 0.8, padding: "16px 0" }}>
                    No hay resultados.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", opacity: 0.8, padding: "16px 0" }}>
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
                    <td>{s.celular}</td>
                    <td>{(s.disponibilidad || []).join(", ")}</td>
                    <td className="ellipsis" title={s.comentario_disp || ""}>
                      {s.comentario_disp || "—"}
                    </td>
                    <td>
                      <EstadoBadge value={s.estado} />
                    </td>
                    <td>{s.nombre_psicologo ?? "—"}</td>
                    <td className="table-actions">
                      {/* Asignar */}
                      <button
                        className="btn-secondary"
                        onClick={() => openAssignModal(s)}
                        title="Asignar a psicólogo"
                      >
                        🎯 Asignar
                      </button>

                      {/* Cambiar estado rápido */}
                      {s.estado !== "pendiente" && (
                        <button
                          className="btn-ghost"
                          onClick={() => updateEstado(s, "pendiente")}
                          title="Marcar como pendiente"
                        >
                          ↩︎ Pendiente
                        </button>
                      )}
                      {s.estado !== "asignada" && (
                        <button
                          className="btn-ghost"
                          onClick={() => updateEstado(s, "asignada")}
                          title="Marcar como asignada"
                        >
                          ✅ Asignada
                        </button>
                      )}
                      {s.estado !== "agendado" && (
                        <button
                          className="btn-primary"
                          onClick={() => updateEstado(s, "agendado")}
                          title="Marcar como agendado"
                        >
                          📅 Agendado
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

      {/* Modal Asignación */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Asignar solicitud</h3>
              <button className="modal-close" onClick={() => setShowAssign(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form className="modal-body" onSubmit={handleAsignar}>
              <div className="formx-group">
                <label>Psicólogo</label>
                <select
                  className="formx-input"
                  value={String(selectedPsic)}
                  onChange={(e) => setSelectedPsic(Number(e.target.value))}
                  required
                >
                  <option value="">Selecciona…</option>
                  {psicologos.length === 0 && <option value="" disabled>(No hay psicólogos activos)</option>}
                  {psicologos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre || p.email || `ID ${p.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* info de la solicitud (compacta) */}
              {assignTarget && (
                <div className="mini-summary">
                  <div><b>Solicitud:</b> #{assignTarget.id_solicitud}</div>
                  <div><b>Estudiante:</b> {assignTarget.nombre_completo}</div>
                  <div><b>Programa:</b> {assignTarget.programa} · Sem {assignTarget.semestre}</div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="formx-button formx-btn-ghost" onClick={() => setShowAssign(false)}>
                  Cancelar
                </button>
                <button type="submit" className="formx-button" disabled={assignLoading}>
                  {assignLoading ? "Asignando…" : "Asignar"}
                </button>
              </div>

              {assignNotice && (
                <div
                  className={`notice ${
                    assignNotice.type === "ok"
                      ? "notice-ok"
                      : assignNotice.type === "warn"
                      ? "notice-warn"
                      : "notice-error"
                  }`}
                  role={assignNotice.type === "error" ? "alert" : "status"}
                >
                  {assignNotice.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
