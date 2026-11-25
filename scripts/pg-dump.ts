// Разбор data-only дампа pg_dump в текстовом формате: берём только блоки COPY ... FROM stdin.

export type PgRow = Record<string, string | null>;

const COPY_HEADER = /^COPY (?:public\.)?"?([A-Za-z_]+)"? \((.+)\) FROM stdin;$/;
const END_MARKER = '-- PostgreSQL database dump complete';

const ESCAPES: Record<string, string> = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v' };

const unescapeField = (field: string): string | null => {
  if (field === '\\N') return null;
  if (!field.includes('\\')) return field;
  // Всё прочее после обратной черты (в том числе сама черта) означает сам символ
  return field.replace(/\\(.)/g, (_, char: string) => ESCAPES[char] ?? char);
};

export const parsePgDump = (text: string): Map<string, PgRow[]> => {
  const tables = new Map<string, PgRow[]>();
  let current: { name: string; columns: string[]; rows: PgRow[] } | null = null;
  let complete = false;

  for (const raw of text.split('\n')) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;

    if (!current) {
      if (line === END_MARKER) complete = true;
      const header = COPY_HEADER.exec(line);
      if (!header) continue;
      const columns = header[2]!.split(', ').map((c) => c.replaceAll('"', ''));
      current = { name: header[1]!, columns, rows: [] };
      continue;
    }

    if (line === '\\.') {
      tables.set(current.name, current.rows);
      current = null;
      continue;
    }

    const fields = line.split('\t');
    if (fields.length !== current.columns.length) {
      throw new Error(
        `Таблица ${current.name}, строка ${current.rows.length + 1}: полей ${fields.length}, колонок ${current.columns.length}`,
      );
    }
    current.rows.push(
      Object.fromEntries(current.columns.map((column, i) => [column, unescapeField(fields[i]!)])),
    );
  }

  if (current) throw new Error(`Дамп обрезан: таблица ${current.name} не закончена`);
  if (!complete) throw new Error(`Дамп обрезан: в конце нет строки «${END_MARKER}»`);
  return tables;
};

const raw = (row: PgRow, column: string): string | null => {
  const value = row[column];
  if (value === undefined) throw new Error(`В дампе нет колонки ${column}`);
  return value;
};

export const text = (row: PgRow, column: string): string => {
  const value = raw(row, column);
  if (value === null) throw new Error(`Пустое значение (NULL) в колонке ${column}`);
  return value;
};

export const optionalText = (row: PgRow, column: string): string | null => raw(row, column);

export const int = (row: PgRow, column: string): number => {
  const value = text(row, column);
  const number = Number(value);
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(number)) {
    throw new Error(`Не целое число в колонке ${column}: ${value}`);
  }
  return number;
};

export const bool = (row: PgRow, column: string): boolean => {
  const value = text(row, column);
  if (value !== 't' && value !== 'f') throw new Error(`Не boolean в колонке ${column}: ${value}`);
  return value === 't';
};

// Prisma хранит в Postgres timestamp(3) без зоны, значения в UTC
const parseDate = (value: string, column: string): Date => {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Не дата в колонке ${column}: ${value}`);
  return date;
};

export const date = (row: PgRow, column: string): Date => parseDate(text(row, column), column);

export const optionalDate = (row: PgRow, column: string): Date | null => {
  const value = raw(row, column);
  return value === null ? null : parseDate(value, column);
};
