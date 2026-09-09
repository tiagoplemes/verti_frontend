// Se já estiver logado, pula direto para a home do perfil.
(function () {
  const usuario = getUsuario();
  if (usuario && getToken()) {
    window.location.href = paginaInicialDoPerfil(usuario.perfil);
  }
})();

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const botao = document.getElementById("btn-entrar");

  botao.disabled = true;
  botao.textContent = "Entrando...";

  try {
    const resposta = await api.login(email, senha);
    salvarSessao(resposta.token, resposta.usuario);
    window.location.href = paginaInicialDoPerfil(resposta.usuario.perfil);
  } catch (erro) {
    mostrarErro(erro);
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});
