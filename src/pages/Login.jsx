import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth, paginaInicialDoPerfil } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { usuario, token, login } = useAuth();
  const { mostrarErro } = useToast();
  const navegar = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario && token) {
    return <Navigate to={paginaInicialDoPerfil(usuario.perfil)} replace />;
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resposta = await api.login(email, senha);
      login(resposta.token, resposta.usuario);
      navegar(paginaInicialDoPerfil(resposta.usuario.perfil), { replace: true });
    } catch (erro) {
      mostrarErro(erro);
      setEnviando(false);
    }
  }

  return (
    <div className="tela-login">
      <div className="login-card card">
        <div className="login-marca">Verti</div>
        <div className="login-subtitulo">Gestão de Ordens de Serviço</div>

        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              className="input"
              type="email"
              id="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              className="input"
              type="password"
              id="senha"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
