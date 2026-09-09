import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

const PERFIL_LABEL = { GERENTE: "Gerente", FISCAL: "Fiscal", PEDREIRO: "Pedreiro" };

const USUARIO_VAZIO = { id: "", nome: "", email: "", telefone: "", perfil: "PEDREIRO", senha: "" };

export default function GerenteUsuarios() {
  const { mostrarToast, mostrarErro } = useToast();
  const confirmar = useConfirm();

  const [filtrosForm, setFiltrosForm] = useState({ nome: "", perfil: "", ativo: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [usuarios, setUsuarios] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(USUARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setUsuarios(null);
    try {
      setUsuarios(await api.listarUsuarios(filtrosAplicados));
    } catch (erro) {
      mostrarErro(erro);
      setUsuarios([]);
    }
  }, [filtrosAplicados, mostrarErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function filtrar(e) {
    e.preventDefault();
    const filtros = {};
    if (filtrosForm.nome.trim()) filtros.nome = filtrosForm.nome.trim();
    if (filtrosForm.perfil) filtros.perfil = filtrosForm.perfil;
    if (filtrosForm.ativo) filtros.ativo = filtrosForm.ativo;
    setFiltrosAplicados(filtros);
  }

  async function mudarSituacao(id, ativar) {
    const ok = await confirmar({
      titulo: ativar ? "Ativar usuário" : "Desativar usuário",
      mensagem: ativar ? "Este usuário voltará a ter acesso ao sistema." : "Este usuário perderá o acesso ao sistema.",
      textoConfirmar: ativar ? "Ativar" : "Desativar",
    });
    if (!ok) return;
    try {
      if (ativar) await api.ativarUsuario(id);
      else await api.desativarUsuario(id);
      mostrarToast("Situação atualizada.");
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  function abrirNovo() {
    setEditando(USUARIO_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(usuario) {
    setEditando({
      id: usuario._id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || "",
      perfil: usuario.perfil,
      senha: "",
    });
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    const dados = {
      nome: editando.nome.trim(),
      email: editando.email.trim(),
      telefone: editando.telefone.trim(),
      perfil: editando.perfil,
    };
    if (editando.senha) dados.senha = editando.senha;

    setSalvando(true);
    try {
      if (editando.id) {
        await api.editarUsuario(editando.id, dados);
        mostrarToast("Usuário atualizado.");
      } else {
        await api.criarUsuario(dados);
        mostrarToast("Usuário criado.");
      }
      setModalAberto(false);
      carregar();
    } catch (erro) {
      mostrarErro(erro);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="flex-entre mb-16">
        <h2>Usuários</h2>
        <button className="btn btn-primario" onClick={abrirNovo}>
          + Novo usuário
        </button>
      </div>

      <div className="card mb-16">
        <form className="linha" style={{ alignItems: "flex-end" }} onSubmit={filtrar}>
          <div className="campo">
            <label htmlFor="filtro-nome">Nome</label>
            <input
              className="input"
              id="filtro-nome"
              placeholder="Buscar por nome"
              value={filtrosForm.nome}
              onChange={(e) => setFiltrosForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </div>
          <div className="campo">
            <label htmlFor="filtro-perfil">Perfil</label>
            <select id="filtro-perfil" value={filtrosForm.perfil} onChange={(e) => setFiltrosForm((f) => ({ ...f, perfil: e.target.value }))}>
              <option value="">Todos</option>
              <option value="GERENTE">Gerente</option>
              <option value="FISCAL">Fiscal</option>
              <option value="PEDREIRO">Pedreiro</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="filtro-ativo">Situação</label>
            <select id="filtro-ativo" value={filtrosForm.ativo} onChange={(e) => setFiltrosForm((f) => ({ ...f, ativo: e.target.value }))}>
              <option value="">Todas</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <div className="campo" style={{ flex: 0 }}>
            <button type="submit" className="btn btn-ghost">
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {usuarios === null && <div className="carregando">Carregando...</div>}

      {usuarios && usuarios.length === 0 && <div className="card tabela-vazia">Nenhum usuário encontrado.</div>}

      {usuarios && usuarios.length > 0 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u._id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.telefone || "—"}</td>
                  <td>{PERFIL_LABEL[u.perfil] || u.perfil}</td>
                  <td>
                    <span className={`badge ${u.ativo ? "badge-verde" : "badge-neutro"}`}>{u.ativo ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="flex gap-8">
                    <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(u)}>
                      Editar
                    </button>
                    <button
                      className={`btn ${u.ativo ? "btn-perigo" : "btn-sucesso"} btn-sm`}
                      onClick={() => mudarSituacao(u._id, !u.ativo)}
                    >
                      {u.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="modal">
            <h3>{editando.id ? "Editar usuário" : "Novo usuário"}</h3>
            <form onSubmit={salvar}>
              <div className="campo">
                <label htmlFor="usuario-nome">Nome *</label>
                <input
                  className="input"
                  id="usuario-nome"
                  required
                  value={editando.nome}
                  onChange={(e) => setEditando((u) => ({ ...u, nome: e.target.value }))}
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-email">E-mail *</label>
                <input
                  className="input"
                  type="email"
                  id="usuario-email"
                  required
                  value={editando.email}
                  onChange={(e) => setEditando((u) => ({ ...u, email: e.target.value }))}
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-telefone">Telefone</label>
                <input
                  className="input"
                  id="usuario-telefone"
                  value={editando.telefone}
                  onChange={(e) => setEditando((u) => ({ ...u, telefone: e.target.value }))}
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-perfil">Perfil *</label>
                <select
                  id="usuario-perfil"
                  required
                  value={editando.perfil}
                  onChange={(e) => setEditando((u) => ({ ...u, perfil: e.target.value }))}
                >
                  <option value="GERENTE">Gerente</option>
                  <option value="FISCAL">Fiscal</option>
                  <option value="PEDREIRO">Pedreiro</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="usuario-senha">Senha {editando.id ? "" : "*"}</label>
                <input
                  className="input"
                  type="password"
                  id="usuario-senha"
                  required={!editando.id}
                  value={editando.senha}
                  onChange={(e) => setEditando((u) => ({ ...u, senha: e.target.value }))}
                />
                {editando.id && (
                  <div className="texto-pequeno texto-suave">Deixe em branco para manter a senha atual.</div>
                )}
              </div>
              <div className="modal-acoes">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario" disabled={salvando}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
