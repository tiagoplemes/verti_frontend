exigirAutenticacao(["GERENTE"]);
montarLayout("gerente-usuarios.html");

const areaTabela = document.getElementById("area-tabela");
const modal = document.getElementById("modal-usuario");

document.getElementById("form-filtros").addEventListener("submit", (e) => {
  e.preventDefault();
  carregar();
});

function coletarFiltros() {
  const filtros = {};

  const nome = document.getElementById("filtro-nome").value.trim();
  if (nome) filtros.nome = nome;

  const perfil = document.getElementById("filtro-perfil").value;
  if (perfil) filtros.perfil = perfil;

  const ativo = document.getElementById("filtro-ativo").value;
  if (ativo) filtros.ativo = ativo;

  return filtros;
}

async function carregar() {
  areaTabela.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const usuarios = await api.listarUsuarios(coletarFiltros());
    renderizarTabela(usuarios);
  } catch (erro) {
    mostrarErro(erro);
    areaTabela.innerHTML = '<div class="tabela-vazia">Não foi possível carregar os usuários.</div>';
  }
}

const PERFIL_LABEL = { GERENTE: "Gerente", FISCAL: "Fiscal", PEDREIRO: "Pedreiro" };

function renderizarTabela(usuarios) {
  if (!usuarios.length) {
    areaTabela.innerHTML = '<div class="card tabela-vazia">Nenhum usuário encontrado.</div>';
    return;
  }

  const linhas = usuarios
    .map(
      (u) => `
        <tr>
          <td>${escapeHtml(u.nome)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.telefone || "—")}</td>
          <td>${PERFIL_LABEL[u.perfil] || u.perfil}</td>
          <td><span class="badge ${u.ativo ? "badge-verde" : "badge-neutro"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
          <td class="flex gap-8">
            <button class="btn btn-ghost btn-sm" data-acao="editar" data-id="${u._id}">Editar</button>
            <button class="btn ${u.ativo ? "btn-perigo" : "btn-sucesso"} btn-sm" data-acao="${u.ativo ? "desativar" : "ativar"}" data-id="${u._id}">
              ${u.ativo ? "Desativar" : "Ativar"}
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  areaTabela.innerHTML = `
    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;

  areaTabela.querySelectorAll("button[data-acao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const acao = btn.dataset.acao;
      if (acao === "editar") abrirModalEdicao(id, usuarios.find((u) => u._id === id));
      if (acao === "ativar") mudarSituacao(id, true);
      if (acao === "desativar") mudarSituacao(id, false);
    });
  });
}

async function mudarSituacao(id, ativar) {
  const confirmado = await abrirModalConfirmacao({
    titulo: ativar ? "Ativar usuário" : "Desativar usuário",
    mensagem: ativar ? "Este usuário voltará a ter acesso ao sistema." : "Este usuário perderá o acesso ao sistema.",
    textoConfirmar: ativar ? "Ativar" : "Desativar",
  });
  if (!confirmado) return;

  try {
    if (ativar) await api.ativarUsuario(id);
    else await api.desativarUsuario(id);
    mostrarToast("Situação atualizada.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function abrirModalNovo() {
  document.getElementById("modal-usuario-titulo").textContent = "Novo usuário";
  document.getElementById("usuario-id").value = "";
  document.getElementById("usuario-nome").value = "";
  document.getElementById("usuario-email").value = "";
  document.getElementById("usuario-telefone").value = "";
  document.getElementById("usuario-perfil").value = "PEDREIRO";
  document.getElementById("usuario-senha").value = "";
  document.getElementById("usuario-senha").required = true;
  document.getElementById("dica-senha").style.display = "none";
  modal.style.display = "flex";
}

function abrirModalEdicao(id, usuario) {
  document.getElementById("modal-usuario-titulo").textContent = "Editar usuário";
  document.getElementById("usuario-id").value = id;
  document.getElementById("usuario-nome").value = usuario.nome;
  document.getElementById("usuario-email").value = usuario.email;
  document.getElementById("usuario-telefone").value = usuario.telefone || "";
  document.getElementById("usuario-perfil").value = usuario.perfil;
  document.getElementById("usuario-senha").value = "";
  document.getElementById("usuario-senha").required = false;
  document.getElementById("dica-senha").style.display = "block";
  modal.style.display = "flex";
}

function fecharModal() {
  modal.style.display = "none";
}

document.getElementById("btn-novo-usuario").addEventListener("click", abrirModalNovo);
document.getElementById("btn-cancelar-usuario").addEventListener("click", fecharModal);
modal.addEventListener("click", (e) => { if (e.target === modal) fecharModal(); });

document.getElementById("form-usuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("usuario-id").value;
  const dados = {
    nome: document.getElementById("usuario-nome").value.trim(),
    email: document.getElementById("usuario-email").value.trim(),
    telefone: document.getElementById("usuario-telefone").value.trim(),
    perfil: document.getElementById("usuario-perfil").value,
  };

  const senha = document.getElementById("usuario-senha").value;
  if (senha) dados.senha = senha;

  const botao = document.getElementById("btn-salvar-usuario");
  botao.disabled = true;

  try {
    if (id) {
      await api.editarUsuario(id, dados);
      mostrarToast("Usuário atualizado.");
    } else {
      await api.criarUsuario(dados);
      mostrarToast("Usuário criado.");
    }
    fecharModal();
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    botao.disabled = false;
  }
});

carregar();
