import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, API_BASE_URL } from "../api/client.js";
import { useAuth, paginaInicialDoPerfil } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatarData, formatarDataCurta, formatarMoeda } from "../utils/format.js";

function enderecoTexto(endereco) {
  if (!endereco) return "—";
  const partes = [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado].filter(Boolean);
  return partes.length ? partes.join(", ") : "—";
}

function ehId(campoPopulado, id) {
  return campoPopulado && campoPopulado._id === id;
}

export default function OsDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { mostrarToast, mostrarErro } = useToast();
  const confirmar = useConfirm();
  const navegar = useNavigate();

  const [ordem, setOrdem] = useState(null);
  const [edicao, setEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.buscarOSDetalhada(id);
      setOrdem(dados);
      setEdicao({ titulo: dados.titulo, descricao: dados.descricao, valor: dados.valor || 0 });
    } catch (erro) {
      mostrarErro(erro);
      setOrdem(false);
    }
  }, [id, mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (ordem === null) return <div className="carregando">Carregando...</div>;
  if (ordem === false) return <div className="card tabela-vazia">Não foi possível carregar a OS.</div>;

  const ehGerenteDono = ehId(ordem.gerenteCriador, usuario.id) && usuario.perfil === "GERENTE";
  const ehFiscalDono = ehId(ordem.fiscalResponsavel, usuario.id) && usuario.perfil === "FISCAL";
  const ehPedreiroDono = ehId(ordem.pedreiroAtual, usuario.id) && usuario.perfil === "PEDREIRO";
  const podeAnexar = ehGerenteDono || ehFiscalDono || ehPedreiroDono;

  async function aceitar() {
    const ok = await confirmar({ titulo: "Aceitar OS", mensagem: "Deseja aceitar esta ordem de serviço?", textoConfirmar: "Aceitar" });
    if (!ok) return;
    try {
      await api.aceitarOS(id);
      mostrarToast("OS aceita.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function recusar() {
    const ok = await confirmar({
      titulo: "Recusar OS",
      mensagem: "A OS será passada para o próximo pedreiro da fila. Deseja continuar?",
      textoConfirmar: "Recusar",
    });
    if (!ok) return;
    try {
      await api.recusarOS(id);
      mostrarToast("OS recusada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function concluir() {
    const resultado = await confirmar({
      titulo: "Concluir OS",
      mensagem: "Descreva o que foi realizado.",
      pedirObservacao: true,
      textoConfirmar: "Concluir",
    });
    if (!resultado) return;
    try {
      await api.concluirOS(id, resultado.observacao);
      mostrarToast("OS enviada para fiscalização.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function aprovar() {
    const ok = await confirmar({ titulo: "Aprovar OS", mensagem: "A OS será marcada como finalizada.", textoConfirmar: "Aprovar" });
    if (!ok) return;
    try {
      await api.aprovarOS(id);
      mostrarToast("OS aprovada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function reprovar() {
    const resultado = await confirmar({
      titulo: "Reprovar OS",
      mensagem: "Descreva o que precisa ser corrigido.",
      pedirObservacao: true,
      obrigatorioObservacao: true,
      textoConfirmar: "Reprovar",
    });
    if (!resultado) return;
    try {
      await api.reprovarOS(id, resultado.observacao);
      mostrarToast("OS reprovada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function cancelar() {
    const ok = await confirmar({
      titulo: "Cancelar OS",
      mensagem: "Esta ação não pode ser desfeita. Deseja continuar?",
      textoConfirmar: "Cancelar OS",
    });
    if (!ok) return;
    try {
      await api.cancelarOS(id);
      mostrarToast("OS cancelada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function anexar(arquivo) {
    if (!arquivo) return;
    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarToast("Arquivo excede o limite de 10 MB.", "erro");
      return;
    }
    try {
      await api.anexarArquivo(id, arquivo);
      mostrarToast("Arquivo anexado.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function removerAnexo(idAnexo) {
    const ok = await confirmar({ titulo: "Remover anexo", mensagem: "Esta ação não pode ser desfeita. Deseja continuar?", textoConfirmar: "Remover" });
    if (!ok) return;
    try {
      await api.excluirAnexo(id, idAnexo);
      mostrarToast("Anexo removido.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSalvandoEdicao(true);
    try {
      await api.editarOS(id, {
        titulo: edicao.titulo.trim(),
        descricao: edicao.descricao.trim(),
        valor: Number(edicao.valor) || 0,
      });
      mostrarToast("OS atualizada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const botoesAcao = [];
  if (ehPedreiroDono && ordem.status === "ATRIBUIDA") {
    botoesAcao.push(
      <button key="aceitar" className="btn btn-sucesso" onClick={aceitar}>Aceitar</button>,
      <button key="recusar" className="btn btn-perigo" onClick={recusar}>Recusar</button>
    );
  }
  if (ehPedreiroDono && (ordem.status === "EM_ANDAMENTO" || ordem.status === "REPROVADA")) {
    botoesAcao.push(<button key="concluir" className="btn btn-primario" onClick={concluir}>Concluir OS</button>);
  }
  if (ehFiscalDono && ordem.status === "AGUARDANDO_FISCAL") {
    botoesAcao.push(
      <button key="aprovar" className="btn btn-sucesso" onClick={aprovar}>Aprovar</button>,
      <button key="reprovar" className="btn btn-perigo" onClick={reprovar}>Reprovar</button>
    );
  }
  if (ehGerenteDono && ordem.status !== "FINALIZADA" && ordem.status !== "CANCELADA") {
    botoesAcao.push(<button key="cancelar" className="btn btn-perigo" onClick={cancelar}>Cancelar OS</button>);
  }

  return (
    <>
      <a
        href="#"
        className="texto-pequeno"
        onClick={(e) => {
          e.preventDefault();
          navegar(paginaInicialDoPerfil(usuario.perfil));
        }}
      >
        ← Voltar
      </a>

      <div className="flex-entre mb-16 mt-16">
        <div>
          <h2 style={{ marginBottom: 4 }}>{ordem.titulo}</h2>
          <div className="texto-suave texto-pequeno">Criada em {formatarData(ordem.createdAt)}</div>
        </div>
        <StatusBadge status={ordem.status} />
      </div>

      <div className="card mb-16">
        <h3 className="card-titulo">Descrição</h3>
        <p>{ordem.descricao}</p>
        <div className="linha mt-16">
          <div className="campo" style={{ margin: 0 }}>
            <label>Valor</label>
            <div>{formatarMoeda(ordem.valor)}</div>
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Início previsto</label>
            <div>{formatarDataCurta(ordem.dataInicioPrevista)}</div>
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Fim previsto</label>
            <div>{formatarDataCurta(ordem.dataFimPrevista)}</div>
          </div>
        </div>
        <div className="mt-16">
          <label className="texto-pequeno texto-suave" style={{ fontWeight: 600 }}>Endereço</label>
          <div>{enderecoTexto(ordem.endereco)}</div>
        </div>
      </div>

      <div className="card mb-16">
        <h3 className="card-titulo">Envolvidos</h3>
        <div className="linha">
          <div className="campo" style={{ margin: 0 }}><label>Gerente</label><div>{ordem.gerenteCriador?.nome || "—"}</div></div>
          <div className="campo" style={{ margin: 0 }}><label>Fiscal</label><div>{ordem.fiscalResponsavel?.nome || "—"}</div></div>
          <div className="campo" style={{ margin: 0 }}><label>Pedreiro atual</label><div>{ordem.pedreiroAtual?.nome || "—"}</div></div>
        </div>
        {ordem.observacaoConclusaoPedreiro && (
          <p className="texto-pequeno mt-16"><strong>Observação de conclusão:</strong> {ordem.observacaoConclusaoPedreiro}</p>
        )}
        {ordem.observacaoReprovacaoFiscal && (
          <p className="texto-pequeno" style={{ color: "var(--cor-perigo)" }}>
            <strong>Motivo da reprovação:</strong> {ordem.observacaoReprovacaoFiscal}
          </p>
        )}
      </div>

      <div className="card mb-16">
        <h3 className="card-titulo">Ações</h3>
        {botoesAcao.length ? (
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>{botoesAcao}</div>
        ) : (
          <p className="texto-suave" style={{ margin: 0 }}>Nenhuma ação disponível para esta OS no momento.</p>
        )}
      </div>

      {ehGerenteDono && (
        <div className="card mb-16">
          <h3 className="card-titulo">Editar OS</h3>
          {ordem.status !== "FINALIZADA" ? (
            <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
              Esta OS só pode ser editada depois de finalizada.
            </p>
          ) : (
            <form onSubmit={salvarEdicao}>
              <div className="campo">
                <label htmlFor="editar-titulo">Título</label>
                <input
                  className="input"
                  id="editar-titulo"
                  value={edicao.titulo}
                  onChange={(e) => setEdicao((v) => ({ ...v, titulo: e.target.value }))}
                />
              </div>
              <div className="campo">
                <label htmlFor="editar-descricao">Descrição</label>
                <textarea
                  id="editar-descricao"
                  rows={3}
                  value={edicao.descricao}
                  onChange={(e) => setEdicao((v) => ({ ...v, descricao: e.target.value }))}
                />
              </div>
              <div className="campo">
                <label htmlFor="editar-valor">Valor (R$)</label>
                <input
                  className="input"
                  type="number"
                  id="editar-valor"
                  min="0"
                  step="0.01"
                  value={edicao.valor}
                  onChange={(e) => setEdicao((v) => ({ ...v, valor: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primario btn-sm" disabled={salvandoEdicao}>
                Salvar alterações
              </button>
            </form>
          )}
        </div>
      )}

      <div className="card mb-16">
        <div className="flex-entre">
          <h3 className="card-titulo">Anexos</h3>
          {podeAnexar && (
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
              + Anexar arquivo
              <input type="file" style={{ display: "none" }} onChange={(e) => anexar(e.target.files[0])} />
            </label>
          )}
        </div>
        {ordem.anexos?.length ? (
          <div className="mt-16" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ordem.anexos.map((a) => (
              <div key={a._id} className="flex-entre" style={{ border: "1px solid var(--cor-borda)", borderRadius: "var(--raio)", padding: "8px 12px" }}>
                <a href={/^(https?:|blob:)/.test(a.url) ? a.url : API_BASE_URL + a.url} target="_blank" rel="noopener noreferrer">
                  {a.nome || a.url.split("/").pop()}
                </a>
                {podeAnexar && (
                  <button className="btn btn-perigo btn-sm" onClick={() => removerAnexo(a._id)}>Remover</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="texto-suave mt-16">Nenhum anexo enviado.</p>
        )}
      </div>

      <div className="card">
        <h3 className="card-titulo">Histórico</h3>
        {ordem.historico?.length ? (
          [...ordem.historico].reverse().map((h, indice) => (
            <div className="historico-item" key={indice}>
              <div>
                <strong>{h.acao}</strong> — {h.usuario?.nome || "Sistema"} {h.usuario?.perfil ? `(${h.usuario.perfil})` : ""}
              </div>
              {h.observacao && <div className="texto-pequeno texto-suave">{h.observacao}</div>}
              <div className="texto-pequeno texto-suave">{formatarData(h.data)}</div>
            </div>
          ))
        ) : (
          <p className="texto-suave">Sem eventos registrados.</p>
        )}
      </div>
    </>
  );
}
