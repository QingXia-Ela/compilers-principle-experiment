const { DEFAULT_EXPAND } = require("./constants")

/**
 * @type {Record<string, string[]>}
 * 
 * 文法源文件中的 `describe(static, const)` `type(int, char)` `id(变量名)` `digit(1,0.2)` `string("hello")` 需要在词法分析提前获取
 */
let GrammarMap = {}
/** @type {Record<string, string[]>} */
let FirstMap = {}
/** @type {Record<string, string[]>} */
let FollowMap = {}
/** @type {Record<string, string[]>} */
let SelectMap = {}
let PredictTable = (() => {
  /**
   * @type {{
   *   value: Record<string, Record<string, string>>>
   * }}
   */
  const mapRef = {
    value: {}
  }
  return Object.freeze({
    getTarget(k1, k2) {
      return mapRef.value[k1] && mapRef.value[k1][k2]
    },
    setTarget(k1, k2, v) {
      mapRef.value[k1] = mapRef.value[k1] || {}
      mapRef.value[k1][k2] = v
    },
    clean() {
      mapRef.value = {}
    },
    /** @return {Record<string, Record<string, string>>} */
    getCopy() {
      return JSON.parse(JSON.stringify(mapRef.value))
    }
  })
})()

function printGrammarMap() {
  console.log(GrammarMap);
}

function printFirstMap() {
  console.log(FirstMap);
}

function printFollowMap() {
  console.log(FollowMap);
}

function printSelectMap() {
  console.log(SelectMap);
}

function printPredictTable() {
  console.log(PredictTable.getCopy());
}

/**
 * @param {string[]} arr 待展开的数组
 * @param {Record<string, string[]>} expand 关键字展开
 */
function expandArray(arr, expand = {}) {
  const res = []
  arr.forEach(item => {
    const expandKeys = Object.keys(expand)
    expandKeys.forEach(k => {
      if (item.includes(k)) {
        const originVal = item
        const expandVal = []
        expand[k].forEach(v => {
          expandVal.push(originVal.replaceAll(k, v))
        })
        res.push(...expandVal)
      }
    })
    res.push(item)
  })
  return res
}

const grammarReg = /(<.+>) -> (.+)/
//  * @param {Record<string, string[]>} expand 关键字展开
/**
 * @param {string} grammar 
 * 
 * 文法源文件中的 `describe(static, const)` `type(int, char)` `id(变量名)` `digit(1,0.2)` `string("hello")` 需要在词法分析提前获取
 */
function updateGrammarMap(grammar) {
  GrammarMap = {}
  const list = grammar.split('\n')
  list.forEach(line => {
    const res = grammarReg.exec(line)
    if (res) {
      GrammarMap[res[1]] = res[2].split('|').map(item => item.trim())
    }
  })

  return GrammarMap
}

function isNonTerminal(symbol, grammar) {
  return grammar.hasOwnProperty(symbol);
}

function updateFirstMap() {
  FirstMap = {}
  // 初始化first集
  for (const nonTerminal in GrammarMap) {
    FirstMap[nonTerminal] = new Set();
  }

  // 某个非终结符的first集合发生了变化
  let changed = true;

  while (changed) {
    changed = false;

    for (const nonTerminal in GrammarMap) {
      const productions = GrammarMap[nonTerminal];

      for (const production of productions) {
        const symbols = production.split(' ');

        for (const symbol of symbols) {
          if (isNonTerminal(symbol, GrammarMap)) {
            const beforeSize = FirstMap[nonTerminal].size;
            const symbolFirstSet = FirstMap[symbol];
            // 将该非终结符的first集合添加到该终结符的first集合中
            for (const item of symbolFirstSet) {
              FirstMap[nonTerminal].add(item);
            }
            // 没有空串，相当于所有的 first 集都只能在这个 symbol 出现，那么后续的遍历就不需要了，直接退出
            if (!symbolFirstSet.has('$')) {
              break;
            }
            // first集大小变化，有新的first项，继续循环
            if (beforeSize !== FirstMap[nonTerminal].size) {
              changed = true;
            }
          } else {
            const beforeSize = FirstMap[nonTerminal].size;
            FirstMap[nonTerminal].add(symbol);
            // first集大小变化，有新的first项，继续循环
            if (beforeSize !== FirstMap[nonTerminal].size) {
              changed = true;
            }
            break;
          }
        }
      }
    }
  }

  for (const nonTerminal in GrammarMap) {
    FirstMap[nonTerminal] = Array.from(FirstMap[nonTerminal]);
  }
  return FirstMap
}

