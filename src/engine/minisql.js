/**
 * MiniSQL — 支持 SELECT / WHERE / ORDER BY / LIMIT 与少量聚合函数。
 * 仅用于小镇里的查询练习，不连接任何真实数据库。
 */

class SqlError extends Error {}

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  let line = 1;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === '\n') {
      line++;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
        if (sql[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let value = '';
      i++;
      let closed = false;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            value += quote;
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        value += sql[i];
        i++;
      }
      if (!closed) throw new SqlError('字符串缺少结尾的引号');
      tokens.push({ type: 'STRING', value, line });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < sql.length && /[0-9.]/.test(sql[j])) j++;
      const text = sql.slice(i, j);
      const num = Number(text);
      if (!Number.isFinite(num)) throw new SqlError(`数字「${text}」不太对`);
      tokens.push({ type: 'NUMBER', value: num, line });
      i = j;
      continue;
    }
    if (/[\p{L}_]/u.test(ch)) {
      let j = i + 1;
      while (j < sql.length && /[\p{L}\p{N}_]/u.test(sql[j])) j++;
      tokens.push({ type: 'NAME', value: sql.slice(i, j), line });
      i = j;
      continue;
    }
    if (ch === ';') {
      i++;
      continue;
    }
    const two = sql.slice(i, i + 2);
    if (two === '>=' || two === '<=' || two === '!=' || two === '<>') {
      tokens.push({ type: 'OP', value: two, line });
      i += 2;
      continue;
    }
    if ('=<>*(),'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch, line });
      i++;
      continue;
    }
    throw new SqlError(`不认识的字符「${ch}」`);
  }
  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

class SqlParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
  }

  next() {
    return this.tokens[this.pos++];
  }

  isKeyword(kw) {
    const t = this.peek();
    return t.type === 'NAME' && t.value.toLowerCase() === kw.toLowerCase();
  }

  matchKeyword(kw) {
    if (this.isKeyword(kw)) {
      this.pos++;
      return true;
    }
    return false;
  }

  expectKeyword(kw) {
    if (!this.matchKeyword(kw)) throw new SqlError(`这里需要 ${kw.toUpperCase()}`);
  }

  expectOp(op) {
    const t = this.next();
    if (t.type !== 'OP' || t.value !== op) throw new SqlError(`这里需要「${op}」`);
    return t;
  }

  expectName(what = '名字') {
    const t = this.next();
    if (t.type !== 'NAME') throw new SqlError(`这里需要一个${what}`);
    return t.value;
  }

  parse() {
    this.expectKeyword('select');
    const select = this.parseSelectList();
    this.expectKeyword('from');
    const table = this.expectName('表名');
    let where = null;
    if (this.matchKeyword('where')) where = this.parseOr();
    let orderBy = null;
    if (this.matchKeyword('order')) {
      this.expectKeyword('by');
      const column = this.expectName('排序列名');
      let dir = 'asc';
      if (this.matchKeyword('desc')) dir = 'desc';
      else this.matchKeyword('asc');
      orderBy = { column, dir };
    }
    let limit = null;
    if (this.matchKeyword('limit')) {
      const t = this.next();
      if (t.type !== 'NUMBER' || !Number.isInteger(t.value) || t.value < 0) {
        throw new SqlError('LIMIT 后面需要一个非负整数');
      }
      limit = t.value;
    }
    if (this.peek().type !== 'EOF') {
      throw new SqlError(`SELECT 语句末尾有没看懂的内容：「${this.peek().value}」`);
    }
    return { select, table, where, orderBy, limit };
  }

  parseSelectList() {
    const items = [];
    while (true) {
      items.push(this.parseSelectItem());
      if (this.peek().type === 'OP' && this.peek().value === ',') {
        this.next();
        continue;
      }
      break;
    }
    return items;
  }

  parseSelectItem() {
    if (this.peek().type === 'OP' && this.peek().value === '*') {
      this.next();
      return { kind: 'star' };
    }
    const t = this.peek();
    if (t.type === 'NAME') {
      const upper = t.value.toUpperCase();
      if (['COUNT', 'AVG', 'SUM', 'MIN', 'MAX'].includes(upper) && this.peek(1).type === 'OP' && this.peek(1).value === '(') {
        this.next();
        this.expectOp('(');
        let arg;
        if (this.peek().type === 'OP' && this.peek().value === '*') {
          this.next();
          arg = '*';
        } else {
          arg = this.expectName('列名');
        }
        this.expectOp(')');
        let alias = null;
        if (this.matchKeyword('as')) alias = this.expectName('别名');
        return { kind: 'aggregate', fn: upper, arg, alias };
      }
      this.next();
      let alias = null;
      if (this.matchKeyword('as')) alias = this.expectName('别名');
      return { kind: 'column', name: t.value, alias };
    }
    throw new SqlError('SELECT 后面需要列名、*，或者 COUNT / AVG 之类的聚合函数');
  }

  parseOr() {
    let node = this.parseAnd();
    while (this.matchKeyword('or')) {
      node = { type: 'or', left: node, right: this.parseAnd() };
    }
    return node;
  }

  parseAnd() {
    let node = this.parseComparison();
    while (this.matchKeyword('and')) {
      node = { type: 'and', left: node, right: this.parseComparison() };
    }
    return node;
  }

  parseComparison() {
    const column = this.expectName('条件里的列名');
    const t = this.next();
    if (t.type !== 'OP' || !['=', '!=', '<>', '>', '<', '>=', '<='].includes(t.value)) {
      throw new SqlError('WHERE 条件里需要一个比较符号，例如 =、> 或 <');
    }
    const lit = this.peek();
    let value;
    if (lit.type === 'STRING' || lit.type === 'NUMBER') {
      value = lit.value;
      this.next();
    } else {
      throw new SqlError('WHERE 里比较的值需要是数字或带引号的文字');
    }
    return { type: 'compare', column, op: t.value === '<>' ? '!=' : t.value, value };
  }
}

