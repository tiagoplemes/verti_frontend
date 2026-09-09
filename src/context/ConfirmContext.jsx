import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useToast } from "./ToastContext.jsx";

const ConfirmContext = createContext(null);

// Modal de confirmação com campo de observação opcional, resolvido via Promise.
export function ConfirmProvider({ children }) {
  const [pedido, setPedido] = useState(null);
  const [observacao, setObservacao] = useState("");
  const resolverRef = useRef(null);
  const { mostrarToast } = useToast();

  const confirmar = useCallback((opcoes) => {
    setPedido(opcoes);
    setObservacao("");
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function fechar(resultado) {
    setPedido(null);
    if (resolverRef.current) {
      resolverRef.current(resultado);
      resolverRef.current = null;
    }
  }

  function confirmarClique() {
    if (pedido?.pedirObservacao && pedido?.obrigatorioObservacao && !observacao.trim()) {
      mostrarToast("A observação é obrigatória.", "erro");
      return;
    }
    fechar({ observacao: observacao.trim() });
  }

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}
      {pedido && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && fechar(null)}>
          <div className="modal">
            <h3>{pedido.titulo}</h3>
            <p>{pedido.mensagem}</p>
            {pedido.pedirObservacao && (
              <textarea
                className="input"
                rows={3}
                placeholder={`Observação${pedido.obrigatorioObservacao ? "" : " (opcional)"}`}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                autoFocus
              />
            )}
            <div className="modal-acoes">
              <button className="btn btn-ghost" onClick={() => fechar(null)}>
                Cancelar
              </button>
              <button className="btn btn-primario" onClick={confirmarClique}>
                {pedido.textoConfirmar || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>.");
  return contexto.confirmar;
}
