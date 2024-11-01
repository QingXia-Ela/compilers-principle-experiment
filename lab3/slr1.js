class Table {
  mapRef = {
    value: {}
  }
  constructor() { }
  getTarget(k1, k2) {
    return this.mapRef.value[k1] && this.mapRef.value[k1][k2]
  }
  getColKeys() {
    return Object.keys(this.mapRef.value)
  }
  setColKeys(keys) {
    keys.forEach(k1 => {
      if (!this.mapRef.value[k1]) this.mapRef.value[k1] = {}
    })
  }
  setTarget(k1, k2, v) {
    this.mapRef.value[k1] = this.mapRef.value[k1] || {}
    this.mapRef.value[k1][k2] = v
  }
  clean() {
    this.mapRef.value = {}
  }
  /** @return {Record<string, Record<string, string>>} */
  getCopy() {
    return JSON.parse(JSON.stringify(this.mapRef.value))
  }
}

/** 
 * @typedef {{
 *  [key: string]: {
  *  symbols: string[],
  *  position: number,
  *  productionId: number
  * }[]}} NodeState
 * 
 * @typedef {{
 *  [key: string]: Node
 * }} NodeNext
 * 
 * @typedef {{
 *  stateId: number,
 *  state: NodeState,
 *  next: NodeNext
 * }} Node
 */

/** @type {Record<string, string[]>} */
let GrammarMap = {}
/** @type {Record<string, string[]>} */
let FirstMap = {}
/** @type {Record<string, string[]>} */
let FollowMap = {}
let dfa = {
  state: {},
  next: {}
}
const ActionMap = new Table()
const GotoMap = new Table()

const grammarReg = /(<.+>) -> (.+)/
function updateGrammarMap(grammar) {
  GrammarMap = {}
  const list = grammar.split('\n')

  list.forEach(line => {
    const res = grammarReg.exec(line)
    if (res) {
      const set = GrammarMap[res[1]] || new Set()
      if (res[2].includes('|')) {
        res[2].split('|').map(item => item.trim()).forEach(item => {
          set.add(item)
        })
      } else {
        set.add(res[2])
      }
      GrammarMap[res[1]] = set
    }
  })

  const nonTerminalCollect = new Set(), terminalCollect = new Set()

  for (const [key, val] of Object.entries(GrammarMap)) {
    GrammarMap[key] = Array.from(val)

    val.forEach(item => {
      item.split(' ').forEach(symbol => {
        if (symbol.startsWith('<')) {
          nonTerminalCollect.add(symbol)
        } else {
          terminalCollect.add(symbol)
        }
      })
    })
  }

  return {
    GrammarMap,
    nonTerminalCollect,
    terminalCollect
  }
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
  function calc() {
    let changed = true;

    while (changed) {
      changed = false;

      for (const nonTerminal in GrammarMap) {
        const productions = GrammarMap[nonTerminal];
        let nonTerminalList = new Set([nonTerminal]);
        // 语句循环
        for (const production of productions) {
          const symbols = production.split(' ');
          // 符号
          for (const symbol of symbols) {
            if (isNonTerminal(symbol, GrammarMap)) {
              nonTerminalList.add(symbol);
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
              nonTerminalList.forEach((nonTerminal) => {
                const beforeSize = FirstMap[nonTerminal].size;
                FirstMap[nonTerminal].add(symbol);
                // first集大小变化，有新的first项，继续循环
                if (beforeSize !== FirstMap[nonTerminal].size) {
                  changed = true;
                }
              })
              break;
            }
          }
        }
      }
    }
  }
  function judgeFirstCalcEnd(before, after) {
    return Object.keys(before).every(key => after.hasOwnProperty(key) && before[key] === after[key]) &&
      Object.keys(after).every(key => before.hasOwnProperty(key) && before[key] === after[key])
  }
  function getFirstLenMap() {
    const firstLenMap = {}
    for (const nonTerminal in GrammarMap) {
      firstLenMap[nonTerminal] = FirstMap[nonTerminal].size
    }
    return firstLenMap
  }

  for (let i = 0; i < 10; i++) {
    const before = getFirstLenMap()
    calc();
    const after = getFirstLenMap()

    if (judgeFirstCalcEnd(before, after)) {

      for (const nonTerminal in GrammarMap) {
        FirstMap[nonTerminal] = Array.from(FirstMap[nonTerminal]);
      }
      return FirstMap
    }
  }
  console.log('first集计算达到最大次数，未收敛');

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

  function calc() {
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
  }
  calc()

  for (const nonTerminal in GrammarMap) {
    FollowMap[nonTerminal] = Array.from(FollowMap[nonTerminal]);
  }
  return FollowMap
}

