import { PriceHistory } from './PriceHistory.jsx';
import { useMemo, useState } from 'react';
import { useEstoqueSaldo, useMovimentosEstoque, useCriarMovimento } from '@/hooks/useEstoque';
import { useVariacoes } from '@/hooks/useVariacoes';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import { Field, PageHeader, Toolbar, SearchInput, GreenButton, SidePanel, EmptyState } from '../Shell.jsx';
import { fmtDia, fmtDateTime, semAcento, useMoney, useStore } from '../store.jsx';
import { useDraftGuard } from '../components/DraftGuard.jsx';
import VariationsPanel from '../components/VariationsPanel.jsx';
import './Operations.css';

export const LOCATIONS = [['Loja','Loja'],['Deposito','Depósito'],['Fabrica3D','Fábrica 3D'],['Consignado','Consignado']];
export const MOVEMENTS = { ENTRADA_COMPRA:'Entrada por compra', ENTRADA_PRODUCAO:'Entrada por produção', SAIDA_VENDA:'Saída por venda', SAIDA_PERDA:'Saída por perda', AJUSTE_INVENTARIO:'Ajuste de inventário' };
export const decimal = value => /^-?\d+(?:[.,]\d+)?$/.test(String(value).trim()) ? Number(String(value).trim().replace(',','.')) : NaN;
export function Select({ label, value, onChange, children, disabled }) { return <label className="ops-field">{label}<select aria-label={label} value={value} onChange={event=>onChange(event.target.value)} disabled={disabled}>{children}</select></label>; }
export function DateField({ label, value, onChange, disabled }) { return <label className="ops-field">{label}<input aria-label={label} type="date" value={value} onInput={event=>onChange(event.target.value)} onChange={event=>onChange(event.target.value)} disabled={disabled}/></label>; }
export function ErrorBox({ error }) { return error ? <p role="alert" className="alert">{error.message || error}</p> : null; }
export function QueryState({ query, children }) { return query.isLoading ? <p role="status" className="ops-note">Carregando…</p> : query.isError ? <><ErrorBox error={query.error}/><button className="kbtn kbtn--outline" onClick={()=>query.refetch()}>Tentar novamente</button></> : children; }

