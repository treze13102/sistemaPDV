# -*- coding: utf-8 -*-
"""Gera seed SQL a partir do Controle_Estoque.xlsx.
Saida: supabase/seed_estoque.sql  (rodar no SQL Editor do Supabase)."""
import openpyxl, re, unicodedata, os

XLSX = r'c:\Users\Safetec\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\93CFA0B27313CC34281422D5AB6755BEA80AC446\transfers\2026-24\Controle_Estoque.xlsx'
OUT = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'seed_estoque.sql')

# categoria nome -> tipo enum
CAT_TIPO = {
    'Perfumaria': 'Perfumes',
    'Cabelos': 'Outros',
    'Corpo e Banho': 'Outros',
    'Rosto e Skincare': 'Outros',
    'Maquiagem': 'Outros',
    'Desodorantes': 'Outros',
    'Bolsas e Carteiras': 'Bolsas',
    'Acessorios e Kits': 'Presentes',
    'Outros': 'Outros',
}

PERF_LINES = ['essencial','kaiak','luna','homem','ilia','una ','biografia','humor',
 'sintonia','hoje','revelar','malbec','egeo','lily','coffee','floratta','quasar',
 'zaad','glamour','accordes','make b','linda','dream','elysee','arbo','uomo','siena',
 'liz ','my life','la vie','o.u.i','oui','liberdade','amei','ousadia','soul','divine',
 'niina','jolie','vermelho','spirit','intensy','realce','sou ','seducao','21 ']