function updateSLR0Map() {
  /** @type {Record<string, NodeState[]>} */
  const tableMap = {}
  const productionMap = {}
  let productionCnt = 0
  for (const nonTerminal in GrammarMap) {
    tableMap[nonTerminal] = GrammarMap[nonTerminal].map((production) => {
      const symbols = production.split(' ');
      const prod = {
        symbols,
        position: 0,
        productionId: productionCnt++
      }
      productionMap[prod.productionId] = prod
      return prod
    })
  }

  /** @param {NodeState[]} productions */
  function spinCheck(productions) {
    const keyworResult = new Set()
    for (const production1 of productions) {
      for (const production2 of productions) {
        if (
          JSON.stringify(production1.symbols) === JSON.stringify(production2.symbols) &&
          production2.position - production1.position === 1
        ) {
          keyworResult.add(production1.symbols[production1.position])
        }
      }
    }
    return keyworResult
  }

  let stateCnt = 0
  const stateMap = {}

  /** 
   * 构造当前状态集
   * @param {string} token 
   * @param {NodeState[]} productions
   */
  function buildState(token, productions) {
    const state = {
      [token]: productions,
    };
    const next = {}
    const node = {
      stateId: stateCnt++,
      state,
      next
    }

    function calc() {
      for (const token in state) {
        // 当前状态下的所有产生式
        const productions = state[token];

        // 遍历所有产生式
        for (const production of productions) {
          // 已经到了产生式的末尾，无 next 对象
          if (production.position >= production.symbols.length)
            continue;

          // 针对传入的产生式构造子产生式
          for (let i = production.position; i < production.symbols.length; i++) {
            const symbol = production.symbols[i];
            // 非终结符，查找左部相同的产生式添加进状态机
            if (isNonTerminal(symbol, GrammarMap)) {
              state[symbol] = state[symbol] || [];
              // 从 0 开始
              state[symbol].push(...tableMap[symbol]);
            }
          }
          // 自旋检测
          // E -> e·E E -> ·eE
          const keyResult = spinCheck(productions)
          if (keyResult.size) {
            // 自引用
            for (const item of keyResult) {
              next[item] = node
            }
            // 直接退出循环，上面已经构造过初始化的子产生式了
            break;
          }
        }
      }
    }
    function buildNextByState(/** @type {Node} */node) {
      const { state, next = {} } = node
      for (const token in state) {
        const copyState = JSON.parse(JSON.stringify(state[token]))
        copyState.forEach((item) => {
          if (item.position >= item.symbols.length) {
            // 无 next 对象
            return
          }
          // 取产生式右部活前缀最后一位
          const symbol = item.symbols[item.position]

          item.position++

          if (symbol in next) {
            // 有 next 对象
            return
          }
          next[symbol] = buildState(token, [item])
        })
      }
      return {
        state,
        next
      }
    }
    calc();
    buildNextByState(node)

    return node
  }

  return {
    dfa: buildState('<S>', tableMap['<S>']),
    productionMap,
  }
}

function updateMap(dfa, nonTerminalCollect, terminalCollect) {
  GotoMap.clean();
  ActionMap.clean();
  GotoMap.setColKeys(Array.from(nonTerminalCollect))
  ActionMap.setColKeys([...Array.from(terminalCollect), '#'])

  const nodeMap = new Map();
  /** @param {Node} node */
  function dfs(node) {
    if (nodeMap.has(node.stateId)) {
      return;
    }
    nodeMap.set(node.stateId, node);
    // 仅终态规约
    // E -> αb·
    if (Object.keys(node.next).length === 0) {
      const stateKeys = Object.keys(node.state);

      // 无归约-归约冲突，直接设置归约式子
      if (stateKeys.length === 1) {
        const state = node.state[stateKeys[0]];

        for (const key of ActionMap.getColKeys()) {
          ActionMap.setTarget(key, node.stateId, {
            type: 'production',
            value: state[0].productionId
          })
        }
      }
      // todo!: 处理归约-归约冲突
      return;
    }
    // 填表
    for (const token in node.state) {
      const productions = node.state[token];
      for (const production of productions) {
        const { symbols, productionId, position } = production;
        const nextToken = symbols[position];
        const isProductionEnd = position >= symbols.length

        // todo!: 边界情况
        if (!nextToken) { }
        // goto，可能无冲突
        if (isNonTerminal(nextToken, GrammarMap)) {
          GotoMap.setTarget(nextToken, node.stateId, { type: 'state', value: node.next[nextToken].stateId });
        }
        else {
          // 判断是否有移进-归约
          // 检测是否被占位了，有占位再进行分类操作
          // todo!: slr1 移进-归约
          const target = ActionMap.getTarget(nextToken, node.stateId);
          if (target) {
            if (target.type === 'production') {
            }
            else if (target.type === 'state') {
            }
          }
          else {
            // 产生式结尾，直接归约
            if (isProductionEnd) {
              const keys = ActionMap.getColKeys()
              for (const key of keys) {
                ActionMap.setTarget(nextToken, key, {
                  type: 'production',
                  value: productionId
                })
              }
            }
            else {
              ActionMap.setTarget(nextToken, node.stateId, {
                type: 'state',
                value: node.next[nextToken].stateId
              })
            }
          }
        }
      }
    }

    for (const token in node.next) {
      const next = node.next[token];
      dfs(next);
    }
  }

  dfs(dfa);
}

function startAnalyse(input) { }

function updateGrammar(source) {
  const { nonTerminalCollect, terminalCollect } = updateGrammarMap(source);
  updateFirstMap();
  updateFollowMap();
  const { dfa } = updateSLR0Map();
  updateMap(dfa, nonTerminalCollect, terminalCollect);
}

module.exports = {
  updateGrammar,
}