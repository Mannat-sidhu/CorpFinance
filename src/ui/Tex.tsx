// Renders the small TeX subset used in content: \frac{}{}, ^{}, _{}, \text{}, and a few symbols.
import { Fragment, type ReactNode } from 'react';

const SYMBOLS: Record<string, string> = {
  times: '×',
  cdot: '·',
  approx: '≈',
  infty: '∞',
  to: '→',
  le: '≤',
  ge: '≥',
  ne: '≠',
  cdots: '⋯',
  ldots: '…',
  quad: ' ',
  qquad: '  ',
  ',': ' ',
  $: '$',
  '%': '%',
};

function parse(src: string, i: number, stop: string | null, key: { n: number }): [ReactNode[], number] {
  const out: ReactNode[] = [];
  let buf = '';
  const flush = () => {
    if (!buf) return;
    // Italicise single-letter variables, as in printed maths.
    const parts = buf.split(/(?<![A-Za-z])([A-Za-z])(?![A-Za-z])/);
    parts.forEach((p, idx) => {
      if (!p) return;
      out.push(idx % 2 === 1 ? <i key={key.n++}>{p}</i> : <Fragment key={key.n++}>{p.replace(/-/g, '−')}</Fragment>);
    });
    buf = '';
  };
  const group = (at: number): [ReactNode[], number] => {
    if (src[at] !== '{') return [[src[at] ?? ''], at + 1];
    return parse(src, at + 1, '}', key);
  };
  while (i < src.length) {
    const ch = src[i];
    if (stop && ch === stop) {
      flush();
      return [out, i + 1];
    }
    if (ch === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(src.slice(i))!;
      const name = m[1];
      i += m[0].length;
      if (name === 'left' || name === 'right') {
        flush();
        out.push(
          <span className="big-paren" key={key.n++}>
            {src[i]}
          </span>,
        );
        i += 1;
      } else if (name === 'frac') {
        flush();
        const [num, a] = group(i);
        const [den, b] = group(a);
        i = b;
        out.push(
          <span className="frac" key={key.n++}>
            <span className="num">{num}</span>
            <span className="den">{den}</span>
          </span>,
        );
      } else if (name === 'text') {
        flush();
        const end = src.indexOf('}', i + 1);
        out.push(
          <span className="tx" key={key.n++}>
            {src.slice(i + 1, end)}
          </span>,
        );
        i = end + 1;
      } else {
        buf += SYMBOLS[name] ?? name;
      }
      continue;
    }
    if (ch === '^' || ch === '_') {
      flush();
      const [inner, next] = group(i + 1);
      i = next;
      out.push(ch === '^' ? <sup key={key.n++}>{inner}</sup> : <sub key={key.n++}>{inner}</sub>);
      continue;
    }
    if (ch === '{') {
      flush();
      const [inner, next] = parse(src, i + 1, '}', key);
      out.push(...inner);
      i = next;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return [out, i];
}

export function Tex({ children, block }: { children: string; block?: boolean }) {
  const [nodes] = parse(children, 0, null, { n: 0 });
  return <span className={block ? 'tex tex-block' : 'tex'}>{nodes}</span>;
}
