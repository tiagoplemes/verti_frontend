import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Pedreiro() {
  const [ordens, setOrdens] = useState(null);
  const { mostrarToast, mostrarErro } = useToast();
  const confirmar = useConfirm();

  const carregar = useCallback(async () => {
    try {
      setOrdens(await api.listarMinhasOS());
    } catch (erro) {
      mostrarErro(erro);
      setOrdens([]);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aceitar(id) {
    const ok = await confirmar({ titulo: "Aceitar OS", mensagem: "Deseja aceitar esta ordem de serviço?", textoConfirmar: "Aceitar" });
    if (!ok) return;
    try {
      await api.aceitarOS(id);
      mostrarToast("OS aceita com sucesso.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function recusar(id) {
    const ok = await confirmar({
      titulo: "Recusar OS",
      mensagem: "A OS será passada para o próximo pedreiro da fila (ou marcada como sem pedreiro). Deseja continuar?",
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

  async function concluir(id) {
    const resultado = await confirmar({
      titulo: "Concluir OS",
      mensagem: "Descreva o que foi realizado. A OS será enviada para fiscalização.",
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

  return (
    <>
      <div className="flex-entre mb-16">
        <h2>Minhas Ordens de Serviço</h2>
      </div>

      {ordens === null && <div className="carregando">Carregando...</div>}

      {ordens && ordens.length === 0 && (
        <div className="card tabela-vazia">Você não possui ordens de serviço no momento.</div>
      )}

      {ordens &&
        ordens.map((os) => {
          const podeAceitarRecusar = os.status === "ATRIBUIDA";
          const podeConcluir = os.status === "EM_ANDAMENTO" || os.status === "REPROVADA";

          return (
            <div className="card" key={os._id}>
              <div className="flex-entre">
                <div>
                  <h3 className="card-titulo">
                    <Link to={`/os/${os._id}`}>{os.titulo}</Link>
                  </h3>
                  <div className="texto-suave texto-pequeno">
                    Gerente: {os.gerenteCriador?.nome || "—"} · Fiscal: {os.fiscalResponsavel?.nome || "—"}
                  </div>
                </div>
                <StatusBadge status={os.status} />
              </div>
              <p className="mt-16">{os.descricao}</p>
              {os.observacaoReprovacaoFiscal && (
                <p className="texto-pequeno" style={{ color: "var(--cor-perigo)" }}>
                  <strong>Motivo da reprovação:</strong> {os.observacaoReprovacaoFiscal}
                </p>
              )}
              <div className="flex gap-8 mt-16">
                {podeAceitarRecusar && (
                  <button className="btn btn-sucesso btn-sm" onClick={() => aceitar(os._id)}>
                    Aceitar
                  </button>
                )}
                {podeAceitarRecusar && (
                  <button className="btn btn-perigo btn-sm" onClick={() => recusar(os._id)}>
                    Recusar
                  </button>
                )}
                {podeConcluir && (
                  <button className="btn btn-primario btn-sm" onClick={() => concluir(os._id)}>
                    Concluir
                  </button>
                )}
                <Link to={`/os/${os._id}`} className="btn btn-ghost btn-sm">
                  Ver detalhes
                </Link>
              </div>
            </div>
          );
        })}
    </>
  );
}
