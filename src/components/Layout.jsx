import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { desativarModoDemo, modoDemoAtivo } from "../api/client.js";

const NAV_ITENS = {
  GERENTE: [
    { to: "/gerente", label: "Ordens de Serviço", fim: true },
    { to: "/gerente/nova", label: "Nova OS" },
    { to: "/gerente/usuarios", label: "Usuários" },
  ],
  FISCAL: [{ to: "/fiscal", label: "Pendentes de Fiscalização" }],
  PEDREIRO: [{ to: "/pedreiro", label: "Minhas Ordens de Serviço" }],
};

const MOSTRAR_MENU_COMPLETO = false;

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const itens = MOSTRAR_MENU_COMPLETO
    ? Object.values(NAV_ITENS).flat()
    : NAV_ITENS[usuario?.perfil] || [];

  function sair() {
    desativarModoDemo();
    logout();
  }

  return (
    <>
      {modoDemoAtivo() && (
        <div style={{ background: "var(--cor-ambar, #f59e0b)", color: "#1a1a1a", textAlign: "center", padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>
          Modo demonstração — dados fictícios, sem backend real
        </div>
      )}
      <header className="topbar">
        <div className="topbar-marca">Verti</div>
        <nav className="topbar-nav">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fim}
              className={({ isActive }) => "nav-link" + (isActive ? " nav-link-ativo" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-usuario">
          <span>{usuario?.nome}</span>
          <span className="badge badge-neutro">{usuario?.perfil}</span>
          <button className="btn btn-ghost btn-sm" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      <div className="container">{children}</div>
    </>
  );
}
