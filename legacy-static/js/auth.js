// Gerenciamento de sessão (token JWT + dados do usuário) no localStorage.

const AUTH_TOKEN_KEY = "verti_token";
const AUTH_USER_KEY = "verti_user";

function salvarSessao(token, usuario) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(usuario));
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getUsuario() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.location.href = "index.html";
}

// Página de destino padrão de cada perfil após login.
function paginaInicialDoPerfil(perfil) {
  if (perfil === "GERENTE") return "gerente-lista.html";
  if (perfil === "FISCAL") return "fiscal.html";
  if (perfil === "PEDREIRO") return "pedreiro.html";
  return "index.html";
}

// Chame no topo de toda página protegida. Redireciona para login se não
// houver sessão, ou para a home do perfil se o perfil não for permitido aqui.
function exigirAutenticacao(perfisPermitidos) {
  const token = getToken();
  const usuario = getUsuario();

  if (!token || !usuario) {
    window.location.href = "index.html";
    return null;
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    window.location.href = paginaInicialDoPerfil(usuario.perfil);
    return null;
  }

  return usuario;
}
