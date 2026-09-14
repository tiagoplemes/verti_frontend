# Verti — Frontend

Interface web do sistema Verti (gestão de Ordens de Serviço), consumindo a API REST do `verti_backend`. Documentação de apoio para quem for mexer no projeto depois — não é um manual exaustivo, é o suficiente para entender as decisões e não se perder.

## 1. Stack

| Camada | Tecnologia | Observação |
|---|---|---|
| UI | React 18 | Componentes funcionais + hooks, sem classes |
| Build/dev server | Vite 5 | `npm run dev` com hot reload; `npm run build` gera estático em `dist/` |
| Roteamento | React Router 6 | SPA — uma rota por tela, guardas de rota por perfil |
| Estado de sessão/UI | Context API (`AuthContext`, `ToastContext`, `ConfirmContext`) | Sem Redux/Zustand — o escopo não justifica |
| Estilo | CSS puro (`src/styles/style.css`) | Sem framework (Bootstrap/Tailwind), variáveis CSS (`:root`) como design tokens |
| Dados | `fetch` nativo contra a API do `verti_backend` | Autenticação via JWT (Bearer token) |
| Persistência local | `localStorage` | Guarda token + dados do usuário logado |

> Este projeto começou como HTML/CSS/JS puro (sem build) e foi migrado para React + Vite. A versão anterior fica preservada em [`legacy-static/`](legacy-static/) só como referência — não é mais mantida.

## 2. Como rodar

1. Backend do `verti_backend` rodando (MongoDB local + `npm run dev`, porta padrão `3000`).
2. O backend **precisa ter CORS habilitado** — sem isso o navegador bloqueia toda chamada do frontend, mesmo com o backend respondendo normalmente (o erro aparece como "Não foi possível conectar ao servidor", mas o servidor está no ar; é só o navegador barrando por origem diferente). Habilitado **localmente nesta máquina** em `src/app.js`:
   ```js
   import cors from "cors";
   // ...
   app.use(cors());
   ```
   Adicionado logo depois de `const app = express();` e antes de `app.use(express.json())`. O pacote `cors` já estava no `package.json` do backend, só não era usado.

   > ⚠️ **Isso só existe nesta cópia local.** Ainda precisa ser replicado no repositório principal do backend (mesmas duas linhas) pra funcionar pra qualquer outra pessoa que rodar o projeto.
3. `npm install` nesta pasta (uma vez).
4. `npm run dev` — abre em `http://localhost:5173`, com hot reload.
5. Ajustar a URL da API em [`.env`](.env) (`VITE_API_BASE_URL`) se a porta do backend for diferente de `3000`.
6. Como não existe rota pública de cadastro (`POST /users` exige um GERENTE já autenticado), o primeiro usuário precisa ser inserido direto no MongoDB.

Para gerar a versão de produção: `npm run build` (saída em `dist/`) e `npm run preview` pra conferir o build localmente.

## 3. Estrutura de pastas

```
verti_frontend/
├── index.html                  → shell HTML único (SPA), monta <div id="root">
├── vite.config.js
├── .env                         → VITE_API_BASE_URL
├── src/
│   ├── main.jsx                 → ponto de entrada: providers (Router/Toast/Confirm/Auth) + <App/>
│   ├── App.jsx                  → todas as rotas da aplicação
│   ├── api/
│   │   └── client.js            → wrapper único de chamadas HTTP (fetch) + objeto `api`
│   ├── context/
│   │   ├── AuthContext.jsx      → sessão (token/usuário) + useAuth()
│   │   ├── ToastContext.jsx     → feedback de sucesso/erro + useToast()
│   │   └── ConfirmContext.jsx   → modal de confirmação como Promise + useConfirm()
│   ├── components/
│   │   ├── Layout.jsx           → topbar + navegação por perfil
│   │   ├── ProtectedRoute.jsx   → guarda de rota por perfil
│   │   └── StatusBadge.jsx      → badge colorido por status da OS
│   ├── pages/                   → uma tela por arquivo (ver seção 6)
│   ├── utils/format.js          → formatação de data/moeda
│   └── styles/style.css         → design system (tokens, componentes, layout)
└── legacy-static/                → versão anterior (HTML/CSS/JS puro), mantida só de referência
```