function buildPredicate(node, table) {
  const indexOf = (col) => {
    const idx = table.columns.indexOf(col);
    if (idx === -1) throw new SqlError(`「${table.label || 'students'}」里没有名为「${col}」的列`);
    return idx;
  };
  const evalNode = (n) => (row) => {
    if (n.type === 'and') {
      const l = evalNode(n.left);
      const r = evalNode(n.right);
      return l(row) && r(row);
    }
    if (n.type === 'or') {
      const l = evalNode(n.left);
      const r = evalNode(n.right);
      return l(row) || r(row);
    }
    const idx = indexOf(n.column);
    const cell = row[idx];
    switch (n.op) {
      case '=': return cell === n.value;
      case '!=': return cell !== n.value;
      case '>': return cell > n.value;
      case '<': return cell < n.value;
      case '>=': return cell >= n.value;
      case '<=': return cell <= n.value;
      default: return false;
    }
  };
  return evalNode(node);
}

export function runSQL(sql, tables) {
  try {
    const query = new SqlParser(tokenize(sql)).parse();
    const table = tables[query.table];
    if (!table) {
      throw new SqlError(`没有找到名为「${query.table}」的表。小镇里现在只有 students 表。`);
    }
    const colIndex = (col) => {
      const idx = table.columns.indexOf(col);
      if (idx === -1) throw new SqlError(`students 表里没有名为「${col}」的列`);
      return idx;
    };

    let rows = table.rows.map((r) => [...r]);
    if (query.where) {
      const pred = buildPredicate(query.where, table);
      rows = rows.filter((row) => pred(row));
    }

    if (query.orderBy) {
      const idx = colIndex(query.orderBy.column);
      rows.sort((a, b) => {
        const av = a[idx];
        const bv = b[idx];
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (query.orderBy.dir === 'desc' ? -1 : 1);
      });
    }

    if (query.limit !== null) rows = rows.slice(0, query.limit);

    const hasAggregate = query.select.some((s) => s.kind === 'aggregate');
    const hasStar = query.select.some((s) => s.kind === 'star');
    const hasPlain = query.select.some((s) => s.kind === 'column');

    if (hasAggregate && (hasStar || hasPlain)) {
      throw new SqlError('聚合函数暂时不能和普通列混在一起（还没有教 GROUP BY）');
    }

    if (hasAggregate) {
      const columns = [];
      const resultRow = [];
      for (const item of query.select) {
        if (item.kind !== 'aggregate') continue;
        const source = item.arg === '*' ? null : colIndex(item.arg);
        const values = source === null ? rows : rows.map((r) => r[source]);
        let value = null;
        if (item.fn === 'COUNT') value = source === null ? rows.length : values.filter((v) => v !== null).length;
        if (item.fn === 'SUM') value = values.reduce((a, b) => a + Number(b), 0);
        if (item.fn === 'AVG') {
          const numeric = values.map(Number).filter((n) => !Number.isNaN(n));
          value = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;
          if (value !== null) value = Math.round(value * 1e10) / 1e10;
        }
        if (item.fn === 'MIN') value = values.length ? values.reduce((a, b) => (b < a ? b : a), values[0]) : null;
        if (item.fn === 'MAX') value = values.length ? values.reduce((a, b) => (b > a ? b : a), values[0]) : null;
        const name = item.alias || `${item.fn.toLowerCase()}(${item.arg})`;
        columns.push(name);
        resultRow.push(value);
      }
      return { ok: true, columns, rows: [resultRow], error: null };
    }

    let columns;
    let projected;
    if (hasStar) {
      columns = [...table.columns];
      projected = rows;
    } else {
      const indexes = query.select.map((item) => colIndex(item.name));
      columns = query.select.map((item) => item.alias || item.name);
      projected = rows.map((row) => indexes.map((idx) => row[idx]));
    }
    return { ok: true, columns, rows: projected, error: null };
  } catch (err) {
    if (err instanceof SqlError) {
      return { ok: false, columns: [], rows: [], error: err.message };
    }
    console.error('[MiniSQL]', err);
    return { ok: false, columns: [], rows: [], error: '查询时遇到了一点问题，检查一下语句吧' };
  }
}

