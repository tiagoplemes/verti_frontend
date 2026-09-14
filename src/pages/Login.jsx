import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ativarModoDemo } from "../api/client.js";
import { useAuth, paginaInicialDoPerfil } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const CONTAS_DEMO = [
  { perfil: "GERENTE", label: "Gerente", email: "gerente@demo.com" },
  { perfil: "FISCAL", label: "Fiscal", email: "fiscal@demo.com" },
  { perfil: "PEDREIRO", label: "Pedreiro", email: "pedreiro@demo.com" },
];
const SENHA_DEMO = "demo123";

export default function Login() {
  const { usuario, token, login } = useAuth();
  const { mostrarErro } = useToast();
  const navegar = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoDemo, setEnviandoDemo] = useState(false);

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

  async function entrarDemo(contaDemo) {
    setEnviandoDemo(true);
    ativarModoDemo();
    try {
      const resposta = await api.login(contaDemo.email, SENHA_DEMO);
      login(resposta.token, resposta.usuario);
      navegar(paginaInicialDoPerfil(resposta.usuario.perfil), { replace: true });
    } catch (erro) {
      mostrarErro(erro);
      setEnviandoDemo(false);
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

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cor-borda)" }}>
          <div className="texto-suave texto-pequeno" style={{ marginBottom: 8, textAlign: "center" }}>
            Sem backend? Entre em modo demonstração com dados fictícios:
          </div>
          <div className="flex gap-8" style={{ flexWrap: "wrap", justifyContent: "center" }}>
            {CONTAS_DEMO.map((conta) => (
              <button
                key={conta.perfil}
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={enviandoDemo}
                onClick={() => entrarDemo(conta)}
              >
                {conta.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
