import React, { useEffect, useState } from "react";
import "./ModalReporte.css"; // Asegúrate de que la ruta a tu CSS es correcta

// 1. Importa la función y el tipo desde tu archivo de API
import { downloadReport, type ReportPayload } from "../../services/api"; // <-- Ajusta la ruta si es necesario

// Define las propiedades que el componente espera recibir
type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalDescargaReportes: React.FC<Props> = ({ isOpen, onClose }) => {
  // 2. Usa el tipo importado para el estado 'type' para mayor seguridad
  const [type, setType] = useState<ReportPayload['type']>('consultas');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Efecto para limpiar el estado del modal cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      // Opcional: podrías resetear las fechas también si lo deseas
      // setFrom('');
      // setTo('');
    }
  }, [isOpen]);

  // Si el modal no está abierto, no renderiza nada
  if (!isOpen) return null;

  // Función para validar las fechas antes de enviar la petición
  const validate = () => {
    if (!from || !to) {
      setError("Por favor, selecciona un rango de fechas (desde y hasta).");
      return false;
    }
    if (new Date(from) > new Date(to)) {
      setError("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
      return false;
    }
    return true;
  };

  // 3. Controlador de envío actualizado para usar la nueva función de la API
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      // Llama a la función de la API con el payload correcto
      await downloadReport({ type, from, to });
      
      // Si la descarga se inicia correctamente, cierra el modal
      onClose();

    } catch (err: any) {
      // El error ya viene procesado por el interceptor o por la lógica de `downloadReport`
      console.error("Error al descargar el reporte:", err);
      setError(err.normalizedMsg || err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-wrapper" role="document" aria-labelledby="modal-title">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 id="modal-title" className="modal-title">Descargar Reporte</h2>
            <p className="modal-desc">Selecciona el tipo de reporte y el rango de fechas.</p>
          </div>
          <button
            onClick={() => !loading && onClose()}
            aria-label="Cerrar"
            className="modal-close-btn"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleDownload} className="modal-grid">
          <div className="form-group-login">
            <label className="modal-label">Tipo de reporte</label>
            {/* 4. Select actualizado con los valores correctos y deshabilitado durante la carga */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportPayload['type'])}
              className="login-input"
              disabled={loading}
            >
              <option value="consultas">Consultas de Estudiantes</option>
              <option value="solicitudes">Consultas de Solicitudes</option>
              <option value="usuarios">Nuevos Usuarios del Sistema</option>
            </select>
          </div>

          <div className="modal-row">
            <div className="form-group-login" style={{ flex: 1 }}>
              <label className="modal-label">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="login-input"
                disabled={loading}
              />
            </div>
            <div className="form-group-login" style={{ flex: 1 }}>
              <label className="modal-label">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="login-input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Muestra el mensaje de error si existe */}
          {error && <div className="error-message-login modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-cancel"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-download"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Generando..." : "Descargar"}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          Nota: La generación del reporte puede tardar unos segundos. El archivo se descargará automáticamente.
        </div>
      </div>
    </div>
  );
};

export default ModalDescargaReportes;