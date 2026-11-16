import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buscarTodos } from '@/lib/buscarTodos';
import { buildComprovanteHtml, imprimirComprovante, gerarPdfComprovante } from '@/lib/comprovante';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import { receiptData } from '../receiptData.js';
import { useStore } from '../store.jsx';
import './Operations.css';

export const readReceiptConfig=carregarConfiguracoes;
function useReceipt(sale){
  const {data,config}=useStore();
  const query=useQuery({queryKey:['recibo',sale.id],enabled:!!sale.id,queryFn:async()=>await buscarTodos(()=>supabase.from('parcelas_financeiras').select('numero_parcela,valor_bruto,valor,data_vencimento,forma_pagamento').eq('origem_tipo','VENDA').eq('origem_id',sale.id).in('forma_pagamento',['CREDIARIO','FIADO']).order('numero_parcela').order('id'))});
  return {query,config:config || carregarConfiguracoes(),value:receiptData(sale,data,query.data)};
}
export function Receipt({sale}){
  const {query,config,value}=useReceipt(sale);
  if(query.isLoading)return <p role="status">Carregando recibo…</p>;
  if(query.isError)return <div role="alert" className="alert">Não foi possível carregar as parcelas do recibo. <button className="kbtn kbtn--outline" onClick={()=>query.refetch()}>Tentar novamente</button></div>;
  return <iframe className="receipt-frame" sandbox="" title={`Cupom da venda ${sale.number}`} srcDoc={buildComprovanteHtml(value,{autoPrint:false},config)}/>;
}
export function ReceiptActions({sale, autoPrint=false}){
  const {query,config,value}=useReceipt(sale);
  const printed=useRef(false);
  useEffect(()=>{if(autoPrint && config.impressao.auto_abrir_impressao && !query.isLoading && !query.isError && !printed.current){printed.current=true;imprimirComprovante(value);}},[autoPrint,config,query.isLoading,query.isError,value]);
  return <><button type="button" className="kbtn kbtn--outline" disabled={query.isLoading || query.isError} onClick={()=>imprimirComprovante(value)}>Imprimir recibo</button><button type="button" className="kbtn kbtn--outline" disabled={query.isLoading || query.isError} onClick={()=>gerarPdfComprovante(value)}>Gerar PDF</button></>;
}