## 4. Autenticação e controle de acesso

- Login (`POST /auth/login`) devolve `{ token, usuario: { id, nome, email, perfil } }`, salvos no `localStorage` via `AuthContext` (`login()`/`logout()`).
- `<ProtectedRoute perfis={[...]}>` envolve cada rota protegida em `App.jsx`: sem sessão válida → redireciona pro login; perfil não autorizado naquela rota → redireciona pra home do perfil correto (`paginaInicialDoPerfil`).
- `api/client.js` injeta `Authorization: Bearer <token>` em toda chamada e trata `401` global: dispara um callback registrado pelo `AuthContext` (`registrarAoDeslogar`) que limpa a sessão — evitando import circular entre a camada de API e o contexto de auth.
- Não existe refresh token: expirando o JWT (7 dias, definido no backend), o próximo `401` já desloga o usuário.

## 5. Camada de API (`src/api/client.js`)

Um objeto `api` com um método por endpoint do backend, evitando repetir `fetch` com header/erro em cada página. Espelha exatamente o que existe no `verti_backend` (nenhuma rota inventada):

- **Auth**: `login`, `me`
- **Usuários** (GERENTE): `listarUsuarios`, `buscarUsuario`, `criarUsuario`, `editarUsuario`, `ativarUsuario`, `desativarUsuario`
- **OS — Pedreiro**: `listarMinhasOS`, `aceitarOS`, `recusarOS`, `concluirOS`
- **OS — Fiscal**: `listarOSFiscal`, `aprovarOS`, `reprovarOS`
- **OS — Gerente**: `criarOS`, `listarOSFinalizadas`, `listarOSGerente`, `editarOS`, `cancelarOS`
- **OS — compartilhado**: `buscarOSDetalhada`, `anexarArquivo` (multipart), `excluirAnexo`

Erros da API (`{ message }`) viram uma `ApiError` com `.message` pronto pra exibir num toast — nenhuma página precisa fazer parsing de resposta.

## 6. Rotas e telas

| Rota | Componente | Perfil | Descrição |
|---|---|---|---|
| `/login` | `Login.jsx` | público | Autenticação; já logado, redireciona pra home do perfil |
| `/pedreiro` | `Pedreiro.jsx` | PEDREIRO | "Minhas OS": aceitar/recusar/concluir |
| `/fiscal` | `Fiscal.jsx` | FISCAL | OS aguardando fiscalização: aprovar/reprovar |
| `/gerente` | `GerenteLista.jsx` | GERENTE | Listagem de OS com filtros + paginação |
| `/gerente/nova` | `GerenteNova.jsx` | GERENTE | Criação de OS: fila de pedreiros ordenável + fiscal |
| `/gerente/usuarios` | `GerenteUsuarios.jsx` | GERENTE | CRUD de usuários |
| `/os/:id` | `OsDetalhe.jsx` | qualquer autenticado | Detalhe de uma OS — ações mudam conforme quem está vendo |

## 7. Máquina de estados da OS, refletida na interface

O botão disponível em cada tela depende do `status` da OS e de quem está olhando — a interface não decide isso sozinha, só espelha o que o backend permite:

```
CRIADA → ATRIBUIDA → EM_ANDAMENTO → AGUARDANDO_FISCAL → FINALIZADA
             │              ↑              │
        (recusa) → próximo da fila     (reprova) → volta pro pedreiro
             │
        (fila acaba) → SEM_PEDREIRO
```

