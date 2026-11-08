/**
 * PyLite — 一个够用的 Python 小子集，用于小镇里的编程练习。
 * 支持：变量、算术、字符串 / f-string、列表、if/elif/else、for、while、
 * len/range/sum/min/max/round 等少量内置函数。
 */

class PyError extends Error {
  constructor(message, line = 0) {
    super(message);
    this.name = 'PyError';
    this.line = line;
  }
}

const KEYWORD_LIKE = new Set(['if', 'elif', 'else', 'for', 'in', 'while', 'break', 'continue', 'and', 'or', 'not']);

class Tokenizer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.line = 0;
    this.bracketDepth = 0;
  }

  error(message, line) {
    throw new PyError(message, line || this.line);
  }

  tokenize() {
    const rawLines = this.source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const indents = [0];

    for (let i = 0; i < rawLines.length; i++) {
      this.line = i + 1;
      let line = rawLines[i].replace(/\t/g, '    ');
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (this.bracketDepth === 0) {
        if (trimmed.startsWith('#')) continue;
        const indent = line.match(/^ */)[0].length;
        const current = indents[indents.length - 1];
        if (indent > current) {
          this.tokens.push({ type: 'INDENT', value: '', line: this.line });
          indents.push(indent);
        } else if (indent < current) {
          while (indents.length > 1 && indent < indents[indents.length - 1]) {
            indents.pop();
            this.tokens.push({ type: 'DEDENT', value: '', line: this.line });
          }
          if (indent !== indents[indents.length - 1]) {
            this.error('这一行的缩进层级和上面的代码对不上');
          }
        }
        line = line.slice(indent);
      }

      this.scanLine(line);
      if (this.bracketDepth < 0) this.error('出现了多余的右括号');
      if (this.bracketDepth === 0) {
        this.tokens.push({ type: 'NEWLINE', value: '', line: this.line });
      }
    }

    if (this.bracketDepth > 0) this.error('还有括号没有闭合');
    while (indents.length > 1) {
      indents.pop();
      this.tokens.push({ type: 'DEDENT', value: '', line: rawLines.length });
    }
    this.tokens.push({ type: 'EOF', value: '', line: rawLines.length });
    return this.tokens;
  }

  scanLine(line) {
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') {
        i++;
        continue;
      }
      if (ch === '#') return;

      const start = i;
      const next = line[i + 1];

      if ((ch === 'f' || ch === 'F') && (next === '"' || next === "'")) {
        const result = this.readString(line, i + 1, true);
        this.tokens.push({ type: 'FSTRING', value: result.value, line: this.line });
        i = result.end;
        continue;
      }

      if (ch === '"' || ch === "'") {
        const result = this.readString(line, i, false);
        this.tokens.push({ type: 'STRING', value: result.value, line: this.line });
        i = result.end;
        continue;
      }

      if (/[0-9]/.test(ch)) {
        let j = i;
        while (j < line.length && /[0-9]/.test(line[j])) j++;
        if (line[j] === '.' && /[0-9]/.test(line[j + 1] || '')) {
          j++;
          while (j < line.length && /[0-9]/.test(line[j])) j++;
        }
        const text = line.slice(i, j);
        this.tokens.push({ type: 'NUMBER', value: text.includes('.') ? parseFloat(text) : parseInt(text, 10), line: this.line });
        i = j;
        continue;
      }

      if (/[\p{L}_]/u.test(ch)) {
        let j = i + 1;
        while (j < line.length && /[\p{L}\p{N}_]/u.test(line[j])) j++;
        this.tokens.push({ type: 'NAME', value: line.slice(i, j), line: this.line });
        i = j;
        continue;
      }

      const two = line.slice(i, i + 2);
      if (['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/='].includes(two)) {
        this.tokens.push({ type: 'OP', value: two, line: this.line });
        i += 2;
        if (two === '(' || two === '[') this.bracketDepth++;
        continue;
      }

      if ('+-*/%<>=()[],:'.includes(ch)) {
        this.tokens.push({ type: 'OP', value: ch, line: this.line });
        if (ch === '(' || ch === '[') this.bracketDepth++;
        if (ch === ')' || ch === ']') this.bracketDepth--;
        i++;
        continue;
      }

      this.error(`不认识字符「${ch}」`);
    }
    if (i <= line.length && this.bracketDepth < 0) this.error('出现了多余的右括号');
  }

  readString(line, start, isF) {
    const quote = line[start];
    let value = '';
    let i = start + 1;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '\\') {
        const esc = line[i + 1];
        const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'" };
        value += map[esc] ?? esc;
        i += 2;
        continue;
      }
      if (ch === quote) {
        return { value, end: i + 1 };
      }
      value += ch;
      i++;
    }
    this.error('字符串没有闭合，检查一下引号');
  }
}

