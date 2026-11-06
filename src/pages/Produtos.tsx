import { useState } from 'react';
import { CalendarClock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { EstoquePanel } from '@/pages/Estoque';
import { gerarRelatorioEstoque } from '@/lib/relatorioEstoque';
import { gerarRelatorioValidade } from '@/lib/relatorioValidade';

export default function Produtos() {
  const [relatorioLoading, setRelatorioLoading] = useState(false);
  const [validadeLoading, setValidadeLoading] = useState(false);

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

  async function handleRelatorioValidade() {
    try {
      setValidadeLoading(true);
      await gerarRelatorioValidade();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setValidadeLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Saldo, custo, preço e movimentos"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRelatorio} disabled={relatorioLoading}>
              <FileText className="mr-2 h-4 w-4" /> {relatorioLoading ? 'Gerando...' : 'Relatório de estoque'}
            </Button>
            <Button variant="outline" onClick={handleRelatorioValidade} disabled={validadeLoading}>
              <CalendarClock className="mr-2 h-4 w-4" /> {validadeLoading ? 'Gerando...' : 'Relatório de validade'}
            </Button>
          </div>
        }
      />
      <div className="p-4 sm:p-6">
        <EstoquePanel />
      </div>
    </>
  );
}
