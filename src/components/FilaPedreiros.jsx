import { useState } from "react";

// Fila ordenável de pedreiros: select + "Adicionar à fila" + lista com ↑ ↓ Remover.
// `pedreiros` = lista de usuários ({_id, nome}); `fila` = [{id, nome}]; `onChange(novaFila)`.
// Um mesmo pedreiro nunca entra duas vezes na fila.
export default function FilaPedreiros({ pedreiros, fila, onChange, idSelect = "select-pedreiro" }) {
  const [selecionado, setSelecionado] = useState("");

  const disponiveis = pedreiros.filter((p) => !fila.some((f) => f.id === p._id));

  function adicionar() {
    const id = selecionado || disponiveis[0]?._id;
    if (!id || fila.some((f) => f.id === id)) return;
    const pedreiro = pedreiros.find((p) => p._id === id);
    if (!pedreiro) return;
    onChange([...fila, { id: pedreiro._id, nome: pedreiro.nome }]);
    setSelecionado("");
  }

  function mover(indice, direcao) {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= fila.length) return;
    const nova = [...fila];
    [nova[indice], nova[alvo]] = [nova[alvo], nova[indice]];
    onChange(nova);
  }

  function remover(indice) {
    onChange(fila.filter((_, i) => i !== indice));
  }

  return (
    <>
      <div className="linha" style={{ alignItems: "flex-end" }}>
        <div className="campo">
          <label htmlFor={idSelect}>Pedreiro</label>
          <select id={idSelect} value={selecionado} onChange={(e) => setSelecionado(e.target.value)}>
            {disponiveis.length === 0 && <option value="">Nenhum pedreiro disponível</option>}
            {disponiveis.map((p) => (
              <option key={p._id} value={p._id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo" style={{ flex: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={adicionar} disabled={!disponiveis.length}>
            + Adicionar à fila
          </button>
        </div>
      </div>

      <ul className="fila-pedreiros">
        {fila.length === 0 && (
          <li className="texto-suave texto-pequeno" style={{ border: "none", background: "none" }}>
            Nenhum pedreiro adicionado ainda.
          </li>
        )}
        {fila.map((p, indice) => (
          <li key={p.id}>
            <span className="posicao">{indice + 1}</span>
            <span style={{ flex: 1 }}>{p.nome}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={indice === 0} onClick={() => mover(indice, -1)}>
              ↑
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={indice === fila.length - 1} onClick={() => mover(indice, 1)}>
              ↓
            </button>
            <button type="button" className="btn btn-perigo btn-sm" onClick={() => remover(indice)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