class Parser {
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

  matchOp(value) {
    const t = this.peek();
    if (t.type === 'OP' && t.value === value) {
      this.pos++;
      return true;
    }
    return false;
  }

  matchName(value) {
    const t = this.peek();
    if (t.type === 'NAME' && t.value === value) {
      this.pos++;
      return true;
    }
    return false;
  }

  expectOp(value) {
    const t = this.next();
    if (t.type !== 'OP' || t.value !== value) {
      throw new PyError(`这里需要一个「${value}」`, t.line);
    }
    return t;
  }

  expectName() {
    const t = this.next();
    if (t.type !== 'NAME') throw new PyError('这里需要一个变量名', t.line);
    return t;
  }

  skipNewlines() {
    while (this.peek().type === 'NEWLINE') this.next();
  }

  parseProgram() {
    const body = [];
    this.skipNewlines();
    while (this.peek().type !== 'EOF') {
      if (this.peek().type === 'DEDENT') {
        throw new PyError('出现了没有对应代码块的缩进', this.peek().line);
      }
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    return body;
  }

  parseStatement() {
    const t = this.peek();
    if (t.type === 'NAME') {
      if (t.value === 'if') return this.parseIf();
      if (t.value === 'for') return this.parseFor();
      if (t.value === 'while') return this.parseWhile();
      if (t.value === 'break' || t.value === 'continue') {
        this.next();
        const node = { type: t.value, line: t.line };
        this.consumeLineEnd();
        return node;
      }
    }
    return this.parseSimpleStatement();
  }

  parseSimpleStatement() {
    const line = this.peek().line;
    if (this.peek().type === 'NAME' && this.peek(1).type === 'OP' && ['=', '+=', '-=', '*=', '/='].includes(this.peek(1).value)) {
      const name = this.next().value;
      const op = this.next().value;
      const expr = this.parseExpression();
      this.consumeLineEnd();
      return { type: 'assign', name, op, expr, line };
    }
    const expr = this.parseExpression();
    this.consumeLineEnd();
    return { type: 'expr', expr, line };
  }

  consumeLineEnd() {
    const t = this.peek();
    if (t.type === 'NEWLINE') {
      this.next();
      return;
    }
    if (t.type === 'EOF' || t.type === 'DEDENT') return;
    throw new PyError('这一行末尾还有没看懂的内容', t.line);
  }

  parseSuite() {
    const t = this.peek();
    if (t.type !== 'NEWLINE') throw new PyError('冒号后面需要换行并缩进', t.line);
    this.next();
    if (this.peek().type !== 'INDENT') {
      throw new PyError('这里需要一句缩进的代码', this.peek().line);
    }
    this.next();
    const body = [];
    while (this.peek().type !== 'DEDENT' && this.peek().type !== 'EOF') {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    if (this.peek().type === 'DEDENT') this.next();
    if (!body.length) throw new PyError('代码块里至少要有一行代码');
    return body;
  }

  parseIf() {
    const line = this.next().line;
    const branches = [];
    const cond = this.parseExpression();
    this.expectOp(':');
    const body = this.parseSuite();
    branches.push({ cond, body });
    this.skipNewlines();
    while (this.matchName('elif')) {
      const c = this.parseExpression();
      this.expectOp(':');
      branches.push({ cond: c, body: this.parseSuite() });
      this.skipNewlines();
    }
    let elseBody = null;
    if (this.matchName('else')) {
      this.expectOp(':');
      elseBody = this.parseSuite();
    }
    return { type: 'if', branches, elseBody, line };
  }

  parseFor() {
    const line = this.next().line;
    const nameTok = this.expectName();
    if (!this.matchName('in')) throw new PyError('for 循环里需要 in', this.peek().line);
    const iterable = this.parseExpression();
    this.expectOp(':');
    const body = this.parseSuite();
    return { type: 'for', name: nameTok.value, iterable, body, line };
  }

  parseWhile() {
    const line = this.next().line;
    const cond = this.parseExpression();
    this.expectOp(':');
    const body = this.parseSuite();
    return { type: 'while', cond, body, line };
  }

  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.matchName('or')) {
      const right = this.parseAnd();
      left = { type: 'binary', op: 'or', left, right, line: left.line || 0 };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.matchName('and')) {
      const right = this.parseNot();
      left = { type: 'binary', op: 'and', left, right, line: left.line || 0 };
    }
    return left;
  }

