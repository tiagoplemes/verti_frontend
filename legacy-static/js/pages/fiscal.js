exigirAutenticacao(["FISCAL"]);
montarLayout("fiscal.html");

const listaEl = document.getElementById("lista-os");

async function carregar() {
  listaEl.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const ordens = await api.listarOSFiscal();
    renderizar(ordens);
  } catch (erro) {
    mostrarErro(erro);
    listaEl.innerHTML = '<div class="tabela-vazia">Não foi possível carregar as ordens.</div>';
  }
}

function renderizar(ordens) {
  if (!ordens.length) {
    listaEl.innerHTML = '<div class="card tabela-vazia">Nenhuma ordem aguardando fiscalização.</div>';
    return;
  }

  listaEl.innerHTML = ordens.map((os) => cardOS(os)).join("");

  ordens.forEach((os) => {
    const cardEl = document.getElementById("os-" + os._id);
    cardEl.querySelector(".btn-aprovar").addEventListener("click", () => aprovar(os._id));
    cardEl.querySelector(".btn-reprovar").addEventListener("click", () => reprovar(os._id));
  });
}

function cardOS(os) {
  return `
    <div class="card" id="os-${os._id}">
      <div class="flex-entre">
        <div>
          <h3 class="card-titulo"><a href="os-detalhe.html?id=${os._id}">${escapeHtml(os.titulo)}</a></h3>
          <div class="texto-suave texto-pequeno">Pedreiro: ${escapeHtml(os.pedreiroAtual?.nome || "—")} · Gerente: ${escapeHtml(os.gerenteCriador?.nome || "—")}</div>
        </div>
        ${badgeStatus(os.status)}
      </div>
      <p class="mt-16">${escapeHtml(os.descricao)}</p>
      ${os.observacaoConclusaoPedreiro ? `<p class="texto-pequeno"><strong>Observação do pedreiro:</strong> ${escapeHtml(os.observacaoConclusaoPedreiro)}</p>` : ""}
      <div class="flex gap-8 mt-16">
        <button class="btn btn-sucesso btn-sm btn-aprovar">Aprovar</button>
        <button class="btn btn-perigo btn-sm btn-reprovar">Reprovar</button>
        <a href="os-detalhe.html?id=${os._id}" class="btn btn-ghost btn-sm">Ver detalhes</a>
      </div>
    </div>
  `;
}

async function aprovar(id) {
  const confirmado = await abrirModalConfirmacao({
    titulo: "Aprovar OS",
    mensagem: "A OS será marcada como finalizada. Deseja continuar?",
    textoConfirmar: "Aprovar",
  });
  if (!confirmado) return;

  try {
    await api.aprovarOS(id);
    mostrarToast("OS aprovada.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function reprovar(id) {
  const resultado = await abrirModalConfirmacao({
    titulo: "Reprovar OS",
    mensagem: "Descreva o que precisa ser corrigido. A OS voltará para o pedreiro.",
    pedirObservacao: true,
    obrigatorioObservacao: true,
    textoConfirmar: "Reprovar",
  });
  if (!resultado) return;

  try {
    await api.reprovarOS(id, resultado.observacao);
    mostrarToast("OS reprovada.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

carregar();
