const usuarioLogado = exigirAutenticacao(["GERENTE", "FISCAL", "PEDREIRO"]);
montarLayout(null);

const params = new URLSearchParams(window.location.search);
const osId = params.get("id");
const conteudoEl = document.getElementById("conteudo");

document.getElementById("link-voltar").addEventListener("click", (e) => {
  e.preventDefault();
  if (document.referrer) window.history.back();
  else window.location.href = paginaInicialDoPerfil(usuarioLogado.perfil);
});

if (!osId) {
  conteudoEl.innerHTML = '<div class="card">OS não informada.</div>';
} else {
  carregar();
}

async function carregar() {
  conteudoEl.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const ordem = await api.buscarOSDetalhada(osId);
    renderizar(ordem);
  } catch (erro) {
    mostrarErro(erro);
    conteudoEl.innerHTML = '<div class="card tabela-vazia">Não foi possível carregar a OS.</div>';
  }
}

function ehId(campoPopulado, id) {
  return campoPopulado && campoPopulado._id === id;
}

function renderizar(ordem) {
  const ehGerenteDono = ehId(ordem.gerenteCriador, usuarioLogado.id) && usuarioLogado.perfil === "GERENTE";
  const ehFiscalDono = ehId(ordem.fiscalResponsavel, usuarioLogado.id) && usuarioLogado.perfil === "FISCAL";
  const ehPedreiroDono = ehId(ordem.pedreiroAtual, usuarioLogado.id) && usuarioLogado.perfil === "PEDREIRO";

  const podeAnexar = ehGerenteDono || ehFiscalDono || ehPedreiroDono;

  conteudoEl.innerHTML = `
    <div class="flex-entre mb-16">
      <div>
        <h2 style="margin-bottom:4px;">${escapeHtml(ordem.titulo)}</h2>
        <div class="texto-suave texto-pequeno">Criada em ${formatarData(ordem.createdAt)}</div>
      </div>
      ${badgeStatus(ordem.status)}
    </div>

    <div class="card mb-16">
      <h3 class="card-titulo">Descrição</h3>
      <p>${escapeHtml(ordem.descricao)}</p>

      <div class="linha mt-16">
        <div class="campo" style="margin:0;">
          <label>Valor</label>
          <div>${formatarMoeda(ordem.valor)}</div>
        </div>
        <div class="campo" style="margin:0;">
          <label>Início previsto</label>
          <div>${formatarDataCurta(ordem.dataInicioPrevista)}</div>
        </div>
        <div class="campo" style="margin:0;">
          <label>Fim previsto</label>
          <div>${formatarDataCurta(ordem.dataFimPrevista)}</div>
        </div>
      </div>

      <div class="mt-16">
        <label class="texto-pequeno texto-suave" style="font-weight:600;">Endereço</label>
        <div>${enderecoTexto(ordem.endereco)}</div>
      </div>
    </div>

    <div class="card mb-16">
      <h3 class="card-titulo">Envolvidos</h3>
      <div class="linha">
        <div class="campo" style="margin:0;"><label>Gerente</label><div>${escapeHtml(ordem.gerenteCriador?.nome || "—")}</div></div>
        <div class="campo" style="margin:0;"><label>Fiscal</label><div>${escapeHtml(ordem.fiscalResponsavel?.nome || "—")}</div></div>
        <div class="campo" style="margin:0;"><label>Pedreiro atual</label><div>${escapeHtml(ordem.pedreiroAtual?.nome || "—")}</div></div>
      </div>
      ${ordem.observacaoConclusaoPedreiro ? `<p class="texto-pequeno mt-16"><strong>Observação de conclusão:</strong> ${escapeHtml(ordem.observacaoConclusaoPedreiro)}</p>` : ""}
      ${ordem.observacaoReprovacaoFiscal ? `<p class="texto-pequeno" style="color:var(--cor-perigo)"><strong>Motivo da reprovação:</strong> ${escapeHtml(ordem.observacaoReprovacaoFiscal)}</p>` : ""}
    </div>

    <div class="card mb-16" id="area-acoes"></div>

    ${ehGerenteDono ? `<div class="card mb-16" id="area-edicao"></div>` : ""}

    <div class="card mb-16">
      <div class="flex-entre">
        <h3 class="card-titulo">Anexos</h3>
        ${podeAnexar ? '<input type="file" id="input-anexo" style="display:none;" />' : ""}
        ${podeAnexar ? '<button class="btn btn-ghost btn-sm" id="btn-anexar">+ Anexar arquivo</button>' : ""}
      </div>
      <div id="lista-anexos">${listaAnexosHtml(ordem, podeAnexar)}</div>
    </div>

    <div class="card">
      <h3 class="card-titulo">Histórico</h3>
      <div>${historicoHtml(ordem.historico)}</div>
    </div>
  `;

  renderizarAcoes(ordem, { ehGerenteDono, ehFiscalDono, ehPedreiroDono });

  if (ehGerenteDono) renderizarEdicao(ordem);

  if (podeAnexar) {
    document.getElementById("btn-anexar").addEventListener("click", () => document.getElementById("input-anexo").click());
    document.getElementById("input-anexo").addEventListener("change", (e) => anexarArquivo(e.target.files[0]));
  }

  document.querySelectorAll("[data-remover-anexo]").forEach((btn) => {
    btn.addEventListener("click", () => removerAnexo(btn.dataset.removerAnexo));
  });
}