  parseNot() {
    if (this.matchName('not')) {
      return { type: 'unary', op: 'not', expr: this.parseNot(), line: this.peek().line };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAdd();
    while (this.peek().type === 'OP' && ['==', '!=', '<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseAdd();
      left = { type: 'binary', op, left, right, line: left.line || 0 };
    }
    return left;
  }

  parseAdd() {
    let left = this.parseMul();
    while (this.peek().type === 'OP' && ['+', '-'].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseMul();
      left = { type: 'binary', op, left, right, line: left.line || 0 };
    }
    return left;
  }

  parseMul() {
    let left = this.parseUnary();
    while (this.peek().type === 'OP' && ['*', '/', '//', '%'].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseUnary();
      left = { type: 'binary', op, left, right, line: left.line || 0 };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === 'OP' && ['-', '+'].includes(this.peek().value)) {
      const op = this.next().value;
      return { type: 'unary', op, expr: this.parseUnary(), line: this.peek().line };
    }
    return this.parsePower();
  }

  parsePower() {
    const left = this.parsePostfix();
    if (this.peek().type === 'OP' && this.peek().value === '**') {
      this.next();
      const right = this.parseUnary();
      return { type: 'binary', op: '**', left, right, line: left.line || 0 };
    }
    return left;
  }

  parsePostfix() {
    let node = this.parsePrimary();
    while (true) {
      if (this.matchOp('(')) {
        const args = [];
        if (!this.matchOp(')')) {
          do {
            args.push(this.parseExpression());
          } while (this.matchOp(','));
          this.expectOp(')');
        }
        node = { type: 'call', callee: node, args, line: node.line };
      } else if (this.matchOp('[')) {
        const index = this.parseExpression();
        this.expectOp(']');
        node = { type: 'index', object: node, index, line: node.line };
      } else {
        break;
      }
    }
    return node;
  }

  parsePrimary() {
    const t = this.next();
    if (t.type === 'NUMBER') return { type: 'number', value: t.value, line: t.line };
    if (t.type === 'STRING') return { type: 'string', value: t.value, line: t.line };
    if (t.type === 'FSTRING') return { type: 'fstring', value: t.value, line: t.line };
    if (t.type === 'NAME') {
      if (t.value === 'True') return { type: 'literal', value: true, line: t.line };
      if (t.value === 'False') return { type: 'literal', value: false, line: t.line };
      if (t.value === 'None') return { type: 'literal', value: null, line: t.line };
      if (t.value === 'and' || t.value === 'or' || t.value === 'not' || t.value === 'in') {
        throw new PyError(`关键字「${t.value}」不能单独放在这里`, t.line);
      }
      return { type: 'name', value: t.value, line: t.line };
    }
    if (t.type === 'OP' && t.value === '(') {
      const expr = this.parseExpression();
      this.expectOp(')');
      return expr;
    }
    if (t.type === 'OP' && t.value === '[') {
      const items = [];
      if (!this.matchOp(']')) {
        do {
          items.push(this.parseExpression());
        } while (this.matchOp(','));
        this.expectOp(']');
      }
      return { type: 'list', items, line: t.line };
    }
    if (t.type === 'EOF') throw new PyError('代码似乎还没写完');
    throw new PyError('这里有一个我没法理解的写法', t.line);
  }
}

class BreakSignal extends Error {}
class ContinueSignal extends Error {}

const builtins = {
  print: (...args) => {
    state.output.push(args.map(display).join(' '));
    if (state.output.length > 400) throw new PyError('输出太多啦，程序被叫停了');
    return null;
  },
  len: (value) => {
    if (typeof value === 'string' || Array.isArray(value)) return value.length;
    throw new PyError('len() 只能数文字或列表的长度');
  },
  range: (a, b, c) => {
    let start = 0;
    let end = 0;
    let step = 1;
    if (b === undefined) {
      end = Number(a);
    } else {
      start = Number(a);
      end = Number(b);
      if (c !== undefined) step = Number(c);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step === 0) {
      throw new PyError('range() 的参数需要是整数，且步长不能为 0');
    }
    const out = [];
    if (step > 0) {
      for (let i = start; i < end && out.length <= 10000; i += step) out.push(i);
    } else {
      for (let i = start; i > end && out.length <= 10000; i += step) out.push(i);
    }
    if (out.length > 10000) throw new PyError('range() 太大了，换个小一点的数字吧');
    return out;
  },
  sum: (value, start = 0) => {
    if (!Array.isArray(value)) throw new PyError('sum() 需要一个列表');
    return value.reduce((acc, n) => acc + Number(n), Number(start));
  },
  min: (...args) => {
    const list = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    if (!list.length) throw new PyError('min() 里没有可以比较的内容');
    return list.reduce((a, b) => (b < a ? b : a));
  },
  max: (...args) => {
    const list = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    if (!list.length) throw new PyError('max() 里没有可以比较的内容');
    return list.reduce((a, b) => (b > a ? b : a));
  },
  round: (value, digits = 0) => {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new PyError('round() 需要一个数字');
    const p = Math.pow(10, Number(digits));
    return Math.round(n * p) / p;
  },
  abs: (value) => Math.abs(Number(value)),
  str: (value) => display(value),
  int: (value) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) throw new PyError('int() 没法把这个值变成整数');
    return n;
  },
  float: (value) => {
    const n = parseFloat(value);
    if (Number.isNaN(n)) throw new PyError('float() 没法把这个值变成小数');
    return n;
  },
  sorted: (value) => {
    if (!Array.isArray(value)) throw new PyError('sorted() 需要一个列表');
    return [...value].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  }
};

