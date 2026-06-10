import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClientes, useDeleteCliente, useUpsertCliente } from '@/hooks/useClientes';
import { maskCpfCnpj, maskPhone } from '@/lib/utils';
import type { Cliente } from '@/types/database';

const schema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  telefone: z.string().nullable().optional(),
  email: z.string().email().nullable().or(z.literal('')).optional(),
  cpf_cnpj: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  data_aniversario: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Clientes() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useClientes(search);
  const upsert = useUpsertCliente();
  const del = useDeleteCliente();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  function openNew() {
    setEditing(null);
    form.reset({ nome: '', telefone: '', email: '', cpf_cnpj: '', endereco: '', data_aniversario: '', observacao: '' });
    setOpen(true);
  }
  function openEdit(c: Cliente) {
    setEditing(c);
    form.reset({
      nome: c.nome,
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      cpf_cnpj: c.cpf_cnpj ?? '',
      endereco: c.endereco ?? '',
      data_aniversario: c.data_aniversario ?? '',
      observacao: c.observacao ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(v: FormData) {
    try {
      await upsert.mutateAsync({
        ...v,
        email: v.email || null,
        data_aniversario: v.data_aniversario || null,
        id: editing?.id,
      });
      toast.success(editing ? 'Cliente atualizado' : 'Cliente criado');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function onDelete(id: string) {
    if (!confirm('Excluir cliente?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Excluído');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes"
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo cliente
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum cliente</TableCell></TableRow>
              )}
              {data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.telefone ?? '—'}</TableCell>
                  <TableCell>{c.email ?? '—'}</TableCell>
                  <TableCell>{c.cpf_cnpj ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>Nome *</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}
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
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@exemplo.com" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                value={form.watch('cpf_cnpj') ?? ''}
                onChange={(e) => form.setValue('cpf_cnpj', maskCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2"><Label>Aniversário</Label><Input type="date" {...form.register('data_aniversario')} /></div>
            <div className="space-y-2 col-span-2"><Label>Endereço</Label><Input placeholder="Rua, número, bairro, cidade/UF" {...form.register('endereco')} /></div>
            <div className="space-y-2 col-span-2"><Label>Observação</Label><Textarea {...form.register('observacao')} /></div>
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
