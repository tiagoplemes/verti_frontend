import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Pedreiro from "./pages/Pedreiro.jsx";
import Fiscal from "./pages/Fiscal.jsx";
import FiscalHistorico from "./pages/FiscalHistorico.jsx";
import GerenteLista from "./pages/GerenteLista.jsx";
import GerenteNova from "./pages/GerenteNova.jsx";
import GerenteUsuarios from "./pages/GerenteUsuarios.jsx";
import OsDetalhe from "./pages/OsDetalhe.jsx";

function Protegida({ perfis, children }) {
  return (
    <ProtectedRoute perfis={perfis}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/pedreiro" element={<Protegida perfis={["PEDREIRO"]}><Pedreiro /></Protegida>} />

      <Route path="/fiscal" element={<Protegida perfis={["FISCAL"]}><Fiscal /></Protegida>} />
      <Route path="/fiscal/historico" element={<Protegida perfis={["FISCAL"]}><FiscalHistorico /></Protegida>} />

      <Route path="/gerente" element={<Protegida perfis={["GERENTE"]}><GerenteLista /></Protegida>} />
      <Route path="/gerente/nova" element={<Protegida perfis={["GERENTE"]}><GerenteNova /></Protegida>} />
      <Route path="/gerente/usuarios" element={<Protegida perfis={["GERENTE"]}><GerenteUsuarios /></Protegida>} />

      <Route
        path="/os/:id"
        element={
          <Protegida perfis={["GERENTE", "FISCAL", "PEDREIRO"]}>
            <OsDetalhe />
          </Protegida>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
