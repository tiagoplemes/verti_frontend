import { NavLink } from "react-router-dom";
import Icone from "./Icone.jsx";

// Alterna entre as duas visualizações das Ordens de Serviço do gerente.
export default function AlternarVisao() {
  const classe = ({ isActive }) => "alternar-visao-item" + (isActive ? " ativo" : "");

  return (
    <div className="alternar-visao" role="tablist" aria-label="Visualização">
      <NavLink to="/gerente" end className={classe}>
        <Icone nome="lista" tamanho={16} />
        Lista
      </NavLink>
      <NavLink to="/gerente/kanban" className={classe}>
        <Icone nome="kanban" tamanho={16} />
        Kanban
      </NavLink>
    </div>
  );
}
