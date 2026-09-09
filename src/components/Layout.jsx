import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITENS = {
  GERENTE: [
    { to: "/gerente", label: "Ordens de Serviço", fim: true },
    { to: "/gerente/nova", label: "Nova OS" },
    { to: "/gerente/usuarios", label: "Usuários" },
  ],
  FISCAL: [{ to: "/fiscal", label: "Pendentes de Fiscalização" }],
  PEDREIRO: [{ to: "/pedreiro", label: "Minhas Ordens de Serviço" }],
};

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const itens = NAV_ITENS[usuario?.perfil] || [];

  return (
    <>
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
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <div className="container">{children}</div>
    </>
  );
}