let state = null;

function display(value) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') {
    if (Object.is(value, -0)) return '0';
    return String(value);
  }
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return `[${value.map((v) => (typeof v === 'string' ? `'${v}'` : display(v))).join(', ')}]`;
  }
  return String(value);
}

function truthy(value) {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function makeEnv() {
  return new Map();
}

function lookup(env, name, line) {
  if (env.has(name)) return env.get(name);
  if (Object.prototype.hasOwnProperty.call(builtins, name)) return builtins[name];
  throw new PyError(`变量「${name}」还没有被定义`, line);
}

function numeric(a, b, op, line) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new PyError(`「${op}」需要两个数字，但拿到的是 ${describeType(a)} 和 ${describeType(b)}`, line);
  }
}

function describeType(value) {
  if (typeof value === 'string') return '文字';
  if (typeof value === 'number') return '数字';
  if (typeof value === 'boolean') return '真假值';
  if (Array.isArray(value)) return '列表';
  if (typeof value === 'function') return '函数';
  return '空值';
}

function pyBinop(op, a, b, line) {
  switch (op) {
    case '+':
      if (typeof a === 'number' && typeof b === 'number') return a + b;
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      throw new PyError('「+」只能连接两个数字、两段文字或两个列表', line);
    case '-':
      numeric(a, b, op, line);
      return a - b;
    case '*': {
      if (typeof a === 'number' && typeof b === 'number') return a * b;
      if (typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, Math.floor(b)));
      if (typeof a === 'number' && typeof b === 'string') return b.repeat(Math.max(0, Math.floor(a)));
      if (Array.isArray(a) && typeof b === 'number') {
        const out = [];
        for (let i = 0; i < Math.max(0, Math.floor(b)); i++) out.push(...a);
        return out;
      }
      throw new PyError('「*」只能乘数字，或用数字重复文字 / 列表', line);
    }
    case '/': {
      numeric(a, b, op, line);
      if (b === 0) throw new PyError('不能除以 0', line);
      return a / b;
    }
    case '//': {
      numeric(a, b, op, line);
      if (b === 0) throw new PyError('不能除以 0', line);
      return Math.floor(a / b);
    }
    case '%': {
      numeric(a, b, op, line);
      if (b === 0) throw new PyError('不能对 0 取余', line);
      return ((a % b) + b) % b;
    }
    case '**': {
      numeric(a, b, op, line);
      return Math.pow(a, b);
    }
    case '==': return deepEqual(a, b);
    case '!=': return !deepEqual(a, b);
    case '<': return a < b;
    case '>': return a > b;
    case '<=': return a <= b;
    case '>=': return a >= b;
    default:
      throw new PyError(`还不支持运算符「${op}」`, line);
  }
}

function deepEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  return a === b;
}

function evalNode(node, env) {
  switch (node.type) {
    case 'number':
    case 'string':
    case 'literal':
      return node.value;
    case 'name':
      return lookup(env, node.value, node.line);
    case 'list':
      return node.items.map((n) => evalNode(n, env));
    case 'fstring':
      return interpolate(node.value, env, node.line);
    case 'unary': {
      const value = evalNode(node.expr, env);
      if (node.op === 'not') return !truthy(value);
      if (node.op === '-') {
        if (typeof value !== 'number') throw new PyError('负号只能用在数字前面', node.line);
        return -value;
      }
      return Number(value);
    }
    case 'binary': {
      if (node.op === 'and') {
        const left = evalNode(node.left, env);
        return truthy(left) ? evalNode(node.right, env) : left;
      }
      if (node.op === 'or') {
        const left = evalNode(node.left, env);
        return truthy(left) ? left : evalNode(node.right, env);
      }
      return pyBinop(node.op, evalNode(node.left, env), evalNode(node.right, env), node.line);
    }
    case 'index': {
      const obj = evalNode(node.object, env);
      const idx = evalNode(node.index, env);
      if (!Array.isArray(obj) && typeof obj !== 'string') throw new PyError('只有文字和列表可以用 [ ] 取内容', node.line);
      let i = Number(idx);
      if (!Number.isInteger(i)) throw new PyError('列表的编号需要是整数', node.line);
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) throw new PyError('取的位置超出了范围', node.line);
      return obj[i];
    }
    case 'call': {
      if (node.callee.type !== 'name') throw new PyError('这里只能调用现成的函数', node.line);
      const name = node.callee.value;
      let fn;
      if (env.has(name)) fn = env.get(name);
      else fn = builtins[name];
      if (typeof fn !== 'function') throw new PyError(`还不认识函数「${name}」`, node.line);
      const args = node.args.map((a) => evalNode(a, env));
      try {
        return fn(...args);
      } catch (err) {
        if (err instanceof PyError) {
          if (!err.line) err.line = node.line;
          throw err;
        }
        throw new PyError(err.message || '运行时出现了问题', node.line);
      }
    }
    default:
      throw new PyError('内部错误：未知表达式');
  }
}

