import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Categorias from '@/pages/Categorias';
import Produtos from '@/pages/Produtos';
import Clientes from '@/pages/Clientes';
import Fornecedores from '@/pages/Fornecedores';
import Estoque from '@/pages/Estoque';
import PDV from '@/pages/PDV';
import Financeiro from '@/pages/Financeiro';
import PedidosCompra from '@/pages/PedidosCompra';
import Vendas from '@/pages/Vendas';
import Relatorios from '@/pages/Relatorios';
import Configuracoes from '@/pages/Configuracoes';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="fornecedores" element={<Fornecedores />} />
        <Route path="pdv" element={<PDV />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="pedidos-compra" element={<PedidosCompra />} />
        <Route path="vendas" element={<Vendas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  );
}