function enderecoTexto(endereco) {
  if (!endereco) return "—";
  const partes = [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado].filter(Boolean);
  return partes.length ? escapeHtml(partes.join(", ")) : "—";
}

function historicoHtml(historico) {
  if (!historico || !historico.length) return '<p class="texto-suave">Sem eventos registrados.</p>';

  return historico
    .slice()
    .reverse()
    .map(
      (h) => `
        <div class="historico-item">
          <div><strong>${escapeHtml(h.acao)}</strong> — ${escapeHtml(h.usuario?.nome || "Sistema")} ${h.usuario?.perfil ? "(" + h.usuario.perfil + ")" : ""}</div>
          ${h.observacao ? `<div class="texto-pequeno texto-suave">${escapeHtml(h.observacao)}</div>` : ""}
          <div class="texto-pequeno texto-suave">${formatarData(h.data)}</div>
        </div>
      `
    )
    .join("");
}

function listaAnexosHtml(ordem, podeRemover) {
  if (!ordem.anexos || !ordem.anexos.length) return '<p class="texto-suave mt-16">Nenhum anexo enviado.</p>';

  return (
    '<div class="mt-16" style="display:flex;flex-direction:column;gap:8px;">' +
    ordem.anexos
      .map(
        (a) => `
          <div class="flex-entre" style="border:1px solid var(--cor-borda);border-radius:var(--raio);padding:8px 12px;">
            <a href="${API_BASE_URL}${a.url}" target="_blank" rel="noopener">${escapeHtml(a.url.split("/").pop())}</a>
            ${podeRemover ? `<button class="btn btn-perigo btn-sm" data-remover-anexo="${a._id}">Remover</button>` : ""}
          </div>
        `
      )
      .join("") +
    "</div>"
  );
}