function updateFollowMap() {
  FollowMap = {}
  // 初始化follow集
  for (const nonTerminal in GrammarMap) {
    FollowMap[nonTerminal] = new Set();
  }

  // 将终止符号放入开始符号的Follow集合中
  const startSymbol = Object.keys(GrammarMap)[0];
  FollowMap[startSymbol].add('$');

  // 某个非终结符的follow集合发生了变化
  let changed = true;

  while (changed) {
    changed = false;

    for (const nonTerminal in GrammarMap) {
      const productions = GrammarMap[nonTerminal];

      for (const production of productions) {
        const symbols = production.split(' ');

        for (let i = 0; i < symbols.length; i++) {
          const symbol = symbols[i];
          // 非终结符，进入规则 23
          if (isNonTerminal(symbol, GrammarMap)) {
            const followBefore = new Set(FollowMap[symbol]);

            if (i + 1 < symbols.length) {
              const nextSymbol = symbols[i + 1];

              if (isNonTerminal(nextSymbol, GrammarMap)) {
                // V -> xWy First(y) - {$} y = nextSymbol V = symbol
                for (const item of FirstMap[nextSymbol]) {
                  if (item !== '$') FollowMap[symbol].add(item);
                }

                // V -> xW
                if (FirstMap[nextSymbol].includes('$')) {
                  for (const item of FollowMap[nonTerminal]) {
                    FollowMap[symbol].add(item);
                  }
                }
              }
              // V -> xWz First(z) - {$} z = nextSymbol V = symbol
              else {
                FollowMap[symbol].add(nextSymbol);
              }
            }
            // nonTerminal -> xW
            else {
              for (const item of FollowMap[nonTerminal]) {
                FollowMap[symbol].add(item);
              }
            }

            // follow集大小变化，有新的follow项，继续循环
            if (followBefore.size !== FollowMap[symbol].size) {
              changed = true;
            }
          }
        }
      }
    }
  }

  for (const nonTerminal in GrammarMap) {
    FollowMap[nonTerminal] = Array.from(FollowMap[nonTerminal]);
  }
  return FollowMap
}

function updateSelectMap() {
  SelectMap = {}
  for (const nonTerminal in GrammarMap) {
    for (const production of GrammarMap[nonTerminal]) {
      SelectMap[`${nonTerminal} -> ${production}`] = new Set();

      const symbols = production.split(' ');

      // Add First(α) to Select(A -> α)
      for (const symbol of symbols) {
        if (isNonTerminal(symbol, GrammarMap)) {
          const symbolFirstSet = FirstMap[symbol];
          for (const item of symbolFirstSet) {
            if (item !== '$') { // '$' represents ε
              SelectMap[`${nonTerminal} -> ${production}`].add(item);
            }
          }
          if (!symbolFirstSet.includes('$')) {
            break;
          }
        } else {
          SelectMap[`${nonTerminal} -> ${production}`].add(symbol);
          break;
        }
      }

      // If α can derive ε, add Follow(A) to Select(A -> α)
      const canProduceEpsilon = symbols.every(symbol => {
        return isNonTerminal(symbol, GrammarMap) && FirstMap[symbol].includes('$');
      });

      if (canProduceEpsilon) {
        for (const item of FollowMap[nonTerminal]) {
          SelectMap[`${nonTerminal} -> ${production}`].add(item);
        }
      }
    }
  }

  for (const exp in SelectMap) {
    SelectMap[exp] = Array.from(SelectMap[exp]);
  }
  return SelectMap
}

// 递归下降分析，弃用
// function destructExpression() {}
// function updateParseFnMap() {
//   const selectList = Object.keys(SelectMap);
//   const nonTerminalList = Object.keys(GrammarMap);
//   for (const nonTerminal of nonTerminalList) {
//     for (const select of selectList) {
//       if (select.includes(nonTerminal)) {
//         // ParseFnMap[nonTerminal] = select
//       }
//     }
//   }
// }

// 预测分析表构建
function updatePredict() {
  for (const nonTerminal of Object.keys(GrammarMap)) {
    // key is formula, value is terminal
    for (const [key, select] of Object.entries(SelectMap)) {
      if (key.startsWith(nonTerminal + ' ->')) {
        for (const symbol of select) {
          if (PredictTable.getTarget(nonTerminal, symbol)) {
            // continue
            // throw new Error(`PredictTable conflict: ${nonTerminal} -> ${symbol} = ${key}, ${nonTerminal} -> ${symbol} = ${PredictTable.getTarget(nonTerminal, symbol)}`)
          }
          // console.log(`Setting PredictTable: ${nonTerminal} -> ${symbol} = ${key}`);
          PredictTable.setTarget(nonTerminal, symbol, key);
        }
      }
    }
  }
  return PredictTable
}

