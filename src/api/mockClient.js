// Implementação em memória do objeto `api`, usada no modo demonstração
// (permite navegar por todas as telas sem um backend real).

import { DEMO_USUARIOS_LOGIN, OS_SEED, USUARIOS_SEED } from "./mockData.js";

const STORAGE_KEY = "verti_demo_store";
const TOKEN_KEY = "verti_token";
const USER_KEY = "verti_user";

function carregarStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignora erro de parsing e recria a partir da seed
  }
  return { usuarios: structuredClone(USUARIOS_SEED), ordens: structuredClone(OS_SEED) };
}

let store = carregarStore();

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage indisponível (modo privado, por exemplo) — segue só em memória
  }
}

export function reiniciarDemo() {
  store = { usuarios: structuredClone(USUARIOS_SEED), ordens: structuredClone(OS_SEED) };
  salvar();
}

function usuarioLogado() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ref(usuario) {
  return usuario ? { _id: usuario._id, nome: usuario.nome, perfil: usuario.perfil } : null;
}

function achar(id) {
  return store.ordens.find((o) => o._id === id);
}

function registrarHistorico(os, acao, usuario, observacao) {
  os.historico.push({ acao, usuario: ref(usuario), observacao: observacao || null, data: new Date().toISOString() });
}

function usuarioPorId(id) {
  return store.usuarios.find((u) => u._id === id);
}