function interpolate(raw, env, line) {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '{') {
      if (raw[i + 1] === '{') {
        out += '{';
        i += 2;
        continue;
      }
      let depth = 1;
      let j = i + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === '{') depth++;
        if (raw[j] === '}') depth--;
        j++;
      }
      if (depth !== 0) throw new PyError('f-string 里的花括号没有闭合', line);
      const exprSrc = raw.slice(i + 1, j - 1);
      const value = evalExpressionSource(exprSrc, env, line);
      out += display(value);
      i = j;
      continue;
    }
    if (ch === '}' && raw[i + 1] === '}') {
      out += '}';
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function evalExpressionSource(source, env, line) {
  const tokens = new Tokenizer(source).tokenize();
  const parser = new Parser(tokens);
  const expr = parser.parseExpression();
  if (parser.peek().type !== 'NEWLINE' && parser.peek().type !== 'EOF') {
    throw new PyError('f-string 里的表达式有点问题', line);
  }
  return evalNode(expr, env);
}

function execBlock(body, env) {
  for (const stmt of body) {
    execStatement(stmt, env);
    if (state.steps++ > 20000) throw new PyError('程序跑了太久，先停在这里。检查一下循环吧', stmt.line);
  }
}

function execStatement(stmt, env) {
  switch (stmt.type) {
    case 'assign': {
      let value = evalNode(stmt.expr, env);
      if (stmt.op !== '=') {
        const current = lookup(env, stmt.name, stmt.line);
        value = pyBinop(stmt.op[0], current, value, stmt.line);
      }
      env.set(stmt.name, value);
      break;
    }
    case 'expr':
      evalNode(stmt.expr, env);
      break;
    case 'if': {
      for (const branch of stmt.branches) {
        if (truthy(evalNode(branch.cond, env))) {
          execBlock(branch.body, env);
          return;
        }
      }
      if (stmt.elseBody) execBlock(stmt.elseBody, env);
      break;
    }
    case 'for': {
      const iterable = evalNode(stmt.iterable, env);
      if (typeof iterable === 'string') {
        for (const ch of iterable) {
          env.set(stmt.name, ch);
          try {
            execBlock(stmt.body, env);
          } catch (err) {
            if (err instanceof BreakSignal) return;
            if (err instanceof ContinueSignal) continue;
            throw err;
          }
        }
        break;
      }
      if (!Array.isArray(iterable)) throw new PyError('for 循环需要一个列表或 range()', stmt.line);
      for (const item of iterable) {
        env.set(stmt.name, item);
        try {
          execBlock(stmt.body, env);
        } catch (err) {
          if (err instanceof BreakSignal) return;
          if (err instanceof ContinueSignal) continue;
          throw err;
        }
      }
      break;
    }
    case 'while': {
      let guard = 0;
      while (truthy(evalNode(stmt.cond, env))) {
        if (guard++ > 10000) throw new PyError('while 循环停不下来了，检查一下条件', stmt.line);
        try {
          execBlock(stmt.body, env);
        } catch (err) {
          if (err instanceof BreakSignal) break;
          if (err instanceof ContinueSignal) continue;
          throw err;
        }
      }
      break;
    }
    case 'break':
      throw new BreakSignal();
    case 'continue':
      throw new ContinueSignal();
    default:
      throw new PyError('内部错误：未知语句', stmt.line);
  }
}

export function runPython(source) {
  const output = [];
  state = { output, steps: 0 };
  try {
    const tokens = new Tokenizer(source).tokenize();
    const parser = new Parser(tokens);
    const program = parser.parseProgram();
    const env = makeEnv();
    execBlock(program, env);
    return { ok: true, output, error: null };
  } catch (err) {
    if (err instanceof PyError) {
      return {
        ok: false,
        output,
        error: err.line ? `第 ${err.line} 行：${err.message}` : err.message
      };
    }
    console.error('[PyLite]', err);
    return { ok: false, output, error: '程序运行时遇到了一点问题，检查一下代码吧' };
  } finally {
    state = null;
  }
}

export function normalizeOutput(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}
