// Helpers de UI compartilhados: layout (header/nav), toasts, badges de status, modal e formatação.

const STATUS_LABELS = {
  CRIADA: "Criada",
  ATRIBUIDA: "Atribuída",
  ACEITA: "Aceita",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_FISCAL: "Aguardando fiscal",
  REPROVADA: "Reprovada",
  APROVADA: "Aprovada",
  FINALIZADA: "Finalizada",
  SEM_PEDREIRO: "Sem pedreiro",
  CANCELADA: "Cancelada",
};

const STATUS_CLASSES = {
  CRIADA: "badge-neutro",
  ATRIBUIDA: "badge-azul",
  ACEITA: "badge-azul",
  EM_ANDAMENTO: "badge-ambar",
  AGUARDANDO_FISCAL: "badge-roxo",
  REPROVADA: "badge-vermelho",
  APROVADA: "badge-verde",
  FINALIZADA: "badge-verde",
  SEM_PEDREIRO: "badge-vermelho",
  CANCELADA: "badge-neutro",
};

function badgeStatus(status) {
  const classe = STATUS_CLASSES[status] || "badge-neutro";
  const texto = STATUS_LABELS[status] || status;
  return `<span class="badge ${classe}">${texto}</span>`;
}

function formatarData(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarDataCurta(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// Toast de feedback (sucesso/erro) no canto da tela.
function mostrarToast(mensagem, tipo = "sucesso") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast toast-" + tipo;
  toast.textContent = mensagem;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("toast-saindo"), 3200);
  setTimeout(() => toast.remove(), 3600);
}

function mostrarErro(erro) {
  mostrarToast(erro.message || "Ocorreu um erro inesperado.", "erro");
}

// Monta o cabeçalho + navegação lateral com base no perfil do usuário logado.
const NAV_ITENS = {
  GERENTE: [
    { href: "gerente-lista.html", label: "Ordens de Serviço" },
    { href: "gerente-nova.html", label: "Nova OS" },
    { href: "gerente-usuarios.html", label: "Usuários" },
  ],
  FISCAL: [{ href: "fiscal.html", label: "Pendentes de Fiscalização" }],
  PEDREIRO: [{ href: "pedreiro.html", label: "Minhas Ordens de Serviço" }],
};

function montarLayout(paginaAtiva) {
  const usuario = getUsuario();
  if (!usuario) return;

  const nav = NAV_ITENS[usuario.perfil] || [];
  const navHtml = nav
    .map(
      (item) =>
        `<a href="${item.href}" class="nav-link ${item.href === paginaAtiva ? "nav-link-ativo" : ""}">${item.label}</a>`
    )
    .join("");

  const header = document.createElement("header");
  header.className = "topbar";
  header.innerHTML = `
    <div class="topbar-marca">Verti</div>
    <nav class="topbar-nav">${navHtml}</nav>
    <div class="topbar-usuario">
      <span>${escapeHtml(usuario.nome)}</span>
      <span class="badge badge-neutro">${usuario.perfil}</span>
      <button id="btn-logout" class="btn btn-ghost btn-sm">Sair</button>
    </div>
  `;

  document.body.insertBefore(header, document.body.firstChild);
  document.getElementById("btn-logout").addEventListener("click", logout);
}

// Modal simples de confirmação com campo de observação opcional.
function abrirModalConfirmacao({ titulo, mensagem, pedirObservacao = false, obrigatorioObservacao = false, textoConfirmar = "Confirmar" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${escapeHtml(titulo)}</h3>
        <p>${escapeHtml(mensagem)}</p>
        ${pedirObservacao ? `<textarea id="modal-observacao" class="input" rows="3" placeholder="Observação${obrigatorioObservacao ? "" : " (opcional)"}"></textarea>` : ""}
        <div class="modal-acoes">
          <button class="btn btn-ghost" id="modal-cancelar">Cancelar</button>
          <button class="btn btn-primario" id="modal-confirmar">${escapeHtml(textoConfirmar)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fechar = (resultado) => {
      overlay.remove();
      resolve(resultado);
    };

    overlay.querySelector("#modal-cancelar").addEventListener("click", () => fechar(null));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fechar(null);
    });
    overlay.querySelector("#modal-confirmar").addEventListener("click", () => {
      const observacao = pedirObservacao ? overlay.querySelector("#modal-observacao").value.trim() : "";
      if (pedirObservacao && obrigatorioObservacao && !observacao) {
        mostrarToast("A observação é obrigatória.", "erro");
        return;
      }
      fechar({ observacao });
    });
  });
}
