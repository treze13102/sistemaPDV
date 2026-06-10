import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { EstoquePanel } from '@/pages/Estoque';
import { gerarRelatorioEstoque } from '@/lib/relatorioEstoque';

export default function Produtos() {
  const [relatorioLoading, setRelatorioLoading] = useState(false);

  async function handleRelatorio() {
    try {
      setRelatorioLoading(true);
      await gerarRelatorioEstoque();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRelatorioLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Saldo, custo, preço e movimentos"
        actions={
          <Button variant="outline" onClick={handleRelatorio} disabled={relatorioLoading}>
            <FileText className="mr-2 h-4 w-4" /> {relatorioLoading ? 'Gerando...' : 'Relatório de estoque'}
          </Button>
        }
      />
      <div className="p-4 sm:p-6">
        <EstoquePanel />
      </div>
    </>
  );
}