def norm(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii','ignore').decode()
    return re.sub(r'\s+',' ',s).lower().strip()

def classify(name):
    n = norm(name)
    if re.search(r'carteira|mochila|bolsa|porta cartao', n): return 'Bolsas e Carteiras'
    if 'chaveiro' in n: return 'Acessorios e Kits'
    if re.search(r'\bperf\b|perfume|\bedp\b|\bedt\b|colonia|deo parfum|deo colonia|body spray|eau de|\bsplash\b|\bdeo col', n): return 'Perfumaria'
    if re.search(r'shampoo|condicionador|leave|capilar|cabelo|tonalizante|matizador|escova|pentear|finalizador|siage|lumina|\bmatch\b|cauterizac|volumiz|fios\b', n): return 'Cabelos'
    if re.search(r'\bbatom\b|gloss|po compacto|delineador|rimel|cilios|\bblush\b|corretivo|sombra|labial|esmalte|iluminador|\bprimer\b|aquarela|\bfaces\b|\bmake\b', n): return 'Maquiagem'
    if re.search(r'desodorante|antitransp|roll-?on|\bdeo\b', n): return 'Desodorantes'
    if re.search(r'hidratante|locao|oleo corporal|esfoliante|sabonete|banho|maos|tododia|cuide-se|nativa spa|emulsao|talco|manteiga|polpa|firmador|creme corporal|seve|corpo|shower', n): return 'Corpo e Banho'
    if re.search(r'serum|facial|rosto|olhos|anti-?idade|antissinais|fps|protetor solar|\bsolar\b|micelar|tonico|chronos|renew|hialuron|gel creme', n): return 'Rosto e Skincare'
    if re.search(r'touca|necessaire|\bkit\b|frasco|borrif|sache|\bpente\b|acessorio|brinde|caixa', n): return 'Acessorios e Kits'
    for L in PERF_LINES:
        if L in n: return 'Perfumaria'
    if re.search(r'\b\d+ ?ml\b', n): return 'Perfumaria'
    return 'Outros'

# marca -> fornecedor razao_social
BRAND_FIX = {'Boticário':'O Boticário','Botic rio':'O Boticário',' Botic rio':'O Boticário',
             'Arabe':'Perfumaria Árabe','O.U.i':'O.U.i','Mahogany':'Mahogany',
             'Jequiti':'Jequiti','Eudora':'Eudora','Natura':'Natura','Avon':'Avon'}
def brand(m):
    if m is None: return None
    m = str(m).strip()
    return BRAND_FIX.get(m, m)

def sql_str(s):
    if s is None: return 'null'
    return "'" + str(s).replace("'", "''") + "'"

def num(x):
    return 'null' if x is None else f'{float(x):.2f}'

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb.active
rows = [r for r in list(ws.iter_rows(values_only=True))[1:] if r[0]]

# coletar marcas
brands = sorted({brand(r[1]) for r in rows if r[1] is not None})

lines = []
lines.append('-- Seed Controle de Estoque (gerado de Controle_Estoque.xlsx)')
lines.append('-- Rodar no SQL Editor do Supabase. Idempotente via ON CONFLICT.')
lines.append('begin;')
lines.append('')

# categorias (sem unique em nome -> NOT EXISTS para idempotencia)
lines.append('-- CATEGORIAS')
for n, t in CAT_TIPO.items():
    lines.append(f"insert into categorias (nome, tipo) select {sql_str(n)}, '{t}'::categoria_tipo "
                 f"where not exists (select 1 from categorias where nome = {sql_str(n)});")
lines.append('')

# fornecedores (sem unique em razao_social -> NOT EXISTS)
lines.append('-- FORNECEDORES (marcas)')
for b in brands:
    lines.append(f"insert into fornecedores (razao_social) select {sql_str(b)} "
                 f"where not exists (select 1 from fornecedores where razao_social = {sql_str(b)});")
lines.append('')

# produtos
lines.append('-- PRODUTOS')
lines.append("insert into produtos (sku, nome, codigo_barras, categoria_id, fornecedor_principal_id, custo_aquisicao, preco_venda_padrao, status) values")
pvals = []
seed_rows = []  # (sku, qty) p/ estoque
for i, r in enumerate(rows, start=1):
    nome = str(r[0]).strip()
    marca = brand(r[1])
    qty = r[2] or 0
    barcode = None if r[3] is None else str(int(r[3])) if isinstance(r[3],(int,float)) else str(r[3])
    venda = r[5]
    custo = r[7] if r[7] is not None else (round(venda*0.7,2) if venda is not None else 0)
    cat = classify(nome)
    sku = f'ROY-{i:04d}'
    cat_sub = f"(select id from categorias where nome = {sql_str(cat)} limit 1)"
    forn_sub = "null" if marca is None else f"(select id from fornecedores where razao_social = {sql_str(marca)} limit 1)"
    pvals.append(f"  ({sql_str(sku)}, {sql_str(nome)}, {sql_str(barcode)}, {cat_sub}, {forn_sub}, {num(custo)}, {num(venda) if venda is not None else '0'}, 'ativo'::produto_status)")
    seed_rows.append((sku, qty))
lines.append(',\n'.join(pvals))
lines.append('on conflict (sku) do update set')
lines.append('  nome = excluded.nome, codigo_barras = excluded.codigo_barras,')
lines.append('  categoria_id = excluded.categoria_id, fornecedor_principal_id = excluded.fornecedor_principal_id,')
lines.append('  custo_aquisicao = excluded.custo_aquisicao, preco_venda_padrao = excluded.preco_venda_padrao;')
lines.append('')

# estoque inicial (movimentos) — apenas qty > 0, evita duplicar via origem_tipo SEED
lines.append('-- ESTOQUE INICIAL (entrada de inventario)')
lines.append("delete from movimentos_estoque where origem_tipo = 'SEED_PLANILHA';")
lines.append("insert into movimentos_estoque (produto_id, tipo, quantidade, localizacao, custo_unitario, origem_tipo, observacao)")
mvals = []
for sku, qty in seed_rows:
    if qty and qty > 0:
        mvals.append(f"select id, 'ENTRADA_COMPRA'::movimento_tipo, {float(qty):.3f}, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = {sql_str(sku)}")
lines.append('\nunion all\n'.join(mvals) + ';')
lines.append('')
lines.append('commit;')

sql = '\n'.join(lines)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(sql)

# stats
from collections import Counter
cats = Counter(classify(str(r[0])) for r in rows)
print('produtos:', len(rows))
print('categorias:', dict(cats))
print('fornecedores:', brands)
print('arquivo:', os.path.abspath(OUT))