| Status | Quem vê a ação | Ação disponível |
|---|---|---|
| `ATRIBUIDA` | Pedreiro da vez | Aceitar / Recusar |
| `EM_ANDAMENTO` / `REPROVADA` | Pedreiro atual | Concluir (com observação) |
| `AGUARDANDO_FISCAL` | Fiscal responsável | Aprovar / Reprovar (com observação obrigatória) |
| Qualquer, exceto `FINALIZADA`/`CANCELADA` | Gerente criador | Cancelar |
| `FINALIZADA` | Gerente criador | Editar (regra do próprio backend — só edita depois de finalizada) |

Essa regra existe em código em dois lugares: nas listagens (`Pedreiro.jsx`, `Fiscal.jsx`) e em `OsDetalhe.jsx`, que é a única tela acessível a qualquer perfil.

## 8. Design system (`src/styles/style.css`)

- **Tokens em `:root`**: cores (`--cor-primaria`, `--cor-perigo`, `--cor-sucesso`...), raio de borda, sombra padrão. Trocar a identidade visual = editar essas variáveis, não caçar cor por componente.
- **Componentes reutilizáveis**: `.card`, `.btn` (variações `-primario/-perigo/-sucesso/-ghost`, tamanho `-sm`), `.badge` (uma cor por grupo de status — ver `StatusBadge.jsx`), `.input`/`select`/`textarea` com foco consistente, `.modal-overlay`/`.modal` (confirmações e formulários rápidos), `.toast` (feedback de sucesso/erro).
- **Layout fluido**: `.container` não tem largura máxima fixa — o conteúdo ocupa a tela toda, só com padding lateral. Formulários usam `.linha` (flex + `gap`) para quebrar campos em várias linhas conforme o espaço.
- **Responsivo mobile-first**: a topbar nasce empilhada (menu abaixo da marca, largura 100%) e só vira uma única linha a partir de `min-width: 720px` — ou seja, a base é o celular, o desktop é o "extra", não o contrário.
- **Badges de status**: cor por família de significado — azul (atribuída), âmbar (em andamento), roxo (aguardando fiscal), verde (aprovada/finalizada), vermelho (reprovada/sem pedreiro/cancelada) — pensado pra ser reconhecido de relance numa tabela cheia de linhas.

## 9. Padrões de código adotados

- **Português nos identificadores** (`carregar()`, `mostrarErro()`, `confirmar()`) — o time e o domínio do problema são em português; inglês só apareceria como tradução desnecessária.
- **Componentes funcionais + hooks** — `useState`/`useEffect`/`useCallback`; nenhum componente de classe.
- **Contextos no lugar de prop drilling**: sessão, toasts e o modal de confirmação são globais e raramente mudam de forma — Context API resolve sem precisar de uma lib de estado externa.
- **Modal de confirmação como Promise** (`useConfirm()`): `const ok = await confirmar({...})` — mesma ergonomia da versão estática anterior, só que sem manipular o DOM na mão.
- **Uma função por ação de UI**: cada botão (aceitar, recusar, concluir, aprovar...) confirma (via modal), chama a API, mostra o toast e recarrega os dados — o mesmo padrão se repete em todas as páginas.
- **Sem `dangerouslySetInnerHTML`**: todo texto vindo da API é renderizado via JSX normal, que o React já escapa — não há risco de XSS ao montar as telas.

## 10. Limitações conhecidas / próximos passos

- **CORS só habilitado localmente** — adicionado em `src/app.js` desta cópia do backend pra destravar os testes (ver item 2), mas ainda não está no repositório principal do backend. Precisa ser replicado lá.
- **Sem paginação de anexos/histórico** — listas longas na tela de detalhe carregam tudo de uma vez (aceitável no volume esperado do projeto).
- **Sem testes automatizados** — validação até aqui foi `npm run build` (compila JSX/bundla sem erros) + teste manual.
- **Sem cache/offline** — toda tela recarrega os dados da API a cada visita; não há service worker nem React Query/SWR.
