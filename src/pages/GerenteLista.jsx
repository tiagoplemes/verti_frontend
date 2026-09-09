import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatarDataCurta, formatarMoeda } from "../utils/format.js";

const STATUS_OPCOES = [
  ["", "Todos"],
  ["ATRIBUIDA", "Atribuída"],
  ["EM_ANDAMENTO", "Em andamento"],
  ["AGUARDANDO_FISCAL", "Aguardando fiscal"],
  ["FINALIZADA", "Finalizada"],
  ["SEM_PEDREIRO", "Sem pedreiro"],
  ["CANCELADA", "Cancelada"],
];

export default function GerenteLista() {
  const { mostrarErro } = useToast();

  const [filtrosForm, setFiltrosForm] = useState({ titulo: "", status: "", dataInicio: "", dataFim: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState(null);

  const carregar = useCallback(async () => {
    setResultado(null);
    const filtros = { pagina, limite: 10, ...filtrosAplicados };
    try {
      setResultado(await api.listarOSGerente(filtros));
    } catch (erro) {
      mostrarErro(erro);
      setResultado({ ordens: [], total: 0, pagina: 1, totalPaginas: 1 });
    }
  }, [pagina, filtrosAplicados, mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function filtrar(e) {
    e.preventDefault();
    const filtros = {};
    if (filtrosForm.titulo.trim()) filtros.titulo = filtrosForm.titulo.trim();
    if (filtrosForm.status) filtros.status = filtrosForm.status;
    if (filtrosForm.dataInicio) filtros.dataInicio = filtrosForm.dataInicio;
    if (filtrosForm.dataFim) filtros.dataFim = filtrosForm.dataFim;
    setPagina(1);
    setFiltrosAplicados(filtros);
  }

  return (
    <>
      <div className="flex-entre mb-16">
        <h2>Ordens de Serviço</h2>
        <Link to="/gerente/nova" className="btn btn-primario">
          + Nova OS
        </Link>
      </div>

      <div className="card mb-16">
        <form className="linha" style={{ alignItems: "flex-end" }} onSubmit={filtrar}>
          <div className="campo">
            <label htmlFor="filtro-titulo">Título</label>
            <input
              className="input"
              id="filtro-titulo"
              placeholder="Buscar por título"
              value={filtrosForm.titulo}
              onChange={(e) => setFiltrosForm((f) => ({ ...f, titulo: e.target.value }))}
            />
          </div>
          <div className="campo">
            <label htmlFor="filtro-status">Status</label>
            <select
              id="filtro-status"
              value={filtrosForm.status}
              onChange={(e) => setFiltrosForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUS_OPCOES.map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="filtro-data-inicio">De</label>
            <input
              className="input"
              type="date"
              id="filtro-data-inicio"
              value={filtrosForm.dataInicio}
              onChange={(e) => setFiltrosForm((f) => ({ ...f, dataInicio: e.target.value }))}
            />
          </div>
          <div className="campo">
            <label htmlFor="filtro-data-fim">Até</label>
            <input
              className="input"
              type="date"
              id="filtro-data-fim"
              value={filtrosForm.dataFim}
              onChange={(e) => setFiltrosForm((f) => ({ ...f, dataFim: e.target.value }))}
            />
          </div>
          <div className="campo" style={{ flex: 0 }}>
            <button type="submit" className="btn btn-ghost">
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {!resultado && <div className="carregando">Carregando...</div>}

      {resultado && resultado.ordens.length === 0 && (
        <div className="card tabela-vazia">Nenhuma ordem de serviço encontrada.</div>
      )}

      {resultado && resultado.ordens.length > 0 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Pedreiro</th>
                <th>Fiscal</th>
                <th>Valor</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody>
              {resultado.ordens.map((os) => (
                <tr key={os._id}>
                  <td>
                    <Link to={`/os/${os._id}`}>{os.titulo}</Link>
                  </td>
                  <td>
                    <StatusBadge status={os.status} />
                  </td>
                  <td>{os.pedreiroAtual?.nome || "—"}</td>
                  <td>{os.fiscalResponsavel?.nome || "—"}</td>
                  <td>{formatarMoeda(os.valor)}</td>
                  <td>{formatarDataCurta(os.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultado && resultado.totalPaginas > 1 && (
        <div className="paginacao">
          <button className="btn btn-ghost btn-sm" disabled={resultado.pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
            ← Anterior
          </button>
          <span className="texto-suave texto-pequeno">
            Página {resultado.pagina} de {resultado.totalPaginas} ({resultado.total} ordens)
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={resultado.pagina >= resultado.totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}
