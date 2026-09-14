import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatarDataCurta } from "../utils/format.js";

export default function FiscalHistorico() {
  const [ordens, setOrdens] = useState(null);
  const { mostrarErro } = useToast();

  const carregar = useCallback(async () => {
    try {
      setOrdens(await api.listarOSFiscalHistorico());
    } catch (erro) {
      mostrarErro(erro);
      setOrdens([]);
    }
  }, [mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <>
      <div className="flex-entre mb-16">
        <h2>Histórico de Fiscalizações</h2>
      </div>

      {ordens === null && <div className="carregando">Carregando...</div>}

      {ordens && ordens.length === 0 && (
        <div className="card tabela-vazia">Nenhuma OS fiscalizada até o momento.</div>
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
                  Pedreiro: {os.pedreiroAtual?.nome || "—"} · Gerente: {os.gerenteCriador?.nome || "—"} · {formatarDataCurta(os.createdAt)}
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
              <Link to={`/os/${os._id}`} className="btn btn-ghost btn-sm">
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
    </>
  );
}
