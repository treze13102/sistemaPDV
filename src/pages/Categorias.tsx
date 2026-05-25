import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategorias, useDeleteCategoria, useUpsertCategoria } from '@/hooks/useCategorias';
import type { Categoria, CategoriaTipo } from '@/types/database';

const TIPOS: CategoriaTipo[] = ['Presentes', 'Perfumes', 'Folheados', 'Bolsas', 'Itens_3D', 'Insumos_3D', 'Outros'];

const schema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  tipo: z.enum(['Presentes', 'Perfumes', 'Folheados', 'Bolsas', 'Itens_3D', 'Insumos_3D', 'Outros']),
  categoria_pai_id: z.string().nullable().optional(),
  markup_minimo_pct: z.coerce.number().nullable().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function Categorias() {
  const { data, isLoading } = useCategorias();
  const upsert = useUpsertCategoria();
  const del = useDeleteCategoria();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', tipo: 'Outros', categoria_pai_id: null, markup_minimo_pct: null },
  });

  function openNew() {
    setEditing(null);
    form.reset({ nome: '', tipo: 'Outros', categoria_pai_id: null, markup_minimo_pct: null });
    setOpen(true);
  }

  function openEdit(c: Categoria) {
    setEditing(c);
    form.reset({
      nome: c.nome,
      tipo: c.tipo,
      categoria_pai_id: c.categoria_pai_id,
      markup_minimo_pct: c.markup_minimo_pct,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormOutput) {
    try {
      await upsert.mutateAsync({
        ...values,
        categoria_pai_id: values.categoria_pai_id || null,
        id: editing?.id,
      });
      toast.success(editing ? 'Categoria atualizada' : 'Categoria criada');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Excluir categoria?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Categoria excluída');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const byId = new Map((data ?? []).map((c) => [c.id, c]));

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Categorias hierárquicas dos produtos"
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova categoria
          </Button>
        }
      />
      <div className="p-6">
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria pai</TableHead>
                <TableHead>Markup mínimo (%)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </TableCell>
                </TableRow>
              )}
              {data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell>{c.categoria_pai_id ? byId.get(c.categoria_pai_id)?.nome ?? '—' : '—'}</TableCell>
                  <TableCell>{c.markup_minimo_pct ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.watch('tipo')} onValueChange={(v) => form.setValue('tipo', v as CategoriaTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria pai (opcional)</Label>
              <Select
                value={form.watch('categoria_pai_id') ?? '__none__'}
                onValueChange={(v) => form.setValue('categoria_pai_id', v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Nenhuma —</SelectItem>
                  {(data ?? []).filter((c) => c.id !== editing?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Markup mínimo (%)</Label>
              <Input type="number" step="0.01" {...form.register('markup_minimo_pct')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
