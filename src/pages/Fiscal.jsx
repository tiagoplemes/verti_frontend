import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Fiscal() {
  const [ordens, setOrdens] = useState(null);
  const { mostrarToast, mostrarErro } = useToast();
  const confirmar = useConfirm();

  const carregar = useCallback(async () => {
    try {
      setOrdens(await api.listarOSFiscal());
    } catch (erro) {
      mostrarErro(erro);
      setOrdens([]);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aprovar(id) {
    const ok = await confirmar({ titulo: "Aprovar OS", mensagem: "A OS será marcada como finalizada. Deseja continuar?", textoConfirmar: "Aprovar" });
    if (!ok) return;
    try {
      await api.aprovarOS(id);
      mostrarToast("OS aprovada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function reprovar(id) {
    const resultado = await confirmar({
      titulo: "Reprovar OS",
      mensagem: "Descreva o que precisa ser corrigido. A OS voltará para o pedreiro.",
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

  return (
    <>
      <div className="flex-entre mb-16">
        <h2>Ordens Aguardando Fiscalização</h2>
      </div>

      {ordens === null && <div className="carregando">Carregando...</div>}

      {ordens && ordens.length === 0 && (
        <div className="card tabela-vazia">Nenhuma ordem aguardando fiscalização.</div>
      )}

      {ordens &&
        ordens.map((os) => (
          <div className="card" key={os._id}>
            <div className="flex-entre">
              <div>
                <h3 className="card-titulo">
                  <Link to={`/os/${os._id}`}>{os.titulo}</Link>
                </h3>
                <div className="texto-suave texto-pequeno">
                  Pedreiro: {os.pedreiroAtual?.nome || "—"} · Gerente: {os.gerenteCriador?.nome || "—"}
                </div>
              </div>
              <StatusBadge status={os.status} />
            </div>
            <p className="mt-16">{os.descricao}</p>
            {os.observacaoConclusaoPedreiro && (
              <p className="texto-pequeno">
                <strong>Observação do pedreiro:</strong> {os.observacaoConclusaoPedreiro}
              </p>
            )}
            <div className="flex gap-8 mt-16">
              <button className="btn btn-sucesso btn-sm" onClick={() => aprovar(os._id)}>
                Aprovar
              </button>
              <button className="btn btn-perigo btn-sm" onClick={() => reprovar(os._id)}>
                Reprovar
              </button>
              <Link to={`/os/${os._id}`} className="btn btn-ghost btn-sm">
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
    </>
  );
}
