// Dados de exemplo usados pelo modo demonstração (sem backend real).

export const DEMO_USUARIOS_LOGIN = {
  "gerente@demo.com": { senha: "demo123", id: "u-gerente" },
  "fiscal@demo.com": { senha: "demo123", id: "u-fiscal" },
  "pedreiro@demo.com": { senha: "demo123", id: "u-pedreiro" },
};

const GERENTE = { _id: "u-gerente", nome: "Carlos Mendes", email: "gerente@demo.com", telefone: "(11) 98888-1111", perfil: "GERENTE", ativo: true };
const FISCAL = { _id: "u-fiscal", nome: "Renata Souza", email: "fiscal@demo.com", telefone: "(11) 98888-2222", perfil: "FISCAL", ativo: true };
const FISCAL_2 = { _id: "u-fiscal-2", nome: "Marcos Lima", email: "marcos.lima@demo.com", telefone: "(11) 98888-3333", perfil: "FISCAL", ativo: true };
const PEDREIRO = { _id: "u-pedreiro", nome: "João Silva", email: "pedreiro@demo.com", telefone: "(11) 98888-4444", perfil: "PEDREIRO", ativo: true };
const PEDREIRO_2 = { _id: "u-pedreiro-2", nome: "Pedro Alves", email: "pedro.alves@demo.com", telefone: "(11) 98888-5555", perfil: "PEDREIRO", ativo: true };
const PEDREIRO_3 = { _id: "u-pedreiro-3", nome: "Lucas Torres", email: "lucas.torres@demo.com", telefone: "(11) 98888-6666", perfil: "PEDREIRO", ativo: false };

export const USUARIOS_SEED = [GERENTE, FISCAL, FISCAL_2, PEDREIRO, PEDREIRO_2, PEDREIRO_3];

function ref(usuario) {
  return { _id: usuario._id, nome: usuario.nome, perfil: usuario.perfil };
}

function historico(acao, usuario, observacao, diasAtras) {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  return { acao, usuario: usuario ? ref(usuario) : null, observacao, data: data.toISOString() };
}

function endereco(rua, numero, bairro, cidade, estado) {
  return { rua, numero, bairro, cidade, estado };
}

