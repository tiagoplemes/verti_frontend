exigirAutenticacao(["GERENTE"]);
montarLayout("gerente-nova.html");

let pedreirosDisponiveis = [];
let filaSelecionada = []; // array de {id, nome}

async function carregarSelects() {
  try {
    const [fiscais, pedreiros] = await Promise.all([
      api.listarUsuarios({ perfil: "FISCAL", ativo: "true" }),
      api.listarUsuarios({ perfil: "PEDREIRO", ativo: "true" }),
    ]);

    pedreirosDisponiveis = pedreiros;

    const selectFiscal = document.getElementById("fiscalResponsavel");
    selectFiscal.innerHTML =
      '<option value="">Nenhum</option>' +
      fiscais.map((f) => `<option value="${f._id}">${escapeHtml(f.nome)}</option>`).join("");

    renderizarSelectPedreiros();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function renderizarSelectPedreiros() {
  const selectPedreiro = document.getElementById("select-pedreiro");
  const disponiveisNaFila = pedreirosDisponiveis.filter(
    (p) => !filaSelecionada.some((f) => f.id === p._id)
  );

  if (!disponiveisNaFila.length) {
    selectPedreiro.innerHTML = '<option value="">Nenhum pedreiro disponível</option>';
    return;
  }

  selectPedreiro.innerHTML = disponiveisNaFila
    .map((p) => `<option value="${p._id}">${escapeHtml(p.nome)}</option>`)
    .join("");
}

document.getElementById("btn-add-pedreiro").addEventListener("click", () => {
  const select = document.getElementById("select-pedreiro");
  const id = select.value;
  if (!id) return;

  const pedreiro = pedreirosDisponiveis.find((p) => p._id === id);
  filaSelecionada.push({ id: pedreiro._id, nome: pedreiro.nome });

  renderizarSelectPedreiros();
  renderizarFila();
});

function renderizarFila() {
  const lista = document.getElementById("lista-fila");

  if (!filaSelecionada.length) {
    lista.innerHTML = '<li class="texto-suave texto-pequeno" style="border:none;background:none;">Nenhum pedreiro adicionado ainda.</li>';
    return;
  }

  lista.innerHTML = filaSelecionada
    .map(
      (p, indice) => `
        <li>
          <span class="posicao">${indice + 1}</span>
          <span style="flex:1;">${escapeHtml(p.nome)}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="subir" data-indice="${indice}" ${indice === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn btn-ghost btn-sm" data-acao="descer" data-indice="${indice}" ${indice === filaSelecionada.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn btn-perigo btn-sm" data-acao="remover" data-indice="${indice}">Remover</button>
        </li>
      `
    )
    .join("");

  lista.querySelectorAll("button[data-acao]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const indice = Number(btn.dataset.indice);
      const acao = btn.dataset.acao;

      if (acao === "remover") {
        filaSelecionada.splice(indice, 1);
      } else if (acao === "subir" && indice > 0) {
        [filaSelecionada[indice - 1], filaSelecionada[indice]] = [filaSelecionada[indice], filaSelecionada[indice - 1]];
      } else if (acao === "descer" && indice < filaSelecionada.length - 1) {
        [filaSelecionada[indice + 1], filaSelecionada[indice]] = [filaSelecionada[indice], filaSelecionada[indice + 1]];
      }

      renderizarSelectPedreiros();
      renderizarFila();
    });
  });
}

document.getElementById("form-nova-os").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!filaSelecionada.length) {
    mostrarToast("Adicione pelo menos um pedreiro à fila.", "erro");
    return;
  }

  const dados = {
    titulo: document.getElementById("titulo").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    valor: Number(document.getElementById("valor").value) || 0,
    dataInicioPrevista: document.getElementById("dataInicioPrevista").value || undefined,
    dataFimPrevista: document.getElementById("dataFimPrevista").value || undefined,
    endereco: {
      rua: document.getElementById("rua").value.trim(),
      numero: document.getElementById("numero").value.trim(),
      bairro: document.getElementById("bairro").value.trim(),
      cidade: document.getElementById("cidade").value.trim(),
      estado: document.getElementById("estado").value.trim(),
    },
    fiscalResponsavel: document.getElementById("fiscalResponsavel").value || undefined,
    filaPedreiros: filaSelecionada.map((p) => p.id),
  };

  const botao = document.getElementById("btn-criar");
  botao.disabled = true;
  botao.textContent = "Criando...";

  try {
    const resposta = await api.criarOS(dados);
    mostrarToast("OS criada com sucesso.");
    window.location.href = "os-detalhe.html?id=" + resposta.ordem._id;
  } catch (erro) {
    mostrarErro(erro);
    botao.disabled = false;
    botao.textContent = "Criar OS";
  }
});

renderizarFila();
carregarSelects();
