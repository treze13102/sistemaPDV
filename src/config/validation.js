// Form rules for Settings > General, following the original's rules.

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/** Formats digits as CPF (000.000.000-00) or CNPJ (00.000.000/0000-00). */
export function formatDocument(value) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function validCPF(d) {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

function validCNPJ(d) {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = w.reduce((s, x, i) => s + x * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export function validate(values, t, { catalogActive }) {
  const errors = {};
  if (catalogActive && !values.name.trim()) errors.name = t.errStoreName;
  const doc = values.documentNumber.replace(/\D/g, "");
  if (doc && !(doc.length <= 11 ? validCPF(doc) : validCNPJ(doc))) errors.documentNumber = t.errDocument;
  const email = values.email.trim();
  if (email) {
    if (email.length < 3) errors.email = t.errEmailMin;
    else if (email.length > 128 || !EMAIL_RE.test(email)) errors.email = t.errEmail;
  }
  if (values.instagram && !values.instagram.startsWith("@")) errors.instagram = t.errInstagram;
  return errors;
}
