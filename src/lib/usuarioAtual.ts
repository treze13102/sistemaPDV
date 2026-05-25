import { supabase } from '@/lib/supabase';

export async function getUsuarioAtualId(): Promise<string | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) return null;

  const { data: usuario, error: selectError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) {
    console.warn('Nao foi possivel consultar o usuario atual.', selectError);
    return null;
  }

  if (usuario?.id) return usuario.id;

  const { data: perfil } = await supabase
    .from('perfis_acesso')
    .select('id')
    .eq('nome', 'PDV_Vendas')
    .maybeSingle();

  const nomeMetadata = user.user_metadata?.nome;
  const nome = typeof nomeMetadata === 'string' && nomeMetadata.trim() ? nomeMetadata : user.email ?? 'Usuario';
  const email = user.email ?? `${user.id}@usuario-local.test`;

  const { error: insertError } = await supabase.from('usuarios').insert({
    id: user.id,
    nome,
    email,
    perfil_acesso_id: perfil?.id ?? null,
  });

  if (insertError) {
    const { data: usuarioCriado } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (usuarioCriado?.id) return usuarioCriado.id;

    console.warn('Nao foi possivel criar o perfil local do usuario atual.', insertError);
    return null;
  }

  return user.id;
}
