import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
let proximoId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const mostrarToast = useCallback((mensagem, tipo = "sucesso") => {
    const id = proximoId++;
    setToasts((atual) => [...atual, { id, mensagem, tipo, saindo: false }]);

    const timeoutSaida = setTimeout(() => {
      setToasts((atual) => atual.map((t) => (t.id === id ? { ...t, saindo: true } : t)));
    }, 3200);

    const timeoutRemove = setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 3600);

    timers.current.set(id, [timeoutSaida, timeoutRemove]);
  }, []);

  const mostrarErro = useCallback(
    (erro) => mostrarToast(erro?.message || "Ocorreu um erro inesperado.", "erro"),
    [mostrarToast]
  );

  return (
    <ToastContext.Provider value={{ mostrarToast, mostrarErro }}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo} ${t.saindo ? "toast-saindo" : ""}`}>
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return contexto;
}
