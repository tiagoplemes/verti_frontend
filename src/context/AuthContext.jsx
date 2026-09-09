import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { registrarAoDeslogar } from "../api/client.js";

const TOKEN_KEY = "verti_token";
const USER_KEY = "verti_user";

const AuthContext = createContext(null);

// Página de destino padrão de cada perfil após login.
export function paginaInicialDoPerfil(perfil) {
  if (perfil === "GERENTE") return "/gerente";
  if (perfil === "FISCAL") return "/fiscal";
  if (perfil === "PEDREIRO") return "/pedreiro";
  return "/login";
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  function login(novoToken, novoUsuario) {
    localStorage.setItem(TOKEN_KEY, novoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(novoUsuario));
    setToken(novoToken);
    setUsuario(novoUsuario);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUsuario(null);
  }

  // Deixa a camada de API disparar o logout num 401, sem depender de import circular.
  useEffect(() => {
    registrarAoDeslogar(logout);
  }, []);

  const value = useMemo(() => ({ usuario, token, login, logout }), [usuario, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return contexto;
}
