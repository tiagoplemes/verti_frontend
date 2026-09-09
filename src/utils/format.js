export function formatarData(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  return (
    data.toLocaleDateString("pt-BR") +
    " " +
    data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function formatarDataCurta(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR");
}

export function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
