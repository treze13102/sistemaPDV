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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteFornecedor, useFornecedores, useUpsertFornecedor } from '@/hooks/useFornecedores';
import { maskCpfCnpj, maskPhone } from '@/lib/utils';
import type { Fornecedor } from '@/types/database';

const schema = z.object({
  razao_social: z.string().min(1, 'Obrigatório'),
  cnpj: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  endereco: z.string().nullable().optional(),
  condicoes_comerciais_padrao: z.string().nullable().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Fornecedores() {
  const { data, isLoading } = useFornecedores();
  const upsert = useUpsertFornecedor();
  const del = useDeleteFornecedor();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  function openNew() {
    setEditing(null);
    form.reset({ razao_social: '', cnpj: '', telefone: '', email: '', endereco: '', condicoes_comerciais_padrao: '' });
    setOpen(true);
  }
  function openEdit(f: Fornecedor) {
    setEditing(f);
    form.reset({
      razao_social: f.razao_social,
      cnpj: f.cnpj ?? '',
      telefone: f.telefone ?? '',
      email: f.email ?? '',
      endereco: f.endereco ?? '',
      condicoes_comerciais_padrao: f.condicoes_comerciais_padrao ?? '',
    });
    setOpen(true);
  }
  async function onSubmit(v: FormData) {
    try {
      await upsert.mutateAsync({ ...v, email: v.email || null, id: editing?.id });
      toast.success(editing ? 'Atualizado' : 'Criado');
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  }
  async function onDelete(id: string) {
    if (!confirm('Excluir fornecedor?')) return;
    try { await del.mutateAsync(id); toast.success('Excluído'); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores"
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo fornecedor</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum fornecedor</TableCell></TableRow>
              )}
              {data?.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.razao_social}</TableCell>
                  <TableCell>{f.cnpj ?? '—'}</TableCell>
                  <TableCell>{f.telefone ?? '—'}</TableCell>
                  <TableCell>{f.email ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>Razão social *</Label>
              <Input {...form.register('razao_social')} />
              {form.formState.errors.razao_social && <p className="text-sm text-destructive">{form.formState.errors.razao_social.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={form.watch('cnpj') ?? ''}
                onChange={(e) => form.setValue('cnpj', maskCpfCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.watch('telefone') ?? ''}
                onChange={(e) => form.setValue('telefone', maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="contato@fornecedor.com" {...form.register('email')} />
            </div>
            <div className="space-y-2 col-span-2"><Label>Endereço</Label><Input {...form.register('endereco')} /></div>
            <div className="space-y-2 col-span-2"><Label>Condições comerciais</Label><Textarea {...form.register('condicoes_comerciais_padrao')} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
