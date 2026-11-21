import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import AlternarVisao from "../components/AlternarVisao.jsx";
import { formatarDataCurta, formatarMoeda } from "../utils/format.js";

// Colunas na ordem do fluxo da OS. "cor" é a mesma família de cor dos badges.
const COLUNAS = [
  { status: "ATRIBUIDA", titulo: "Aguardando aceite", cor: "#2347cc" },
  { status: "EM_ANDAMENTO", titulo: "Em andamento", cor: "#d18a0b" },
  { status: "AGUARDANDO_FISCAL", titulo: "Aguardando fiscal", cor: "#6b21c9" },
  { status: "SEM_PEDREIRO", titulo: "Sem pedreiro", cor: "#e0392c" },
  { status: "FINALIZADA", titulo: "Finalizada", cor: "#2e9e48", encerrada: true },
  { status: "CANCELADA", titulo: "Cancelada", cor: "#8a94a6", encerrada: true },
];

// Cada coluna busca até este tanto (máximo aceito pela API); o resto fica na Lista.
const LIMITE_POR_COLUNA = 100;

// O que espera uma ação do gerente aparece destacado no card.
function pendencia(ordem) {
  if (ordem.status === "SEM_PEDREIRO") return "Monte uma nova fila";
  if (ordem.status === "AGUARDANDO_FISCAL" && !ordem.fiscalResponsavel) return "Sem fiscal: aprove você";
  return null;
}

export default function GerenteKanban() {
  const { mostrarErro } = useToast();

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [mostrarEncerradas, setMostrarEncerradas] = useState(true);
  const [colunas, setColunas] = useState(null); // { [status]: { ordens, total } }

  const carregar = useCallback(async () => {
    setColunas(null);
    try {
      const respostas = await Promise.all(
        COLUNAS.map((coluna) => {
          const filtros = { status: coluna.status, limite: LIMITE_POR_COLUNA, pagina: 1 };
          if (buscaAplicada) filtros.titulo = buscaAplicada;
          return api.listarOSGerente(filtros);
        })
      );
      const porStatus = {};
      COLUNAS.forEach((coluna, i) => {
        porStatus[coluna.status] = { ordens: respostas[i].ordens, total: respostas[i].total };
      });
      setColunas(porStatus);
    } catch (erro) {
      mostrarErro(erro);
      setColunas({});
    }
  }, [buscaAplicada, mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Quadro do Kanban: ocupa a tela até o rodapé (barra de rolagem lá embaixo)
  // e aceita Shift + roda do mouse para andar entre as colunas.
  const quadroRef = useRef(null);
  const quadroVisivel = colunas !== null;

  useEffect(() => {
    const quadro = quadroRef.current;
    if (!quadro) return;

    function ajustarAltura() {
      const topo = quadro.getBoundingClientRect().top + window.scrollY;
      const folgaInferior = parseFloat(getComputedStyle(quadro.parentElement).paddingBottom) || 0;
      quadro.style.height = Math.max(360, window.innerHeight - topo - folgaInferior) + "px";
    }

    function rolarComShift(e) {
      if (!e.shiftKey) return;
      // Alguns navegadores já convertem Shift+roda em deltaX; outros mandam deltaY.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      const fator = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? quadro.clientWidth : 1; // linhas/páginas → px
      quadro.scrollLeft += delta * fator;
    }

    ajustarAltura();
    window.addEventListener("resize", ajustarAltura);
    quadro.addEventListener("wheel", rolarComShift, { passive: false });

    // O cabeçalho e os filtros podem mudar de altura (quebra de linha ao recolher o menu, etc.).
    const observador = new ResizeObserver(ajustarAltura);
    let irmao = quadro.previousElementSibling;
    while (irmao) {
      observador.observe(irmao);
      irmao = irmao.previousElementSibling;
    }

    return () => {
      window.removeEventListener("resize", ajustarAltura);
      quadro.removeEventListener("wheel", rolarComShift);
      observador.disconnect();
    };
  }, [quadroVisivel]);

  function buscar(e) {
    e.preventDefault();
    setBuscaAplicada(busca.trim());
  }

  const visiveis = COLUNAS.filter((coluna) => mostrarEncerradas || !coluna.encerrada);

  return (
    <>
      <div className="flex-entre mb-16 cabecalho-pagina">
        <h2>Ordens de Serviço</h2>
        <div className="flex gap-12" style={{ flexWrap: "wrap" }}>
          <AlternarVisao />
          <Link to="/gerente/nova" className="btn btn-primario">
            + Nova OS
          </Link>
        </div>
      </div>

      <div className="card mb-16">
        <form className="linha" style={{ alignItems: "flex-end" }} onSubmit={buscar}>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label htmlFor="kanban-busca">Título</label>
            <input
              className="input"
              id="kanban-busca"
              placeholder="Buscar por título"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <label className="kanban-checkbox">
            <input type="checkbox" checked={mostrarEncerradas} onChange={(e) => setMostrarEncerradas(e.target.checked)} />
            Mostrar finalizadas e canceladas
          </label>
          <div className="campo" style={{ flex: 0, marginBottom: 0 }}>
            <button type="submit" className="btn btn-ghost">
              Buscar
            </button>
          </div>
        </form>
      </div>

      {!colunas && <div className="carregando">Carregando...</div>}

      {colunas && (
        <p className="kanban-dica">
          <kbd>Shift</kbd> + roda do mouse para navegar entre as colunas
        </p>
      )}

      {colunas && (
        <div className="kanban" ref={quadroRef}>
          {visiveis.map((coluna) => {
            const dados = colunas[coluna.status] || { ordens: [], total: 0 };
            return (
              <section key={coluna.status} className="kanban-coluna" style={{ "--cor-coluna": coluna.cor }}>
                <header className="kanban-coluna-topo">
                  <span className="kanban-ponto" />
                  <h3>{coluna.titulo}</h3>
                  <span className="kanban-contador">{dados.total}</span>
                </header>

                <div className="kanban-cards">
                  {dados.ordens.length === 0 && <p className="kanban-vazio">Nenhuma OS</p>}

                  {dados.ordens.map((os) => {
                    const aviso = pendencia(os);
                    return (
                      <Link key={os._id} to={`/os/${os._id}`} className="kanban-card">
                        <strong className="kanban-card-titulo">{os.titulo}</strong>
                        <span className="kanban-card-linha">Pedreiro: {os.pedreiroAtual?.nome || "—"}</span>
                        <span className="kanban-card-linha">Fiscal: {os.fiscalResponsavel?.nome || "sem fiscal"}</span>
                        <span className="kanban-card-rodape">
                          <span>{formatarDataCurta(os.createdAt)}</span>
                          {os.valor > 0 && <span>{formatarMoeda(os.valor)}</span>}
                        </span>
                        {aviso && <span className="kanban-card-aviso">{aviso}</span>}
                      </Link>
                    );
                  })}

                  {dados.total > dados.ordens.length && (
                    <p className="kanban-vazio">
                      Mostrando {dados.ordens.length} de {dados.total}. Veja todas na <Link to="/gerente">Lista</Link>.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
