import { writeFileSync } from "node:fs";
class Range {
  start;
  last;
  isRange;

  constructor(start, last) {
    this.start = start;
    this.last = last;
    this.isRange = true;
  }
}
const tex = {
  // variables
  space_l: "\\; ",
  space_m: "\\: ",
  space_s: "\\, ",
  space_neg: "\\! ",
  space_neg_l: "\\!\\!\\! ",
  inf: "\\infty ",
  ldots: "\\ldots",
  vdots: "\\vdots",
  cdots: "\\cdots",
  ddots: "\\ddots",
  eq: "= ",
  neq: "\\neq ",
  teq: "\\equiv", // don't know why TeX creater named it equiv, when its triple eq
  lt: "< ",
  lte: "\\leq ",
  gt: "> ",
  gte: "\\geq ",
  dlt: "\\ll ", // stands for double less than (I named it)
  dgt: "\\gg ",
  ast: "\\ast ",
  star: "\\star ",
  setminus: "\\setminus ",
  wr: "\\wr ", // i don't understand what this (it looks like vertical tilda (~))
  cap: "\\cap ", // set-wise AND and OR
  cup: "\\cup ",
  and: "\\vee ", // why did they decide to call it VEE and WEDGE??? it's obv AND and OR
  or: "\\wedge ",
  subset: "\\subset ",
  subseteq: "\\subseteq ",
  supset: "\\supset ",
  supseteq: "\\supseteq ",
  emptyset: "\\emptyset ",
  inside: "\\in ", // in was reserved
  contains: "\\ni ",
  lambda: "\\lambda ", // lambda aka anonymous function aka function as value
  int: "\\int", // for showcase purpose. integral() and area_integral() should be enough for normal use.

  // begin{document} and end{document} must be used at top level for (La)?TeX to render this. i hate this.
  document: function (...texNodes) {
    return `
      \\documentclass{article}
      \\usepackage[utf8]{inputenc}
      \\title{Sample Project}
      \\author{Masumi Morishige}
      \\date{April 2021}
      \\begin{document}
      ${texNodes.join("\n\n")}
      \\end{document}\n`;
  },
  // expr's need to be wrapped in either inline or display block.
  inline: function (expr) {
    return `\\begin{math} ${expr}\\end{math}`;
  },
  display: function (...expr) {
    return `\\begin{displaymath}\n${expr.join("\n")}\n\\end{displaymath} `;
  },
  ordered: function (...expr) {
    return `\\begin{equation} ${expr.join("\n")}\n\\end{equation} `;
  },
  verb: function (verb) {
    return `\\verb+${verb}+`;
  },

  wrap: function (expr) {
    return `\\left( ${expr} \\right)`;
  },
  // equal(mostof expr, equal)
  equal: function (...expr) {
    return expr.join(this.space_l + "=" + this.space_l);
  },
  // equiv( equiv(a,b) && equiv(b, c), equiv(a, c))
  equiv: function (...expr) {
    return expr.join(this.space_l + "\\iff" + this.space_l);
  },
  not: function (expr) {
    return `\\not ${expr}`;
  },
  // basic functions
  low: function (expr) {
    return `_{${expr}} `;
  },
  high: function (expr) {
    return `^{${expr}} `;
  },
  sum: function (...exprs) {
    return exprs.join(" + ");
  },
  pow: function (base, expo) {
    if (base.length > 4) { // magic number
      return this.wrap(base) + tex.high(expo);
    }
    return base + tex.high(expo);
  },
  square: function (base) {
    return this.pow(base, 2); // never RY
  },
  div: function (top, bottom) {
    return `\\frac{${top}}{${bottom}} `;
  },
  mul_x: function (a, b) {
    return `${a}\\cdot ${b} `;
  },
  mul_dot: function (a, b) {
    return `${a}\\times ${b} `;
  },
  // shows expo'th root of base. e.g. root(8, 3) == cubic root of 8 == 2
  // expo can be omitted out.
  root: function (base, expo) {
    if (expo) {
      return `\\sqrt[${expo}]{${base}}`;
    } else {
      return `\\sqrt{${base}}`;
    }
  },
  log: function (a, b) {
    if (b === undefined) return `\\log ${a} `;
    return `\\log${this.low(a)}${b} `;
  },
  floor: function (expr) {
    return `\\lfloor ${expr} \\rfloor `;
  },
  ceil: function (expr) {
    return `\\lceil ${expr} \\rceil `;
  },
  delta: function (letter) {
    return `\\Delta ${letter}`;
  },

  // decoration
  /// vec_single tightens the space between the arrow and the variable.
  vec_single: function (letter) {
    return `\\vec{${letter}} `;
  },
  /// on the other hand, vec_many averages the arrows above the variables s.t. it looks nicer
  vec_many: function (...vars) {
    return vars.map((v) => `\\vec{\\mathstrut ${v}} `);
  },
  triangle: function (letter) {
    return `\\triangle  ${letter}`;
  },
  bar: function (letter) {
    return `\\bar{${letter}} `;
  },
  hat: function (letter) {
    return `\\hat{${letter}} `;
  },
  dot: function (letter) {
    return `\\dot{${letter}} `;
  },
  ddot: function (letter) {
    return `\\ddot{${letter}} `;
  },
  acute: function (letter) {
    return `\\acute{${letter}} `;
  },
  grave: function (letter) {
    return `\\grave{${letter}} `;
  },
  check: function (letter) {
    return `\\check{${letter}} `;
  },
  breve: function (letter) {
    return `\\breve{${letter}} `;
  },

  // advanced functions
  array2d: function (array) {
    return `\\left( \\begin{array}{rrcr}
${array.map((arr) => arr.join("&")).join("\\\\\n")}
\\end{array} \\right)`;
  },

  // high-order functions
  sigma: function (targetVariable, range, expr) {
    if (!range.isRange)
      throw new Error("the second arg of tex.sigma() must be a Range"); // why is "" falsy?
    return `\\sum^{${range.last.toString()}}_{${targetVariable}=${range.start.toString()}} ${expr} `;
  },
  limit: function (targetVariable, dest, expr) {
    return `\\lim_{${targetVariable} \\to ${dest}} ${expr} `;
  },
  integral: function (targetVariable, range, expr) {
    if (!range.isRange)
      throw new Error("the second arg of tex.integral() must be a Range");
    return `\\int^{${range.last.toString()}}_{${range.start.toString()}} ${expr} d${targetVariable} `;
  },
  area_integral: function (targetVariables, area, expr) {
    let len = targetVariables.length;
    let integrals =
      repeat_n_times("\\int", len).join(this.space_neg_l) + this.low(area);
    return (
      integrals +
      `${expr} ` +
      this.space_m +
      targetVariables.map((letter) => `d${letter}`).join(this.space_s)
    );
  },
};

