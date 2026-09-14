import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// MODO TESTE: a checagem de perfil está desligada (ver bloco comentado abaixo)
// pra dar pra navegar em qualquer tela logado com um usuário só. Reative antes de entregar.
const TRAVA_DE_PERFIL_ATIVA = false;

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
