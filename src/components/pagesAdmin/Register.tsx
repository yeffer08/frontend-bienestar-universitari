import { useEffect, useMemo, useState } from 'react';
import { register, getUsers, activateUser, deactivateUser } from '../../services/api';
import './Register.css';
import type { User } from '../../types';

const ROLE_LABEL: Record<User['rol'], string> = {
  'admin': 'Administrador',
  'psicologo': 'Psicólogo',
};

export default function Register() {
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '', rol: 'psicologo' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const list = await getUsers();
      setUsers(list || []);
    } catch (e) {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenCreate(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 🔔 Auto-limpiar mensajes después de 30 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 30000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 30000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const filteredUsers = useMemo(() => users, [users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await register(formData);
      setSuccess('Usuario creado exitosamente.');
      setFormData({ nombre: '', correo: '', password: '', rol: '2' });
      setOpenCreate(false);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Error al registrar usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const id = Number(user.id);
    const isActive = Boolean(user.active);
    try {
      if (isActive) {
        await deactivateUser(id);
      } else {
        await activateUser(id);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !isActive } : u))
      );
    } catch (e) {
      setError('No se pudo actualizar el estado del usuario.');
    }
  };

  return (
    <div className="register-fullscreen">
      <div className="register-card">
        <div className="register-header">
          <h2>Gestión de Usuarios</h2>
          <button className="register-button" onClick={() => setOpenCreate(true)}>
            Nuevo usuario
          </button>
        </div>
        <div className="register-divider"></div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="register-content">
          <section className="users-panel">
            <h3>Usuarios</h3>
            {loadingUsers ? (
              <p>Cargando…</p>
            ) : filteredUsers.length === 0 ? (
              <p>No hay usuarios.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.correo}</td>
                      <td>{ROLE_LABEL[u.rol]}</td>
                      <td>
                        <span className={`status-badge ${u.active ? 'on' : 'off'}`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {u.active ? (
                          <button
                            className="btn-outline"
                            onClick={() => handleToggleActive(u)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() => handleToggleActive(u)}
                          >
                            Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* MODAL CREAR USUARIO */}
        {openCreate && (
          <div className="modal-overlay" onClick={() => setOpenCreate(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Crear usuario</h3>
                <button
                  className="modal-close"
                  onClick={() => setOpenCreate(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input
                    className="register-input"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input
                    className="register-input"
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    className="register-input"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    className="register-input"
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                  >
                    <option value="2">Psicólogo</option>
                    <option value="1">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="register-button" disabled={isLoading}>
                  {isLoading ? 'Registrando…' : 'Crear Usuario'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