export const OS_SEED = [
  {
    _id: "os-1",
    titulo: "Reforma de fachada - Edifício Aurora",
    descricao: "Recuperação de reboco e pintura da fachada frontal, incluindo reparo de trincas.",
    status: "ATRIBUIDA",
    valor: 8500,
    dataInicioPrevista: new Date(Date.now() + 3 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() + 20 * 86400000).toISOString(),
    endereco: endereco("Rua das Palmeiras", "120", "Centro", "São Paulo", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: ref(PEDREIRO),
    filaPedreiros: [ref(PEDREIRO), ref(PEDREIRO_2)],
    observacaoConclusaoPedreiro: "",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [historico("Criada", GERENTE, null, 2)],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: "os-2",
    titulo: "Pintura interna - Bloco B",
    descricao: "Pintura de todas as paredes internas do bloco B, do térreo ao 3º andar.",
    status: "EM_ANDAMENTO",
    valor: 3200,
    dataInicioPrevista: new Date(Date.now() - 1 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() + 6 * 86400000).toISOString(),
    endereco: endereco("Av. Brasil", "540", "Jardim América", "São Paulo", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: ref(PEDREIRO),
    filaPedreiros: [ref(PEDREIRO)],
    observacaoConclusaoPedreiro: "",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [historico("Criada", GERENTE, null, 5), historico("Aceita", PEDREIRO, null, 4)],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: "os-3",
    titulo: "Troca de piso - Térreo",
    descricao: "Substituição do piso cerâmico do salão térreo por porcelanato.",
    status: "AGUARDANDO_FISCAL",
    valor: 6100,
    dataInicioPrevista: new Date(Date.now() - 10 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() - 1 * 86400000).toISOString(),
    endereco: endereco("Rua Sete de Setembro", "88", "Centro", "Campinas", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: ref(PEDREIRO),
    filaPedreiros: [ref(PEDREIRO)],
    observacaoConclusaoPedreiro: "Piso trocado e nivelado, conforme especificação. Rejunte finalizado.",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [
      historico("Criada", GERENTE, null, 12),
      historico("Aceita", PEDREIRO, null, 11),
      historico("Concluída", PEDREIRO, "Piso trocado e nivelado, conforme especificação. Rejunte finalizado.", 1),
    ],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    _id: "os-4",
    titulo: "Impermeabilização da laje",
    descricao: "Aplicação de manta asfáltica e impermeabilizante na laje de cobertura.",
    status: "REPROVADA",
    valor: 4200,
    dataInicioPrevista: new Date(Date.now() - 8 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() - 2 * 86400000).toISOString(),
    endereco: endereco("Rua das Acácias", "45", "Vila Nova", "Guarulhos", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: ref(PEDREIRO),
    filaPedreiros: [ref(PEDREIRO)],
    observacaoConclusaoPedreiro: "Manta aplicada em toda a extensão da laje.",
    observacaoReprovacaoFiscal: "Falta aplicar segunda demão nas bordas e ralos.",
    anexos: [],
    historico: [
      historico("Criada", GERENTE, null, 9),
      historico("Aceita", PEDREIRO, null, 8),
      historico("Concluída", PEDREIRO, "Manta aplicada em toda a extensão da laje.", 3),
      historico("Reprovada", FISCAL, "Falta aplicar segunda demão nas bordas e ralos.", 2),
    ],
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    _id: "os-5",
    titulo: "Instalação elétrica - Garagem",
    descricao: "Instalação de novos pontos de luz e tomadas na garagem coletiva.",
    status: "FINALIZADA",
    valor: 5400,
    dataInicioPrevista: new Date(Date.now() - 20 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() - 14 * 86400000).toISOString(),
    endereco: endereco("Rua Voluntários da Pátria", "300", "Santana", "São Paulo", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: ref(PEDREIRO),
    filaPedreiros: [ref(PEDREIRO)],
    observacaoConclusaoPedreiro: "Instalação concluída e testada.",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [
      historico("Criada", GERENTE, null, 22),
      historico("Aceita", PEDREIRO, null, 21),
      historico("Concluída", PEDREIRO, "Instalação concluída e testada.", 15),
      historico("Aprovada", FISCAL, null, 14),
    ],
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    _id: "os-6",
    titulo: "Conserto de vazamento - Caixa d'água",
    descricao: "Reparo de vazamento na caixa d'água superior e troca do registro.",
    status: "SEM_PEDREIRO",
    valor: 1800,
    dataInicioPrevista: new Date(Date.now() + 2 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() + 4 * 86400000).toISOString(),
    endereco: endereco("Rua Bela Vista", "12", "Bela Vista", "São Paulo", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL),
    pedreiroAtual: null,
    filaPedreiros: [],
    observacaoConclusaoPedreiro: "",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [historico("Criada", GERENTE, null, 3), historico("Recusada por todos os pedreiros da fila", null, null, 1)],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: "os-7",
    titulo: "Troca de telhado - Bloco C",
    descricao: "Substituição de telhas quebradas e revisão do madeiramento do telhado.",
    status: "CANCELADA",
    valor: 7300,
    dataInicioPrevista: new Date(Date.now() - 15 * 86400000).toISOString(),
    dataFimPrevista: new Date(Date.now() - 5 * 86400000).toISOString(),
    endereco: endereco("Rua Marquês de Abrantes", "77", "Liberdade", "São Paulo", "SP"),
    gerenteCriador: ref(GERENTE),
    fiscalResponsavel: ref(FISCAL_2),
    pedreiroAtual: null,
    filaPedreiros: [ref(PEDREIRO_2), ref(PEDREIRO_3)],
    observacaoConclusaoPedreiro: "",
    observacaoReprovacaoFiscal: "",
    anexos: [],
    historico: [historico("Criada", GERENTE, null, 16), historico("Cancelada", GERENTE, null, 10)],
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
];
