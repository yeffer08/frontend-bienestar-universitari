import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './components/Login/Login';
import Form from './components/Form/Form';

import AdminLayout from "./components/AdminLayout/AdminLayout";

import Dashboard from "./components/pagesAdmin/Dashboard";
import CreateFormulario from "./components/pagesAdmin/CreateFormulario";
import Registro from './components/pagesAdmin/Register';
import PsychologistLayout from './components/PsicoLayaout/PsicoLayaout';
import StudentsList from './components/pagesPsicol/StudentsList';
import CreateStudent from './components/pagesPsicol/CreateStudent';
import StudentDetail from './components/pagesPsicol/StudentDetail';
import SolicitudesAdmin from './components/pagesAdmin/solicitudes';
import SolicitudesAsignadas from './components/pagesPsicol/SolicitudesAsignadas';
// import Home from './components/Home/Home';


const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/Form" element={<Form />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Login />
              </PrivateRoute>
            }
          />

            {/* Rutas del admin con layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="create-formulario" element={<CreateFormulario />} />
            <Route path="psicologos" element={<Registro />} />
            <Route path="solicitudes" element={<SolicitudesAdmin />} />
            <Route path="estudiantes/:id" element={<StudentDetail />} />
          </Route>

          {/* Rutas del psicólogo con layout */}
          <Route path="/psicologo" element={<PsychologistLayout />}>
            <Route index element={<StudentsList />} />
            <Route path="registrar-estudiante"element={<CreateStudent />}/>
            <Route path="aplicar-formulario" element={<h2>Aplicar Formulario</h2>} />
            <Route path="historial" element={<h2>Visualizar Historial</h2>} />
            <Route path="estudiantes/:id" element={<StudentDetail />} />
            <Route path="solicitudes" element={<SolicitudesAsignadas />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
