const fs = require('fs');

const source = fs.readFileSync(`.\\测试文件\\测试文件\\C语言代码\\if语句.txt`, "utf-8");
let finalRes = source

// node v12 replaceAll polyfill
String.prototype.replaceAll = function (search, replacement) {
  return this.replace(new RegExp(search, 'g'), replacement);
};

// macro replace
// const INCLUDE_REG = /#include <([A-Za-z0-9_]+)>\n/g
const STATIC_DEFINE_REG = /#define +([A-Za-z0-9_]+) +(.+)/g
const FN_DEFINE_REG = /#define +([A-Za-z0-9_]+)\(([A-Za-z0-9_]{0,})\) +(.+)/g
function judgeMacro(macro, position, macroState) {
  if (macro.startsWith('#include')) {
    macroState.includeBlock.list.push({ target: macro.replaceAll('#include ', ''), position })
  }
  else if (macro.startsWith('#define')) {
    // console.log(STATIC_DEFINE_REG.exec(macro), macro);
    STATIC_DEFINE_REG.lastIndex = 0
    FN_DEFINE_REG.lastIndex = 0
    let res = STATIC_DEFINE_REG.exec(macro)
    if (res) {
      const [, name, value] = res
      macroState.defineBlock.static[name] = {
        value,
        position
      }
      return
    }
    res = FN_DEFINE_REG.exec(macro)
    if (res) {
      const [, name, params, value] = res
      macroState.defineBlock.fn[name] = { params, value, position }
    }
  }
}

function printMacroInfo(macroState, filename = 'input.cpp') {
  macroState.includeBlock.list.forEach(({ target, position }) => {
    console.log("#include macro: " + target, `at ${filename}:${position.line + 1}:${position.ch}`)
  })
  Object.entries(macroState.defineBlock.static).forEach(([name, { value, position }]) => {
    console.log("#define macro: " + name + " with expression " + value, `at ${filename}:${position.line + 1}:${position.ch}`)
  })
  Object.entries(macroState.defineBlock.fn).forEach(([name, { params, value, position }]) => {
    console.log("#define macro: " + name + " with params: " + params + " and replace expression: " + value, `at ${filename}:${position.line + 1}:${position.ch}`)
  })
}

// macro expand
{
  const str = finalRes.replaceAll("\r\n", "\n");
  const len = str.length;
  let res = ""

  let ch = 0, line = 0

  const macroState = {
    includeBlock: {
      list: [],
    },
    defineBlock: {
      list: [],
      static: {},
      fn: {},
    },
  }
  let currentMacro = ''

  let macroSignal = false
  let positionRecord = {
    ch: 0,
    line: 0
  }

  // macro
  for (let i = 0; i < len; i++) {
    if (str[i] === '\n') {
      ch = 0
      line++
    }
    else ch++

    if (ch == 1 && str[i] === '#') {
      macroSignal = true
      positionRecord = { ch, line }
    }
    else if (str[i] === '\n' || i === len - 1) {
      if (macroSignal) {
        judgeMacro(currentMacro, positionRecord, macroState)
        currentMacro = ''
        macroSignal = false
      }
    }

    if (macroSignal) {
      currentMacro += str[i]
    }
  }
  console.log(JSON.stringify(macroState, null, 2));

  printMacroInfo(macroState)

  // remove macro
  res = str
    // .replaceAll(INCLUDE_REG, '')
    .replaceAll(STATIC_DEFINE_REG, '')
    .replaceAll(FN_DEFINE_REG, '')
  // replace static
  Object.entries(macroState.defineBlock.static)
    // from longest to shortest, to avoid short keyword has higher priority
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([name, { value }]) => {
      res = res.replaceAll(name, value)
    })
  // replace fn
  Object.entries(macroState.defineBlock.fn).forEach(([name, { params, value }]) => {
    while (1) {
      const reg = new RegExp(name + '\\((.+)\\)', 'g')
      const execRes = reg.exec(res)
      if (!execRes) break
      const [, args] = execRes
      res = res.replaceAll(reg, value.replaceAll(params, args))
    }
  })
  finalRes = res
}

function parseRemoveToSave(strlen, commentRemoveRecord) {
  const res = [
    {
      start: 0,
      end: commentRemoveRecord[0].start
    }
  ]

  for (let i = 0; i < commentRemoveRecord.length - 1; i++) {
    res.push({
      start: commentRemoveRecord[i].end + 1,
      end: commentRemoveRecord[i + 1].start
    })
  }

  res.push({
    start: commentRemoveRecord[commentRemoveRecord.length - 1].end + 1,
    end: strlen
  })

  return res
}

// remove comment
{
  const str = finalRes;
  const len = str.length;
  const commentRemoveRecord = []
  let res = ""

  let firstSlashPosition = -1
  let singleLineCommentSignal = false
  let multiLineCommentSignal = false

  for (let i = 0; i < len; i++) {
    if (singleLineCommentSignal && (str[i] === '\n' || i === len - 1)) {
      singleLineCommentSignal = false
      // ignore \n
      commentRemoveRecord.push({ start: firstSlashPosition, end: i })
      firstSlashPosition = -1
    }
    else if (multiLineCommentSignal) {
      // todo!: i+1 will cause index out of range on other lang
      if (str[i] === '*' && str[i + 1] === '/') {
        multiLineCommentSignal = false
        commentRemoveRecord.push({ start: firstSlashPosition, end: i + 1 })
        firstSlashPosition = -1
      }
    }
    else {
      if (str[i] === '/' && firstSlashPosition === -1) {
        firstSlashPosition = i
      }
      else if (firstSlashPosition !== -1 && str[i] === '/') {
        singleLineCommentSignal = true
      }
      else if (firstSlashPosition !== -1 && str[i] === '*') {
        multiLineCommentSignal = true
      }
      else if (!(singleLineCommentSignal || multiLineCommentSignal)) {
        firstSlashPosition = -1
      }
    }
  }

  const saveCode = parseRemoveToSave(len, commentRemoveRecord)
  for (let i = 0; i < saveCode.length; i++) {
    res += str.slice(saveCode[i].start, saveCode[i].end)
  }

  finalRes = res
}

fs.writeFileSync("./output.cpp", finalRes, "utf-8")
