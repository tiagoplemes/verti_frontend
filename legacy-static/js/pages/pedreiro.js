exigirAutenticacao(["PEDREIRO"]);
montarLayout("pedreiro.html");

const listaEl = document.getElementById("lista-os");

async function carregar() {
  listaEl.innerHTML = '<div class="carregando">Carregando...</div>';
  try {
    const ordens = await api.listarMinhasOS();
    renderizar(ordens);
  } catch (erro) {
    mostrarErro(erro);
    listaEl.innerHTML = '<div class="tabela-vazia">Não foi possível carregar as ordens.</div>';
  }
}

function renderizar(ordens) {
  if (!ordens.length) {
    listaEl.innerHTML = '<div class="card tabela-vazia">Você não possui ordens de serviço no momento.</div>';
    return;
  }

  listaEl.innerHTML = ordens.map((os) => cardOS(os)).join("");

  ordens.forEach((os) => {
    const cardEl = document.getElementById("os-" + os._id);

    const btnAceitar = cardEl.querySelector(".btn-aceitar");
    if (btnAceitar) btnAceitar.addEventListener("click", () => aceitar(os._id));

    const btnRecusar = cardEl.querySelector(".btn-recusar");
    if (btnRecusar) btnRecusar.addEventListener("click", () => recusar(os._id));

    const btnConcluir = cardEl.querySelector(".btn-concluir");
    if (btnConcluir) btnConcluir.addEventListener("click", () => concluir(os._id));
  });
}

function cardOS(os) {
  const podeAceitarRecusar = os.status === "ATRIBUIDA";
  const podeConcluir = os.status === "EM_ANDAMENTO" || os.status === "REPROVADA";

  return `
    <div class="card" id="os-${os._id}">
      <div class="flex-entre">
        <div>
          <h3 class="card-titulo"><a href="os-detalhe.html?id=${os._id}">${escapeHtml(os.titulo)}</a></h3>
          <div class="texto-suave texto-pequeno">Gerente: ${escapeHtml(os.gerenteCriador?.nome || "—")} · Fiscal: ${escapeHtml(os.fiscalResponsavel?.nome || "—")}</div>
        </div>
        ${badgeStatus(os.status)}
      </div>
      <p class="mt-16">${escapeHtml(os.descricao)}</p>
      ${os.observacaoReprovacaoFiscal ? `<p class="texto-pequeno" style="color:var(--cor-perigo)"><strong>Motivo da reprovação:</strong> ${escapeHtml(os.observacaoReprovacaoFiscal)}</p>` : ""}
      <div class="flex gap-8 mt-16">
        ${podeAceitarRecusar ? '<button class="btn btn-sucesso btn-sm btn-aceitar">Aceitar</button>' : ""}
        ${podeAceitarRecusar ? '<button class="btn btn-perigo btn-sm btn-recusar">Recusar</button>' : ""}
        ${podeConcluir ? '<button class="btn btn-primario btn-sm btn-concluir">Concluir</button>' : ""}
        <a href="os-detalhe.html?id=${os._id}" class="btn btn-ghost btn-sm">Ver detalhes</a>
      </div>
    </div>
  `;
}

async function aceitar(id) {
  const confirmado = await abrirModalConfirmacao({
    titulo: "Aceitar OS",
    mensagem: "Deseja aceitar esta ordem de serviço?",
    textoConfirmar: "Aceitar",
  });
  if (!confirmado) return;

  try {
    await api.aceitarOS(id);
    mostrarToast("OS aceita com sucesso.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function recusar(id) {
  const confirmado = await abrirModalConfirmacao({
    titulo: "Recusar OS",
    mensagem: "A OS será passada para o próximo pedreiro da fila (ou marcada como sem pedreiro). Deseja continuar?",
    textoConfirmar: "Recusar",
  });
  if (!confirmado) return;

  try {
    await api.recusarOS(id);
    mostrarToast("OS recusada.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function concluir(id) {
  const resultado = await abrirModalConfirmacao({
    titulo: "Concluir OS",
    mensagem: "Descreva o que foi realizado. A OS será enviada para fiscalização.",
    pedirObservacao: true,
    textoConfirmar: "Concluir",
  });
  if (!resultado) return;

  try {
    await api.concluirOS(id, resultado.observacao);
    mostrarToast("OS enviada para fiscalização.");
    carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

carregar();
