export function validarMovimento(input: {produto_id:string;tipo:string;quantidade:number;localizacao:string;custo_unitario?:number|null;data_validade?:string|null}) {
  if (!input.produto_id) throw new Error('Selecione um produto.');
  if (!['ENTRADA_COMPRA','ENTRADA_PRODUCAO','SAIDA_VENDA','SAIDA_PERDA','AJUSTE_INVENTARIO'].includes(input.tipo)) throw new Error('Tipo de movimento inválido.');
  if (!['Loja','Deposito','Fabrica3D','Consignado'].includes(input.localizacao)) throw new Error('Selecione um local de estoque válido.');
  const q=input.quantidade;
  if (!Number.isFinite(q) || q===0 || Math.abs(q)>=1e9 || Math.abs(q*1000-Math.round(q*1000))>0.00001 || (input.tipo!=='AJUSTE_INVENTARIO' && q<0)) throw new Error('Informe uma quantidade válida e diferente de zero, com até 3 casas decimais. Somente ajustes aceitam quantidade negativa.');
  const cost=input.custo_unitario;
  if (cost!=null && (!Number.isFinite(cost) || cost<0 || cost>=1e10 || Math.abs(cost*100-Math.round(cost*100))>0.00001)) throw new Error('Informe um custo não negativo, com até 2 casas decimais.');
  if (input.data_validade) {
    const value=input.data_validade, d=new Date(value+'T00:00:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+d) || d.getFullYear()!==Number(value.slice(0,4)) || d.getMonth()+1!==Number(value.slice(5,7)) || d.getDate()!==Number(value.slice(8,10))) throw new Error('Informe uma data de validade válida.');
    if (input.tipo.startsWith('SAIDA_')) throw new Error('A validade deve ser informada na entrada do estoque.');
  }
}
