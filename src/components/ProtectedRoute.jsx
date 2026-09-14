import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const TRAVA_DE_PERFIL_ATIVA = true;

// Envolve uma página exigindo sessão válida e, opcionalmente, um perfil específico.
export default function ProtectedRoute({ perfis, children }) {
  const { usuario, token } = useAuth();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (TRAVA_DE_PERFIL_ATIVA && perfis && !perfis.includes(usuario.perfil)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