async function anexarArquivo(arquivo) {
  if (!arquivo) return;

  if (arquivo.size > 10 * 1024 * 1024) {
    mostrarToast("Arquivo excede o limite de 10 MB.", "erro");
    return;
  }

  try {
    await api.anexarArquivo(osId, arquivo);
    mostrarToast("Arquivo anexado.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function removerAnexo(idAnexo) {
  const confirmado = await abrirModalConfirmacao({
    titulo: "Remover anexo",
    mensagem: "Esta ação não pode ser desfeita. Deseja continuar?",
    textoConfirmar: "Remover",
  });
  if (!confirmado) return;

  try {
    await api.excluirAnexo(osId, idAnexo);
    mostrarToast("Anexo removido.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function renderizarAcoes(ordem, { ehGerenteDono, ehFiscalDono, ehPedreiroDono }) {
  const area = document.getElementById("area-acoes");
  const botoes = [];

  if (ehPedreiroDono && ordem.status === "ATRIBUIDA") {
    botoes.push('<button class="btn btn-sucesso" id="btn-aceitar">Aceitar</button>');
    botoes.push('<button class="btn btn-perigo" id="btn-recusar">Recusar</button>');
  }

  if (ehPedreiroDono && (ordem.status === "EM_ANDAMENTO" || ordem.status === "REPROVADA")) {
    botoes.push('<button class="btn btn-primario" id="btn-concluir">Concluir OS</button>');
  }

  if (ehFiscalDono && ordem.status === "AGUARDANDO_FISCAL") {
    botoes.push('<button class="btn btn-sucesso" id="btn-aprovar">Aprovar</button>');
    botoes.push('<button class="btn btn-perigo" id="btn-reprovar">Reprovar</button>');
  }

  if (ehGerenteDono && ordem.status !== "FINALIZADA" && ordem.status !== "CANCELADA") {
    botoes.push('<button class="btn btn-perigo" id="btn-cancelar">Cancelar OS</button>');
  }

  if (!botoes.length) {
    area.innerHTML = '<p class="texto-suave" style="margin:0;">Nenhuma ação disponível para esta OS no momento.</p>';
    return;
  }

  area.innerHTML = `<h3 class="card-titulo">Ações</h3><div class="flex gap-8" style="flex-wrap:wrap;">${botoes.join("")}</div>`;

  const ligar = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  };

  ligar("btn-aceitar", async () => {
    const confirmado = await abrirModalConfirmacao({ titulo: "Aceitar OS", mensagem: "Deseja aceitar esta ordem de serviço?", textoConfirmar: "Aceitar" });
    if (!confirmado) return;
    try { await api.aceitarOS(osId); mostrarToast("OS aceita."); carregar(); } catch (e) { mostrarErro(e); }
  });

  ligar("btn-recusar", async () => {
    const confirmado = await abrirModalConfirmacao({ titulo: "Recusar OS", mensagem: "A OS será passada para o próximo pedreiro da fila. Deseja continuar?", textoConfirmar: "Recusar" });
    if (!confirmado) return;
    try { await api.recusarOS(osId); mostrarToast("OS recusada."); carregar(); } catch (e) { mostrarErro(e); }
  });

  ligar("btn-concluir", async () => {
    const resultado = await abrirModalConfirmacao({ titulo: "Concluir OS", mensagem: "Descreva o que foi realizado.", pedirObservacao: true, textoConfirmar: "Concluir" });
    if (!resultado) return;
    try { await api.concluirOS(osId, resultado.observacao); mostrarToast("OS enviada para fiscalização."); carregar(); } catch (e) { mostrarErro(e); }
  });

  ligar("btn-aprovar", async () => {
    const confirmado = await abrirModalConfirmacao({ titulo: "Aprovar OS", mensagem: "A OS será marcada como finalizada.", textoConfirmar: "Aprovar" });
    if (!confirmado) return;
    try { await api.aprovarOS(osId); mostrarToast("OS aprovada."); carregar(); } catch (e) { mostrarErro(e); }
  });

  ligar("btn-reprovar", async () => {
    const resultado = await abrirModalConfirmacao({ titulo: "Reprovar OS", mensagem: "Descreva o que precisa ser corrigido.", pedirObservacao: true, obrigatorioObservacao: true, textoConfirmar: "Reprovar" });
    if (!resultado) return;
    try { await api.reprovarOS(osId, resultado.observacao); mostrarToast("OS reprovada."); carregar(); } catch (e) { mostrarErro(e); }
  });

  ligar("btn-cancelar", async () => {
    const confirmado = await abrirModalConfirmacao({ titulo: "Cancelar OS", mensagem: "Esta ação não pode ser desfeita. Deseja continuar?", textoConfirmar: "Cancelar OS" });
    if (!confirmado) return;
    try { await api.cancelarOS(osId); mostrarToast("OS cancelada."); carregar(); } catch (e) { mostrarErro(e); }
  });
}

function renderizarEdicao(ordem) {
  const area = document.getElementById("area-edicao");

  if (ordem.status !== "FINALIZADA") {
    area.innerHTML = `
      <h3 class="card-titulo">Editar OS</h3>
      <p class="texto-suave texto-pequeno" style="margin:0;">Esta OS só pode ser editada depois de finalizada.</p>
    `;
    return;
  }

  area.innerHTML = `
    <h3 class="card-titulo">Editar OS</h3>
    <form id="form-editar-os">
      <div class="campo">
        <label for="editar-titulo">Título</label>
        <input class="input" id="editar-titulo" value="${escapeHtml(ordem.titulo)}" />
      </div>
      <div class="campo">
        <label for="editar-descricao">Descrição</label>
        <textarea id="editar-descricao" rows="3">${escapeHtml(ordem.descricao)}</textarea>
      </div>
      <div class="campo">
        <label for="editar-valor">Valor (R$)</label>
        <input class="input" type="number" id="editar-valor" min="0" step="0.01" value="${ordem.valor || 0}" />
      </div>
      <button type="submit" class="btn btn-primario btn-sm">Salvar alterações</button>
    </form>
  `;

  document.getElementById("form-editar-os").addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      titulo: document.getElementById("editar-titulo").value.trim(),
      descricao: document.getElementById("editar-descricao").value.trim(),
      valor: Number(document.getElementById("editar-valor").value) || 0,
    };
    try {
      await api.editarOS(osId, dados);
      mostrarToast("OS atualizada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  });
}
