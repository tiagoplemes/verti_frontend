import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function GerenteNova() {
  const { mostrarToast, mostrarErro } = useToast();
  const navegar = useNavigate();

  const [fiscais, setFiscais] = useState([]);
  const [pedreiros, setPedreiros] = useState([]);
  const [fila, setFila] = useState([]); // [{id, nome}]
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    valor: "",
    dataInicioPrevista: "",
    dataFimPrevista: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    fiscalResponsavel: "",
    pedreiroSelecionado: "",
  });

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  useEffect(() => {
    (async () => {
      try {
        const [listaFiscais, listaPedreiros] = await Promise.all([
          api.listarUsuarios({ perfil: "FISCAL", ativo: "true" }),
          api.listarUsuarios({ perfil: "PEDREIRO", ativo: "true" }),
        ]);
        setFiscais(listaFiscais);
        setPedreiros(listaPedreiros);
      } catch (erro) {
        mostrarErro(erro);
      }
    })();
  }, [mostrarErro]);

  const disponiveis = pedreiros.filter((p) => !fila.some((f) => f.id === p._id));

  function adicionarNaFila() {
    const id = form.pedreiroSelecionado || disponiveis[0]?._id;
    if (!id) return;
    const pedreiro = pedreiros.find((p) => p._id === id);
    if (!pedreiro) return;
    setFila((atual) => [...atual, { id: pedreiro._id, nome: pedreiro.nome }]);
    setForm((f) => ({ ...f, pedreiroSelecionado: "" }));
  }

  function moverFila(indice, direcao) {
    setFila((atual) => {
      const nova = [...atual];
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= nova.length) return atual;
      [nova[indice], nova[alvo]] = [nova[alvo], nova[indice]];
      return nova;
    });
  }

  function removerDaFila(indice) {
    setFila((atual) => atual.filter((_, i) => i !== indice));
  }

  async function enviar(e) {
    e.preventDefault();

    if (!fila.length) {
      mostrarToast("Adicione pelo menos um pedreiro à fila.", "erro");
      return;
    }

    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      valor: Number(form.valor) || 0,
      dataInicioPrevista: form.dataInicioPrevista || undefined,
      dataFimPrevista: form.dataFimPrevista || undefined,
      endereco: {
        rua: form.rua.trim(),
        numero: form.numero.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
      },
      fiscalResponsavel: form.fiscalResponsavel || undefined,
      filaPedreiros: fila.map((p) => p.id),
    };

    setEnviando(true);
    try {
      const resposta = await api.criarOS(dados);
      mostrarToast("OS criada com sucesso.");
      navegar(`/os/${resposta.ordem._id}`);
    } catch (erro) {
      mostrarErro(erro);
      setEnviando(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 className="mb-16">Nova Ordem de Serviço</h2>

      <form onSubmit={enviar}>
        <div className="card mb-16">
          <h3 className="card-titulo">Dados gerais</h3>

          <div className="campo">
            <label htmlFor="titulo">Título *</label>
            <input className="input" id="titulo" required value={form.titulo} onChange={set("titulo")} />
          </div>

          <div className="campo">
            <label htmlFor="descricao">Descrição *</label>
            <textarea id="descricao" rows={3} required value={form.descricao} onChange={set("descricao")} />
          </div>

          <div className="linha">
            <div className="campo">
              <label htmlFor="valor">Valor (R$)</label>
              <input className="input" type="number" id="valor" min="0" step="0.01" value={form.valor} onChange={set("valor")} />
            </div>
            <div className="campo">
              <label htmlFor="dataInicioPrevista">Início previsto</label>
              <input className="input" type="date" id="dataInicioPrevista" value={form.dataInicioPrevista} onChange={set("dataInicioPrevista")} />
            </div>
            <div className="campo">
              <label htmlFor="dataFimPrevista">Fim previsto</label>
              <input className="input" type="date" id="dataFimPrevista" value={form.dataFimPrevista} onChange={set("dataFimPrevista")} />
            </div>
          </div>
        </div>

        <div className="card mb-16">
          <h3 className="card-titulo">Endereço</h3>
          <div className="linha">
            <div className="campo">
              <label htmlFor="rua">Rua</label>
              <input className="input" id="rua" value={form.rua} onChange={set("rua")} />
            </div>
            <div className="campo">
              <label htmlFor="numero">Número</label>
              <input className="input" id="numero" value={form.numero} onChange={set("numero")} />
            </div>
          </div>
          <div className="linha">
            <div className="campo">
              <label htmlFor="bairro">Bairro</label>
              <input className="input" id="bairro" value={form.bairro} onChange={set("bairro")} />
            </div>
            <div className="campo">
              <label htmlFor="cidade">Cidade</label>
              <input className="input" id="cidade" value={form.cidade} onChange={set("cidade")} />
            </div>
            <div className="campo">
              <label htmlFor="estado">Estado</label>
              <input className="input" id="estado" maxLength={2} value={form.estado} onChange={set("estado")} />
            </div>
          </div>
        </div>

        <div className="card mb-16">
          <h3 className="card-titulo">Fiscal responsável</h3>
          <div className="campo">
            <select value={form.fiscalResponsavel} onChange={set("fiscalResponsavel")}>
              <option value="">Nenhum</option>
              {fiscais.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card mb-16">
          <h3 className="card-titulo">Fila de pedreiros *</h3>
          <p className="texto-suave texto-pequeno">
            A OS será oferecida ao primeiro da lista; se recusar, passa automaticamente para o próximo.
          </p>

          <div className="linha" style={{ alignItems: "flex-end" }}>
            <div className="campo">
              <label htmlFor="select-pedreiro">Pedreiro</label>
              <select id="select-pedreiro" value={form.pedreiroSelecionado} onChange={set("pedreiroSelecionado")}>
                {disponiveis.length === 0 && <option value="">Nenhum pedreiro disponível</option>}
                {disponiveis.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo" style={{ flex: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={adicionarNaFila} disabled={!disponiveis.length}>
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
                <button type="button" className="btn btn-ghost btn-sm" disabled={indice === 0} onClick={() => moverFila(indice, -1)}>
                  ↑
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={indice === fila.length - 1} onClick={() => moverFila(indice, 1)}>
                  ↓
                </button>
                <button type="button" className="btn btn-perigo btn-sm" onClick={() => removerDaFila(indice)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-8">
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Criando..." : "Criar OS"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navegar("/gerente")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
