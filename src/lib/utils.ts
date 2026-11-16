import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Detecta 'YYYY-MM-DD' puro (coluna `date`), sem hora nem fuso. */
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(value: string | Date): string {
  let d: Date;
  if (typeof value === 'string') {
    // O JS parseia 'YYYY-MM-DD' como meia-noite UTC. Em fuso negativo (Brasil)
    // isso exibiria o DIA ANTERIOR — errado para validade, vencimento etc.
    // Acrescentar a hora força a interpretação no fuso local.
    d = SO_DATA.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  } else {
    d = value;
  }
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

// Máscaras BR. Aceitam string e retornam string formatada.
export function maskCpfCnpj(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 14);
  if (d.length === 0) return '';
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  // CNPJ: 00.000.000/0000-00
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function maskPhone(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 10) {
    return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a.length === 2 && ') ', b, c && `-${c}`].filter(Boolean).join('')
    );
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export function maskCep(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function unmaskDigits(v: string): string {
  return (v ?? '').replace(/\D/g, '');
}