function MovementForm({ product, initialVariation, onClose, onSaved }) {
  const { data, notify } = useStore(); const save = useCriarMovimento(); const money=useMoney();
  const [id] = useState(()=>crypto.randomUUID());
  const [productId,setProductId]=useState(product?.id || ''); const [search,setSearch]=useState('');
  const [variation,setVariation]=useState(initialVariation || ''); const variants=useVariacoes(productId || null);
  const [type,setType]=useState('ENTRADA_COMPRA'); const [quantity,setQuantity]=useState('');
  const [location,setLocation]=useState(()=>carregarConfiguracoes().pdv.local_estoque_padrao || 'Loja');
  const [cost,setCost]=useState(''); const [expiry,setExpiry]=useState(''); const [note,setNote]=useState(''); const [error,setError]=useState('');
  const guard=useDraftGuard(!!(quantity || cost || expiry || note || search || productId !== (product?.id || '') || variation !== (initialVariation || '') || type !== 'ENTRADA_COMPRA'),save.isPending,onClose);
  const selected=data.products.find(p=>p.id===productId);
  const suggestions=useMemo(()=>{const term=semAcento(search);return term?data.products.filter(p=>p.active && [p.name,p.code,p.sku,p.barcode].some(v=>semAcento(v).includes(term))).slice(0,10):[];},[search,data.products]);
  const entry=type.startsWith('ENTRADA_');
  async function submit(event) {
    event.preventDefault(); if(save.isPending)return;setError('');
    if(!selected || (variantRequired() && !variation)){setError('Selecione o produto e a variação, quando houver.');return;}
    try {await save.mutateAsync({ id, produto_id:productId,variacao_id:variation && variation !== '__base' ? variation : null,tipo:type,quantidade:decimal(quantity),localizacao:location,custo_unitario:entry && cost!==''?decimal(cost):null,data_validade:entry?expiry || null:null,observacao:note.trim() || null });notify('Movimento de estoque registrado');onSaved();}
    catch(failure){setError(failure.message || 'Não foi possível registrar. Os dados foram mantidos.');}
  }
  /** Leitor de código de barras (digita + Enter): seleciona o produto ou a variação exata. */
  function lerCodigo(event){
    if(event.key!=='Enter')return; event.preventDefault();
    const codigo=search.trim(); if(!codigo)return;
    for(const p of data.products){const v=p.variations?.find(x=>x.barcode===codigo||x.sku===codigo);if(v){setProductId(p.id);setVariation(v.id);setSearch('');return;}}
    const p=data.products.find(x=>x.barcode===codigo||x.sku===codigo||x.code===codigo)||(suggestions.length===1?suggestions[0]:null);
    if(p){setProductId(p.id);setVariation('');setSearch('');}else setError(`Nenhum produto com o código "${codigo}".`);
  }
  function variantRequired(){return (variants.data?.length ?? 0)>0;}
  return <><SidePanel title="Registrar movimento de estoque" width={640} onClose={guard.close} footer={<><button className="kbtn kbtn--outline" onClick={guard.close} disabled={save.isPending}>Cancelar</button><button className="kbtn kbtn--primary" form="stock-movement" type="submit" disabled={save.isPending || variants.isLoading || variants.isError}>{save.isPending?'Registrando…':'Registrar movimento'}</button></>}><form id="stock-movement" className="ops-form" onSubmit={submit} noValidate>
    <span style={{display:'contents'}} onKeyDown={lerCodigo}><SearchInput value={search} onChange={setSearch} placeholder="Buscar ou escanear o código de barras" width="100%" disabled={save.isPending}/></span>
    {!!search && <div className="ops-suggestions">{suggestions.length?suggestions.map(p=><button key={p.id} type="button" disabled={save.isPending} onClick={()=>{setProductId(p.id);setVariation('');setSearch('');}}>{p.name}<small>{p.code}</small></button>):<p>Nenhum produto encontrado.</p>}</div>}
    <p className="ops-note">Produto selecionado: <strong>{selected?.name || 'Nenhum'}</strong></p>
    {variantRequired() && <Select label="Variação" value={variation} onChange={setVariation} disabled={save.isPending}><option value="">Selecione…</option><option value="__base">Produto base (sem variação)</option>{variants.data.map(v=><option key={v.id} value={v.id}>{v.nome}</option>)}</Select>}<ErrorBox error={variants.error}/>
    <Select label="Tipo de movimento" value={type} onChange={setType} disabled={save.isPending}>{Object.entries(MOVEMENTS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select>
    <div className="two"><Field label={type==='AJUSTE_INVENTARIO'?'Quantidade a acrescentar ou retirar':'Quantidade'} legend inputMode="decimal" value={quantity} onChange={setQuantity} disabled={save.isPending}/><Select label="Local do estoque" value={location} onChange={setLocation} disabled={save.isPending}>{LOCATIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></div>
    <p className="ops-note">{type==='AJUSTE_INVENTARIO'?'Informe a diferença: +5 acrescenta 5; −2 retira 2. O valor não substitui o saldo atual.':'Informe uma quantidade positiva, com até 3 casas decimais. Saídas reduzem o estoque automaticamente.'}</p>
    {entry && <div className="two"><Field label="Custo unitário (opcional)" legend value={cost} inputMode="decimal" onChange={setCost} disabled={save.isPending}/><DateField label="Validade (opcional)" value={expiry} onChange={setExpiry} disabled={save.isPending}/></div>}
    {entry && cost && Number.isFinite(decimal(cost)) && Number.isFinite(decimal(quantity)) && <p className="ops-note">Custo total: <strong>{money(decimal(cost)*decimal(quantity))}</strong></p>}
    <Field label="Observação" legend multiline rows={3} value={note} onChange={setNote} disabled={save.isPending}/><p className="ops-note">Compras de fornecedor devem ser recebidas pela tela Compras para vincular estoque e conta a pagar. Este movimento avulso altera apenas o estoque.</p><ErrorBox error={error}/>
  </form></SidePanel>{guard.dialog}</>;
}

export function MovementHistory({ productId }) {
  const query=useMovimentosEstoque(productId); const [shown,setShown]=useState(40); const money=useMoney();
  return <QueryState query={query}>{!query.data?.length?<p className="ops-note">Sem movimentações.</p>:<><ul className="ops-lines">{query.data?.slice(0,shown).map(m=><li key={m.id}><div><strong>{MOVEMENTS[m.tipo] || m.tipo}</strong><span>{fmtDateTime(m.data_hora)} · {LOCATIONS.find(([id])=>id===m.localizacao)?.[1] || m.localizacao}</span>{m.variacao && <span>{m.variacao.nome}</span>}{m.data_validade && <span>Validade: {fmtDia(m.data_validade)}</span>}{m.custo_unitario!=null && <span>Custo unitário: {money(Number(m.custo_unitario))}</span>}{m.observacao && <span>{m.observacao}</span>}</div><strong className={m.tipo.startsWith('SAIDA_') || Number(m.quantidade)<0?'ops-negative':'ops-positive'}>{m.tipo.startsWith('SAIDA_')?'−':Number(m.quantidade)>0?'+':''}{Number(m.quantidade)}</strong></li>)}</ul>{shown<(query.data?.length || 0) && <button className="kbtn kbtn--outline" onClick={()=>setShown(n=>n+40)}>Mostrar mais movimentos</button>}</>}</QueryState>;
}

export default function Stock() {
  const query=useEstoqueSaldo();const {data}=useStore(); const money=useMoney();
  const [search,setSearch]=useState('');const [location,setLocation]=useState('');const [status,setStatus]=useState('active');const [level,setLevel]=useState('');const [shown,setShown]=useState(60);
  const [selected,setSelected]=useState(null);const [movement,setMovement]=useState(null);const [variations,setVariations]=useState(null);
  const rows=useMemo(()=>{const term=semAcento(search);return(query.data || []).filter(row=>(!location || row.localizacao===location) && (status!=='active' || row.produto.status==='ativo') && (!term || [row.produto.nome,row.produto.sku,row.produto.codigo_barras,row.produto.descricao_curta,row.variacao?.nome].some(value=>semAcento(value).includes(term))) && (!level || (level==='empty'?row.saldo<=0:row.saldo<=Number(row.produto.estoque_minimo || 0))));},[query.data,search,location,status,level]);
  const selectedProduct=data.products.find(p=>p.id===selected);
  return <div className="page"><PageHeader title="Estoque" count={new Set(rows.map(r=>r.produto_id)).size}/><Toolbar><SearchInput value={search} onChange={v=>{setSearch(v);setShown(60);}} placeholder="Nome, código ou variação" width={320}/><Select label="Local" value={location} onChange={v=>{setLocation(v);setShown(60);}}><option value="">Todos os locais</option>{LOCATIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select><Select label="Saldo" value={level} onChange={setLevel}><option value="">Todos os saldos</option><option value="empty">Sem estoque</option><option value="low">No mínimo ou abaixo</option></Select><Select label="Produtos" value={status} onChange={setStatus}><option value="active">Ativos</option><option value="all">Todos</option></Select><div className="toolbar__spacer"/><GreenButton label="Novo movimento" onClick={()=>setMovement({})}/></Toolbar>
    <div className="ops-summary"><div>Produtos na seleção<strong>{new Set(rows.map(r=>r.produto_id)).size}</strong></div><div>Unidades na seleção<strong>{Number(rows.reduce((s,r)=>s+r.saldo,0).toFixed(3))}</strong></div><div>Custo estimado<strong>{money(rows.reduce((s,r)=>s+r.saldo*Number(r.produto.custo_medio_compra || 0),0))}</strong></div></div>
    <QueryState query={query}>{rows.length?<><div className="ops-table"><table><thead><tr><th>Produto / variação</th><th>Local</th><th className="num">Saldo</th><th className="num">Mínimo do produto</th><th className="num">Custo médio de compras</th></tr></thead><tbody>{rows.slice(0,shown).map(r=><tr key={`${r.produto_id}-${r.variacao_id || 'base'}-${r.localizacao}`}><td><button className="ops-link" onClick={()=>setSelected(r.produto_id)}>{r.produto.nome}</button><small>{r.variacao?.nome || 'Produto base'} · {r.produto.sku || 'Sem SKU'}</small></td><td>{LOCATIONS.find(([id])=>id===r.localizacao)?.[1] || r.localizacao}</td><td className={`num ${r.saldo<=0?'ops-negative':''}`}>{r.saldo}</td><td className="num">{Number(r.produto.estoque_minimo || 0)}</td><td className="num">{money(r.produto.custo_medio_compra)}</td></tr>)}</tbody></table></div>{shown<rows.length && <button className="kbtn kbtn--outline" onClick={()=>setShown(n=>n+60)}>Mostrar mais produtos</button>}</>:<EmptyState title="Nenhum produto encontrado" text="Ajuste os filtros ou cadastre um produto." help={false} size="sm"/>}</QueryState>
    {selectedProduct && <SidePanel title={selectedProduct.name} width={680} onClose={()=>setSelected(null)} footer={<><button className="kbtn kbtn--outline" onClick={()=>{setVariations(selectedProduct);setSelected(null);}}>Variações</button><button className="kbtn kbtn--primary" onClick={()=>{setMovement({product:selectedProduct});setSelected(null);}}>Registrar movimento</button></>}><h3>Histórico de preços</h3><PriceHistory productId={selected}/><h3>Histórico de estoque</h3><MovementHistory productId={selected}/></SidePanel>}
    {movement && <MovementForm {...movement} onClose={()=>setMovement(null)} onSaved={()=>setMovement(null)}/>}{variations && <VariationsPanel product={variations} onClose={()=>setVariations(null)}/>}
  </div>;
}

