import { Navigate } from "react-router-dom";
import { useAuth, paginaInicialDoPerfil } from "../context/AuthContext.jsx";

// Envolve uma página exigindo sessão válida e, opcionalmente, um perfil específico.
export default function ProtectedRoute({ perfis, children }) {
  const { usuario, token } = useAuth();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (perfis && !perfis.includes(usuario.perfil)) {
    return <Navigate to={paginaInicialDoPerfil(usuario.perfil)} replace />;
  }

  return children;
}
