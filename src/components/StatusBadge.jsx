const STATUS = {
  CRIADA: ["badge-neutro", "Criada"],
  ATRIBUIDA: ["badge-azul", "Atribuída"],
  EM_ANDAMENTO: ["badge-ambar", "Em andamento"],
  AGUARDANDO_FISCAL: ["badge-roxo", "Aguardando fiscal"],
  FINALIZADA: ["badge-verde", "Finalizada"],
  SEM_PEDREIRO: ["badge-vermelho", "Sem pedreiro"],
  CANCELADA: ["badge-neutro", "Cancelada"],
};

export default function StatusBadge({ status }) {
  const [classe, texto] = STATUS[status] || ["badge-neutro", status];
  return <span className={`badge ${classe}`}>{texto}</span>;
}
