exigirAutenticacao(["GERENTE"]);
montarLayout("gerente-lista.html");

const areaTabela = document.getElementById("area-tabela");
const areaPaginacao = document.getElementById("area-paginacao");

let paginaAtual = 1;

document.getElementById("form-filtros").addEventListener("submit", (e) => {
  e.preventDefault();
  paginaAtual = 1;
  carregar();
});

function coletarFiltros() {
  const filtros = { pagina: paginaAtual, limite: 10 };

  const titulo = document.getElementById("filtro-titulo").value.trim();
  if (titulo) filtros.titulo = titulo;

  const status = document.getElementById("filtro-status").value;
  if (status) filtros.status = status;

  const dataInicio = document.getElementById("filtro-data-inicio").value;
  if (dataInicio) filtros.dataInicio = dataInicio;

  const dataFim = document.getElementById("filtro-data-fim").value;
  if (dataFim) filtros.dataFim = dataFim;

  return filtros;
}

async function carregar() {
  areaTabela.innerHTML = '<div class="carregando">Carregando...</div>';
  areaPaginacao.innerHTML = "";

  try {
    const resultado = await api.listarOSGerente(coletarFiltros());
    renderizarTabela(resultado.ordens);
    renderizarPaginacao(resultado);
  } catch (erro) {
    mostrarErro(erro);
    areaTabela.innerHTML = '<div class="tabela-vazia">Não foi possível carregar as ordens.</div>';
  }
}

function renderizarTabela(ordens) {
  if (!ordens.length) {
    areaTabela.innerHTML = '<div class="card tabela-vazia">Nenhuma ordem de serviço encontrada.</div>';
    return;
  }

  const linhas = ordens
    .map(
      (os) => `
        <tr>
          <td><a href="os-detalhe.html?id=${os._id}">${escapeHtml(os.titulo)}</a></td>
          <td>${badgeStatus(os.status)}</td>
          <td>${escapeHtml(os.pedreiroAtual?.nome || "—")}</td>
          <td>${escapeHtml(os.fiscalResponsavel?.nome || "—")}</td>
          <td>${formatarMoeda(os.valor)}</td>
          <td>${formatarDataCurta(os.createdAt)}</td>
        </tr>
      `
    )
    .join("");

  areaTabela.innerHTML = `
    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Pedreiro</th>
            <th>Fiscal</th>
            <th>Valor</th>
            <th>Criada em</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function renderizarPaginacao(resultado) {
  if (resultado.totalPaginas <= 1) return;

  areaPaginacao.innerHTML = `
    <div class="paginacao">
      <button class="btn btn-ghost btn-sm" id="btn-anterior" ${resultado.pagina <= 1 ? "disabled" : ""}>← Anterior</button>
      <span class="texto-suave texto-pequeno">Página ${resultado.pagina} de ${resultado.totalPaginas} (${resultado.total} ordens)</span>
      <button class="btn btn-ghost btn-sm" id="btn-proxima" ${resultado.pagina >= resultado.totalPaginas ? "disabled" : ""}>Próxima →</button>
    </div>
  `;

  const btnAnterior = document.getElementById("btn-anterior");
  const btnProxima = document.getElementById("btn-proxima");

  if (btnAnterior) btnAnterior.addEventListener("click", () => { paginaAtual--; carregar(); });
  if (btnProxima) btnProxima.addEventListener("click", () => { paginaAtual++; carregar(); });
}

carregar();