function repeat_n_times(str, count) {
  return [...Array(count)].map(() => str);
}

export default tex;

let __name__ = "__main__";
if (__name__ == "__main__") {
// Examples from: https://cns-guide.sfc.keio.ac.jp/2001/11/4/1
let sqsum = tex.sum(
  tex.square(tex.div("dx", "dt")),
  tex.square(tex.div("dy", "dt")),
);
let complex_int = tex.integral("t", new Range("a", "b"), tex.root(sqsum));

writeFileSync(
  "output.tex",
  tex.document(
    `
${tex.inline("x = a")} から ${tex.inline("x = b")}までの ${tex.inline("f(x)")} の積分は、
${tex.display(
  tex.equal(
    tex.integral("x", new Range("a", "b"), "f(x)"),
    tex.limit(
      "n",
      tex.inf,
      tex.sigma(
        "i",
        new Range(1, "n-1"),
        "f(x" + tex.low("i") + ")" + tex.delta("x"),
      ),
    ),
  ),
)}
と置き換えて考えることができる。`,

    `分数の出力には${tex.verb("\\frac")}コマンドを用います。インライン数式モードでは${tex.inline(tex.equal("y", tex.div("1", "x + 1")))}のように出力されます。
  一方ディスプレイ数式モードでは
  ${tex.display(tex.equal("y", tex.div("1", "x + 1")))} のように出力されます。`,

    `根号の出力には${tex.verb("\\sqrt")}コマンドを用います。
      
 インライン数式モードでは${tex.inline(complex_int)}と出力されます。一方ディスプレイ数式モードでは${tex.display(complex_int)}のように出力されます。
    
オプション引数をとると${tex.inline(tex.equal(tex.root(27, 3), 3))}のようになります。`,

    `積分記号の出力には${tex.verb("\\int")}コマンドを用います。
インライン数式モードでは
${tex.inline(tex.integral("x", new Range("a", "b"), "f(x)"))}のように出力されます。一方ディスプレイ数式モードでは
${tex.display(tex.integral("x", new Range("a", "b"), "f(x)"))}のように出力されます。`,

    tex.display(
      tex.array2d([
        ["1", "2", tex.cdots, "n"],
        ["2", "4", tex.cdots, "2n"],
        [tex.vdots, tex.vdots, tex.ddots, tex.vdots],
        ["m", tex.mul_dot("m", 2), tex.cdots, tex.mul_dot("m", "n")],
        ]),
    ),
    `左側が通常の例、右側が${tex.verb("\\mathstrut")}を用いた例です。
${tex.display(
  tex.sum(...["a", "b", "c", "d", "e", "f"].map(tex.vec_single)),
  tex.space_l.repeat(6),
  tex.sum(...tex.vec_many("a", "b", "c", "d", "e", "f")),
)}`,
    // 上下線括弧は理解が追い付かなかったのでまだやってないです。
    `数式では式の左辺と右辺の関係を否定するために\`\`/''を用いることがあります．これには${tex.verb("\\not")}コマンドを否定したい記号の直前に記述します．出力例を次に示します。
${tex.display(tex.triangle("A"), tex.not(tex.teq), tex.triangle("B"))}`,

    `これらの空白制御コマンドの出力例を次に示します。
${tex.display(tex.int + tex.integral("x", new Range("G", ""), "f(x, y)") + "dy")}
${tex.display(tex.area_integral(["x", "y"], "G", "f(x, y)"))}`,
    tex.display(
      tex.equal(tex.sigma("k", new Range(1, "n"), "k"), tex.div("n(n + 1)", 2)),
    ),
  ),
);
}
// i'm doing text-based interface rn, but it may be possible to rewrite it in an original object-based interface for better writing experience (I don't want to do that in JS tho)
// e.g.:
// tex.integral("x", range::new("a", "b"), "f(x)")
//    .equals()
//    .limit("n", tex.inf,
//        tex.sigma("i", range::new("1, "n - 1"),
//              "f(x" + tex.low("i") + ")" + tex.delta("x")
//            )
//          )
//    .number("定理 2.1.1")
//    .display(Display::block);