function visualWidth(text) {
  let width = 0;
  for (const ch of String(text)) {
    width += /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1;
  }
  return width;
}

function padCell(text, width) {
  const str = String(text);
  return str + ' '.repeat(Math.max(0, width - visualWidth(str)));
}

export function formatSQLResult(result) {
  if (!result.ok) return '';
  const columns = result.columns;
  const widths = columns.map((col, i) => {
    let w = visualWidth(col);
    for (const row of result.rows) w = Math.max(w, visualWidth(row[i] ?? ''));
    return w;
  });
  const header = columns.map((c, i) => padCell(c, widths[i])).join(' | ');
  const divider = widths.map((w) => '-'.repeat(w)).join('-+-');
  const rows = result.rows.map((row) => row.map((cell, i) => padCell(cell ?? 'NULL', widths[i])).join(' | '));
  return [header, divider, ...rows].join('\n');
}

export function sameResult(actual, expected) {
  if (!actual || !expected) return false;
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.columns.some((c, i) => c !== expected.columns[i])) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  for (let r = 0; r < expected.rows.length; r++) {
    for (let c = 0; c < expected.rows[r].length; c++) {
      const a = actual.rows[r][c];
      const b = expected.rows[r][c];
      if (typeof a === 'number' && typeof b === 'number') {
        if (Math.abs(a - b) > 1e-9) return false;
      } else if (String(a) !== String(b)) {
        return false;
      }
    }
  }
  return true;
}
