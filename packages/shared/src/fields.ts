// Field definitions for business records. One definition drives the API's validation and the
// web app's forms and detail views, so the two can't drift. Custom fields (phase 2) will produce
// the same shape from the database.

export type FieldType =
  | 'text'
  | 'longtext'
  | 'email'
  | 'url'
  | 'phone'
  | 'enum'
  | 'date'
  | 'ref'
  | 'user'
  | 'money'
  | 'int'
  | 'currency'
  | 'tags';

export type FieldDef = {
  /** API / JSON key (camelCase). */
  key: string;
  /** Database column (snake_case). */
  column: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  /** For `enum`. */
  options?: readonly string[];
  /** For `ref`: the resource it points at (`companies`, `contacts`, `stages`…), same module. */
  ref?: string;
  /** Shown in forms; false hides it (set by the server or a dedicated control). */
  editable?: boolean;
};

export type RecordValues = Record<string, unknown>;

export type ValidationResult = { values: RecordValues; errors: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

function checkOne(f: FieldDef, raw: unknown): { value?: unknown; error?: string } {
  if (isBlank(raw)) {
    if (f.required) return { error: `${f.label} is required` };
    return { value: f.type === 'tags' ? [] : f.type === 'money' || f.type === 'int' ? 0 : null };
  }
  const max = f.max ?? (f.type === 'longtext' ? 10000 : 300);
  switch (f.type) {
    case 'text':
    case 'longtext':
    case 'phone': {
      if (typeof raw !== 'string') return { error: `${f.label} must be text` };
      const v = raw.trim();
      if (v.length > max) return { error: `${f.label} must be at most ${max} characters` };
      return { value: v };
    }
    case 'email': {
      const v = String(raw).trim().toLowerCase();
      if (!EMAIL_RE.test(v)) return { error: `${f.label} must be a valid email address` };
      return { value: v };
    }
    case 'url': {
      let v = String(raw).trim();
      if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
      if (v.length > max || !/^https?:\/\/[^\s/?#.]+\.[^\s]+$/i.test(v)) return { error: `${f.label} must be a web address` };
      return { value: v };
    }
    case 'enum':
      if (!f.options?.includes(String(raw))) return { error: `${f.label} must be one of ${f.options?.join(', ')}` };
      return { value: String(raw) };
    case 'date':
      if (typeof raw !== 'string' || !DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) {
        return { error: `${f.label} must be a date (YYYY-MM-DD)` };
      }
      return { value: raw };
    case 'ref':
    case 'user':
      if (typeof raw !== 'string' || !UUID_RE.test(raw)) return { error: `${f.label} is not a valid choice` };
      return { value: raw };
    case 'money':
    case 'int': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isSafeInteger(n) || n < 0) return { error: `${f.label} must be a whole number of 0 or more` };
      return { value: n };
    }
    case 'currency': {
      const v = String(raw).trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(v)) return { error: `${f.label} must be a three-letter currency code` };
      return { value: v };
    }
    case 'tags': {
      const list = Array.isArray(raw) ? raw : String(raw).split(',');
      const tags = [...new Set(list.map((t) => String(t).trim()).filter(Boolean))];
      if (tags.length > 20 || tags.some((t) => t.length > 40)) return { error: `${f.label}: up to 20 tags of 40 characters` };
      return { value: tags };
    }
  }
}

/**
 * Checks a request body against field definitions. With `partial` (PATCH), only keys present
 * are checked; otherwise every field is (missing optional fields become empty).
 * Unknown keys are ignored. Returns values keyed by API key.
 */
export function validateRecord(fields: readonly FieldDef[], body: RecordValues, partial = false): ValidationResult {
  const values: RecordValues = {};
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.editable === false) continue;
    if (partial && !(f.key in body)) continue;
    const { value, error } = checkOne(f, body[f.key]);
    if (error) errors[f.key] = error;
    else values[f.key] = value;
  }
  return { values, errors };
}

/** Converts minor units to a decimal string for inputs ("123456" USD → "1234.56"). */
export function minorToInput(amountMinor: number, digits: number): string {
  return digits === 0 ? String(amountMinor) : (amountMinor / 10 ** digits).toFixed(digits);
}

/** Parses a decimal input into minor units, or null if it isn't a valid amount. */
export function inputToMinor(input: string, digits: number): number | null {
  const s = input.replace(/,/g, '').trim();
  if (s === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [whole = '0', frac = ''] = s.split('.');
  if (frac.length > digits) return null;
  const n = Number(whole) * 10 ** digits + Number(frac.padEnd(digits, '0') || 0);
  return Number.isSafeInteger(n) ? n : null;
}
