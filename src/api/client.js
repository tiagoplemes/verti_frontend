// Wrapper único para chamadas à API. Trata token, JSON, erros e upload de arquivo.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const TOKEN_KEY = "verti_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Callback registrado pelo AuthContext para reagir a um 401 global (fazer logout).
let aoDeslogar = () => {};
export function registrarAoDeslogar(fn) {
  aoDeslogar = fn;
}

async function apiFetch(caminho, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) headers["Authorization"] = "Bearer " + token;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  let resposta;
  try {
    resposta = await fetch(API_BASE_URL + caminho, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (erroDeRede) {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando em " + API_BASE_URL,
      0
    );
  }

  if (resposta.status === 401) {
    aoDeslogar();
    throw new ApiError("Sessão expirada. Faça login novamente.", 401);
  }

  const contentType = resposta.headers.get("content-type") || "";
  const dados = contentType.includes("application/json") ? await resposta.json() : null;

  if (!resposta.ok) {
    throw new ApiError((dados && dados.message) || "Erro na requisição.", resposta.status);
  }

  return dados;
}

export const api = {
  login: (email, senha) => apiFetch("/auth/login", { method: "POST", body: { email, senha } }),
  me: () => apiFetch("/auth/me"),

  // Usuários (GERENTE)
  listarUsuarios: (filtros = {}) => apiFetch("/users?" + new URLSearchParams(filtros).toString()),
  buscarUsuario: (id) => apiFetch("/users/" + id),
  criarUsuario: (dados) => apiFetch("/users", { method: "POST", body: dados }),
  editarUsuario: (id, dados) => apiFetch("/users/" + id, { method: "PUT", body: dados }),
  ativarUsuario: (id) => apiFetch("/users/" + id + "/ativar", { method: "PATCH" }),
  desativarUsuario: (id) => apiFetch("/users/" + id + "/desativar", { method: "PATCH" }),

  // OS - Pedreiro
  listarMinhasOS: () => apiFetch("/os/minhas"),
  aceitarOS: (id) => apiFetch("/os/" + id + "/aceitar", { method: "PATCH" }),
  recusarOS: (id) => apiFetch("/os/" + id + "/recusar", { method: "PATCH" }),
  concluirOS: (id, observacao) => apiFetch("/os/" + id + "/concluir", { method: "PATCH", body: { observacao } }),

  // OS - Fiscal
  listarOSFiscal: () => apiFetch("/os/fiscal"),
  aprovarOS: (id) => apiFetch("/os/" + id + "/aprovar", { method: "PATCH" }),
  reprovarOS: (id, observacao) => apiFetch("/os/" + id + "/reprovar", { method: "PATCH", body: { observacao } }),

  // OS - Gerente
  criarOS: (dados) => apiFetch("/os", { method: "POST", body: dados }),
  listarOSFinalizadas: () => apiFetch("/os/finalizadas"),
  listarOSGerente: (filtros = {}) => apiFetch("/os/listOsGerente?" + new URLSearchParams(filtros).toString()),
  editarOS: (id, dados) => apiFetch("/os/editar/" + id, { method: "PUT", body: dados }),
  cancelarOS: (id) => apiFetch("/os/cancelar/" + id, { method: "PATCH" }),

  // OS - compartilhado
  buscarOSDetalhada: (id) => apiFetch("/os/detalhada/" + id),
  anexarArquivo: (id, arquivo) => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    return apiFetch("/os/" + id + "/anexo", { method: "POST", body: formData, isFormData: true });
  },
  excluirAnexo: (id, idAnexo) => apiFetch("/os/" + id + "/anexo/" + idAnexo, { method: "DELETE" }),
};
