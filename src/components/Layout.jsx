import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { desativarModoDemo, modoDemoAtivo } from "../api/client.js";
import Icone from "./Icone.jsx";

const NAV_ITENS = {
  GERENTE: [
    { to: "/gerente", label: "Ordens de Serviço", icone: "ordens", fim: true },
    { to: "/gerente/kanban", label: "Kanban", icone: "kanban" },
    { to: "/gerente/nova", label: "Nova OS", icone: "nova" },
    { to: "/gerente/usuarios", label: "Usuários", icone: "usuarios" },
  ],
  FISCAL: [
    { to: "/fiscal", label: "Pendentes de Fiscalização", icone: "pendentes", fim: true },
    { to: "/fiscal/historico", label: "Histórico", icone: "historico" },
  ],
  PEDREIRO: [{ to: "/pedreiro", label: "Minhas Ordens de Serviço", icone: "ferramenta" }],
};

const CHAVE_RECOLHIDO = "verti_menu_recolhido";

// Preferência do menu lembrada neste navegador (sem quebrar se o storage estiver bloqueado).
function lerRecolhido() {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDO) === "1";
  } catch {
    return false;
  }
}

function salvarRecolhido(valor) {
  try {
    localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
  } catch {
    // sem storage: o menu só não lembra a escolha
  }
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const itens = NAV_ITENS[usuario?.perfil] || [];
  const local = useLocation();

  // Desktop: menu expandido ou recolhido (só ícones). Celular: gaveta que abre por cima.
  const [recolhido, setRecolhido] = useState(lerRecolhido);
  const [gavetaAberta, setGavetaAberta] = useState(false);

  // Fecha a gaveta do celular ao trocar de página.
  useEffect(() => {
    setGavetaAberta(false);
  }, [local.pathname]);

  function alternarRecolhido() {
    setRecolhido((atual) => {
      salvarRecolhido(!atual);
      return !atual;
    });
  }

  function sair() {
    desativarModoDemo();
    logout();
  }

  const iniciais = (usuario?.nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");

  return (
    <div className={"app-shell" + (recolhido ? " menu-recolhido" : "") + (gavetaAberta ? " gaveta-aberta" : "")}>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar-topo">
          <div className="sidebar-marca">
            <span className="sidebar-logo">V</span>
            <span className="sidebar-rotulo sidebar-nome">Verti</span>
          </div>
          <button
            type="button"
            className="sidebar-botao sidebar-recolher"
            onClick={alternarRecolhido}
            title={recolhido ? "Expandir menu" : "Recolher menu"}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!recolhido}
          >
            <Icone nome="recolher" tamanho={18} />
          </button>
          <button
            type="button"
            className="sidebar-botao sidebar-fechar"
            onClick={() => setGavetaAberta(false)}
            aria-label="Fechar menu"
          >
            <Icone nome="fechar" tamanho={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fim}
              title={recolhido ? item.label : undefined}
              className={({ isActive }) => "sidebar-link" + (isActive ? " sidebar-link-ativo" : "")}
            >
              <Icone nome={item.icone} />
              <span className="sidebar-rotulo">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">
          <div className="sidebar-usuario" title={recolhido ? `${usuario?.nome} (${usuario?.perfil})` : undefined}>
            <span className="sidebar-avatar">{iniciais}</span>
            <span className="sidebar-rotulo sidebar-usuario-texto">
              <strong>{usuario?.nome}</strong>
              <small>{usuario?.perfil}</small>
            </span>
          </div>
          <button type="button" className="sidebar-link sidebar-sair" onClick={sair} title={recolhido ? "Sair" : undefined}>
            <Icone nome="sair" />
            <span className="sidebar-rotulo">Sair</span>
          </button>
        </div>
      </aside>

      <div className="sidebar-fundo" onClick={() => setGavetaAberta(false)} aria-hidden="true" />

      <div className="app-conteudo">
        {modoDemoAtivo() && (
          <div className="faixa-demo">Modo demonstração — dados fictícios, sem backend real</div>
        )}
        <header className="topbar-celular">
          <button type="button" className="sidebar-botao" onClick={() => setGavetaAberta(true)} aria-label="Abrir menu">
            <Icone nome="menu" />
          </button>
          <span className="topbar-celular-marca">Verti</span>
        </header>
        <main className="container">{children}</main>
      </div>
    </div>
  );
}