/**
 * @param {string} grammarSource 文法源文件
 */
function updateGrammar(grammarSource) {
  updateGrammarMap(grammarSource);
  updateFirstMap();
  updateFollowMap();
  updateSelectMap();
  if (!isLL1()) {
    throw new Error('Grammar is not LL1')
  }
  updatePredict();
}

function isLL1() {
  for (const [key, val] of Object.entries(SelectMap)) {
    const checkSet = new Set()
    for (const nonTerminal in GrammarMap) {
      if (key.startsWith(nonTerminal)) {
        // return false
        for (const symbol of val) {
          if (checkSet.has(symbol)) {
            return false
          } else {
            checkSet.add(symbol)
          }
        }
      }
    }
  }
  return true
}

/** 
 * @param {string} input 待分析输入串
 * @param {Record<string, string[]>} expand 终结符关键字展开
 */
function startAnalyse(input, expand = DEFAULT_EXPAND) {
  // 初始化分析栈
  let stack = ['#', Object.keys(GrammarMap)[0]]; // 假设第一个非终结符为开始符号
  let index = 0;
  const table = PredictTable.getCopy();
  // 应急恢复回退标记，用于处理进入到某些句子后无法匹配但是父句子包含空串可匹配的情况
  // 文法不严格时才使用该恢复措施
  let backMark = false

  function parseUnknownToken2PresetKey(token) {
    // return token
    for (const [key, val] of Object.entries(expand)) {
      if (val.includes(token)) {
        return key
      }
    }
    return token
  }
  let start = false
  let nonTerminalStack = []
  while (stack.length > 0) {
    let top = stack.pop();
    let currentChar = parseUnknownToken2PresetKey(input[index]);

    if (input[index] === 'aaa' || start) {
      console.log(stack, top, currentChar);
      start = true
    }

    if (top === currentChar) {
      nonTerminalStack = []
      // 栈顶符号与当前输入符号相同，匹配成功，读取下一个输入符号
      index++;
    } else if (top === '#') {
      break;
    } else if (isNonTerminal(top, GrammarMap)) {
      // 栈顶符号为非终结符，查找预测分析表
      let production = table[top][currentChar];

      nonTerminalStack.push(top)
      // 应急恢复
      if (backMark && table[top].hasOwnProperty('$')) {
        backMark = false
        if (start) {
          console.log('backMark close');
        }
        continue;
      }

      if (production) {
        // 将产生式右部符号逆序压入栈中
        let symbols = production.split(' -> ')[1].split(' ').reverse();
        for (let symbol of symbols) {
          if (symbol !== '$') { // 忽略空串
            stack.push(symbol);
          }
        }
      }
      // 将无匹配输入视为空串，顶部非终结符直接出栈
      else if (table[top].hasOwnProperty('$')) {
        continue;
      } else {

        // 回退恢复
        const canIntoEmptyStr = nonTerminalStack.some((nonTerminal) => {
          return table[nonTerminal].hasOwnProperty('$')
        })

        if (canIntoEmptyStr) {
          nonTerminalStack = []
          if (isNonTerminal(stack[stack.length - 1], GrammarMap)) {
            stack.pop()
          }
          continue;
        }
        else {
          throw new Error(`Unexpected symbol ${input[index]}. Maybe expect ${top}. Token position: ${index}, value: ${input[index]}`);
        }
      }
    } else {
      console.log(stack);

      throw new Error(`Unexpected symbol ${input[index]}. Maybe expect ${top}. Token position: ${index}, value: ${input[index]}`);
    }
  }

  if (index === input.length) {
    console.log('LL1 Parsing succeeded');
  } else {
    throw new Error(`input not fully parsed, remaining input: ${input.slice(index)}`);
  }
}

module.exports = {
  updateGrammarMap,
  printGrammarMap,
  updateFirstMap,
  printFirstMap,
  updateFollowMap,
  printFollowMap,
  updateSelectMap,
  printSelectMap,
  updatePredict,
  printPredictTable,
  updateGrammar,
  startAnalyse,
  isLL1
}