async function atraso() {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export function criarApiMock() {
  return {
    async login(email, senha) {
      await atraso();
      const registro = DEMO_USUARIOS_LOGIN[email];
      if (!registro || registro.senha !== senha) {
        const erro = new Error("E-mail ou senha inválidos.");
        erro.status = 401;
        throw erro;
      }
      const usuario = usuarioPorId(registro.id);
      return { token: "demo-token-" + usuario.perfil.toLowerCase(), usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } };
    },

    async me() {
      await atraso();
      return usuarioLogado();
    },

    async listarUsuarios(filtros = {}) {
      await atraso();
      return store.usuarios.filter((u) => {
        if (filtros.perfil && u.perfil !== filtros.perfil) return false;
        if (filtros.ativo === "true" && !u.ativo) return false;
        if (filtros.ativo === "false" && u.ativo) return false;
        if (filtros.nome && !u.nome.toLowerCase().includes(String(filtros.nome).toLowerCase())) return false;
        return true;
      });
    },

    async buscarUsuario(id) {
      await atraso();
      const usuario = usuarioPorId(id);
      if (!usuario) throw new Error("Usuário não encontrado.");
      return usuario;
    },

    async criarUsuario(dados) {
      await atraso();
      const novo = { _id: "u-" + Date.now(), ativo: true, ...dados };
      store.usuarios.push(novo);
      salvar();
      return novo;
    },

    async editarUsuario(id, dados) {
      await atraso();
      const usuario = usuarioPorId(id);
      if (!usuario) throw new Error("Usuário não encontrado.");
      Object.assign(usuario, dados);
      salvar();
      return usuario;
    },

    async ativarUsuario(id) {
      await atraso();
      const usuario = usuarioPorId(id);
      if (usuario) usuario.ativo = true;
      salvar();
      return usuario;
    },

    async desativarUsuario(id) {
      await atraso();
      const usuario = usuarioPorId(id);
      if (usuario) usuario.ativo = false;
      salvar();
      return usuario;
    },

    async listarMinhasOS() {
      await atraso();
      const usuario = usuarioLogado();
      return store.ordens.filter((o) => o.pedreiroAtual?._id === usuario?.id);
    },

    async aceitarOS(id) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.status = "EM_ANDAMENTO";
      registrarHistorico(os, "Aceita", usuarioPorId(os.pedreiroAtual?._id));
      salvar();
      return os;
    },

    async recusarOS(id) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      const fila = os.filaPedreiros.filter((p) => p._id !== os.pedreiroAtual?._id);
      registrarHistorico(os, "Recusada", usuarioPorId(os.pedreiroAtual?._id));
      if (fila.length) {
        os.filaPedreiros = fila;
        os.pedreiroAtual = fila[0];
        os.status = "ATRIBUIDA";
      } else {
        os.filaPedreiros = [];
        os.pedreiroAtual = null;
        os.status = "SEM_PEDREIRO";
      }
      salvar();
      return os;
    },

    async concluirOS(id, observacao) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.status = "AGUARDANDO_FISCAL";
      os.observacaoConclusaoPedreiro = observacao || "";
      registrarHistorico(os, "Concluída", usuarioPorId(os.pedreiroAtual?._id), observacao);
      salvar();
      return os;
    },

    async listarOSFiscal() {
      await atraso();
      return store.ordens.filter((o) => o.status === "AGUARDANDO_FISCAL");
    },

    async listarOSFiscalHistorico() {
      await atraso();
      const usuario = usuarioLogado();
      return store.ordens
        .filter((o) => o.fiscalResponsavel?._id === usuario?.id && ["FINALIZADA", "REPROVADA", "CANCELADA"].includes(o.status))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async aprovarOS(id) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.status = "FINALIZADA";
      registrarHistorico(os, "Aprovada", usuarioPorId(os.fiscalResponsavel?._id));
      salvar();
      return os;
    },

    async reprovarOS(id, observacao) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.status = "REPROVADA";
      os.observacaoReprovacaoFiscal = observacao || "";
      registrarHistorico(os, "Reprovada", usuarioPorId(os.fiscalResponsavel?._id), observacao);
      salvar();
      return os;
    },

    async criarOS(dados) {
      await atraso();
      const usuario = usuarioLogado();
      const filaPedreiros = (dados.filaPedreiros || []).map((idPedreiro) => ref(usuarioPorId(idPedreiro))).filter(Boolean);
      const ordem = {
        _id: "os-" + Date.now(),
        titulo: dados.titulo,
        descricao: dados.descricao,
        valor: dados.valor || 0,
        dataInicioPrevista: dados.dataInicioPrevista || null,
        dataFimPrevista: dados.dataFimPrevista || null,
        endereco: dados.endereco || {},
        gerenteCriador: ref(usuarioPorId(usuario?.id)) || ref(usuarioPorId("u-gerente")),
        fiscalResponsavel: dados.fiscalResponsavel ? ref(usuarioPorId(dados.fiscalResponsavel)) : null,
        pedreiroAtual: filaPedreiros[0] || null,
        filaPedreiros,
        observacaoConclusaoPedreiro: "",
        observacaoReprovacaoFiscal: "",
        anexos: [],
        historico: [{ acao: "Criada", usuario: ref(usuarioPorId(usuario?.id)), observacao: null, data: new Date().toISOString() }],
        status: filaPedreiros.length ? "ATRIBUIDA" : "SEM_PEDREIRO",
        createdAt: new Date().toISOString(),
      };
      store.ordens.unshift(ordem);
      salvar();
      return { ordem };
    },

    async listarOSFinalizadas() {
      await atraso();
      return store.ordens.filter((o) => o.status === "FINALIZADA");
    },

    async listarOSGerente(filtros = {}) {
      await atraso();
      let lista = [...store.ordens];
      if (filtros.titulo) lista = lista.filter((o) => o.titulo.toLowerCase().includes(String(filtros.titulo).toLowerCase()));
      if (filtros.status) lista = lista.filter((o) => o.status === filtros.status);
      if (filtros.dataInicio) lista = lista.filter((o) => new Date(o.createdAt) >= new Date(filtros.dataInicio));
      if (filtros.dataFim) lista = lista.filter((o) => new Date(o.createdAt) <= new Date(filtros.dataFim));

      lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const limite = Number(filtros.limite) || 10;
      const pagina = Number(filtros.pagina) || 1;
      const total = lista.length;
      const totalPaginas = Math.max(1, Math.ceil(total / limite));
      const inicio = (pagina - 1) * limite;
      const ordens = lista.slice(inicio, inicio + limite);

      return { ordens, total, pagina, totalPaginas };
    },

    async editarOS(id, dados) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      Object.assign(os, dados);
      salvar();
      return os;
    },

    async cancelarOS(id) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.status = "CANCELADA";
      registrarHistorico(os, "Cancelada", usuarioLogado() && usuarioPorId(usuarioLogado().id));
      salvar();
      return os;
    },

    async buscarOSDetalhada(id) {
      await atraso();
      const os = achar(id);
      if (!os) {
        const erro = new Error("OS não encontrada.");
        erro.status = 404;
        throw erro;
      }
      return os;
    },

    async anexarArquivo(id, arquivo) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      const url = URL.createObjectURL(arquivo);
      os.anexos.push({ _id: "anexo-" + Date.now(), url, nome: arquivo.name });
      salvar();
      return os;
    },

    async excluirAnexo(id, idAnexo) {
      await atraso();
      const os = achar(id);
      if (!os) throw new Error("OS não encontrada.");
      os.anexos = os.anexos.filter((a) => a._id !== idAnexo);
      salvar();
      return os;
    },
  };
}
