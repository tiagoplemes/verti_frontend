const STATUS = {
  CRIADA: ["badge-neutro", "Criada"],
  ATRIBUIDA: ["badge-azul", "Atribuída"],
  ACEITA: ["badge-azul", "Aceita"],
  EM_ANDAMENTO: ["badge-ambar", "Em andamento"],
  AGUARDANDO_FISCAL: ["badge-roxo", "Aguardando fiscal"],
  REPROVADA: ["badge-vermelho", "Reprovada"],
  APROVADA: ["badge-verde", "Aprovada"],
  FINALIZADA: ["badge-verde", "Finalizada"],
  SEM_PEDREIRO: ["badge-vermelho", "Sem pedreiro"],
  CANCELADA: ["badge-neutro", "Cancelada"],
};

export default function StatusBadge({ status }) {
  const [classe, texto] = STATUS[status] || ["badge-neutro", status];
  return <span className={`badge ${classe}`}>{texto}</span>;
}
