const CONSTANTS = require("./constants.js")

// string replace all polyfill
String.prototype.replaceAll = function (search, replacement) {
  return this.replace(new RegExp(search, 'g'), replacement);
};

/**
 * @typedef {{
 * type: number
 * subState: number
 * desc: string
 * value: string
 * ch: number
 * line: number
 * }} AnalyseResult
 */


/**
 * Prints the analyse result list.
 * @param {AnalyseResult[]} analyseResults - The result of lexical analysis.
 */
function printAnalyseList(analyseResults) {
  let res = "---------------------lexical analyse result---------------------\n" + "类型码\t子类型码\t描述\t\t所在行\t所在列\t值\n"

  analyseResults.forEach(({ type, subState, desc, value, ch, line }) => {
    res += `${type}\t${subState}\t\t${desc}\t\t${line}\t${ch}\t${value}\n`
  })

  console.log(res)

  return res
}

const wordRegexp = /([a-zA-Z_]+)/
function isWord(val) {
  return wordRegexp.test(val)
}

const numberRegexp = /^[+-]?(\d+(\.\d*)?|\.\d+)$/
function isNumber(ch) {
  return numberRegexp.test(ch)
}

const KeywordChars = Object.keys(CONSTANTS.KEYWORD)
function isKeyword(ch) {
  return KeywordChars.includes(ch)
}
const OperatorChars = Object.keys(CONSTANTS.OPERATOR)
const SeparatorChars = Object.keys(CONSTANTS.SEPARATOR)
function isOperator(ch) {
  return OperatorChars.includes(ch)
}
function isSeparator(ch) {
  return SeparatorChars.includes(ch)
}

/**
 * This function can judge buffer to `keyword`, `constants`, `identifier`, `operator`, `separator`
 * 
 * If input a empty array it will return null
 * 
 * @param {string[]} buffer A char buffer
 * @param {number} line The line number
 * @param {number} ch The column number
 * @returns {null | AnalyseResult}
 */
function getRecordFromBuffer(buffer, line, ch) {
  if (buffer.length === 0) { return null }
  const value = buffer.join('')

  if (isOperator(value)) {
    return {
      type: CONSTANTS.FLAG.OPERATOR,
      subState: CONSTANTS.OPERATOR[value],
      desc: CONSTANTS.OPERATOR.OPERATOR_DESC,
      value,
      line,
      ch
    }
  }
  else if (isSeparator(value)) {
    return {
      type: CONSTANTS.FLAG.SEPARATOR,
      subState: CONSTANTS.SEPARATOR[value],
      desc: CONSTANTS.SEPARATOR.SEPARATOR_DESC,
      value,
      line,
      ch
    }
  }
  else if (isKeyword(value)) {
    return {
      type: CONSTANTS.FLAG.KEYWORD,
      subState: CONSTANTS.KEYWORD[value],
      desc: CONSTANTS.KEYWORD.KEYWORD_DESC,
      value,
      line,
      ch
    }
  }
  else {
    // string / char constants
    if (value.startsWith("'") && value.endsWith("'")) {
      return {
        type: CONSTANTS.FLAG.CONSTANT,
        subState: CONSTANTS.CONSTANT["'"],
        desc: CONSTANTS.CONSTANT.CONSTANT_DESC,
        value,
        line,
        ch
      }
    }
    else if (value.startsWith('"') && value.endsWith('"')) {
      return {
        type: CONSTANTS.FLAG.CONSTANT,
        subState: CONSTANTS.CONSTANT["\""],
        desc: CONSTANTS.CONSTANT.CONSTANT_DESC,
        value,
        line,
        ch
      }
    }
    // number
    else if (isNumber(value)) {
      return {
        type: CONSTANTS.FLAG.CONSTANT,
        subState: value.includes('.') ? CONSTANTS.CONSTANT['float'] : CONSTANTS.CONSTANT['int'],
        desc: CONSTANTS.CONSTANT.CONSTANT_DESC,
        value,
        line,
        ch
      }
    }
    else {
      return {
        type: CONSTANTS.FLAG.IDENTIFIER,
        subState: CONSTANTS.IDENTIFIER.IDENTIFIER_MARK,
        desc: CONSTANTS.IDENTIFIER.IDENTIFIER_DESC,
        value,
        line,
        ch
      }
    }
  }
}

function handleBuffer(buffer, line, ch, resultArray) {
  const record = getRecordFromBuffer(buffer, line, ch)
  if (record) resultArray.push(record)
}

/**
 * @param {string} source 
 */
function getAnalyseResult(source) {
  /** @type {AnalyseResult[]} */
  const res = []

  let ch = 1, line = 1
  const len = source.length
  let state = CONSTANTS.FLAG.EMPTY, subState = 0
  let currentCharacter = ''
  // cache the full word
  let buffer = []

  function nextCharacter(i) {
    if (source[i] === '\n') {
      ch = 1
      line++
    }
    else {
      ch++
    }
  }

  for (let i = 0; i < len; i++) {
    currentCharacter = source[i]

    // done
    if (isOperator(currentCharacter)) {
      // continue operator like ++ +=
      if (state === CONSTANTS.FLAG.OPERATOR) { }
      else if (state === CONSTANTS.FLAG.CONSTANT &&
        // if is in string or char, just add to buffer because it is legal in it.
        (subState === CONSTANTS.CONSTANT["'"] || subState === CONSTANTS.CONSTANT["\""])
      ) { }
      else {
        handleBuffer(buffer, line, ch, res)
        buffer = []
        state = CONSTANTS.FLAG.OPERATOR
      }
      buffer.push(currentCharacter)
    }
    else if (isSeparator(currentCharacter)) {
      if (currentCharacter === '.' && state === CONSTANTS.FLAG.CONSTANT && subState === CONSTANTS.CONSTANT['int']) {
        subState = CONSTANTS.CONSTANT['float']
        buffer.push(currentCharacter)
        nextCharacter(i)
        continue;
      }
      else if (state === CONSTANTS.FLAG.CONSTANT &&
        // if is in string or char, just add to buffer because it is legal in it.
        (subState === CONSTANTS.CONSTANT["'"] || subState === CONSTANTS.CONSTANT["\""])
      ) {
        buffer.push(currentCharacter)
        nextCharacter(i)
        continue;
      }
      handleBuffer(buffer, line, ch, res)

      buffer = []
      state = CONSTANTS.FLAG.SEPARATOR
      buffer.push(currentCharacter)
    }
    // word split, send to buffer, because we couldn't classify identifier or keyword in unknown state
    else {
      // last character is operator or separator, but current is not, which means we have a new word or constants
      if (state === CONSTANTS.FLAG.OPERATOR || state === CONSTANTS.FLAG.SEPARATOR || state === CONSTANTS.FLAG.EMPTY) {
        handleBuffer(buffer, line, ch, res)

        buffer = []

        // constant possible
        if (currentCharacter === '"' || currentCharacter === '\'') {
          subState = CONSTANTS.CONSTANT[currentCharacter]
          state = CONSTANTS.FLAG.CONSTANT
          buffer.push(currentCharacter)
        }
        else if (isNumber(currentCharacter)) {
          state = CONSTANTS.FLAG.CONSTANT
          subState = CONSTANTS.CONSTANT['int']
          buffer.push(currentCharacter)
        }
        else if (isWord(currentCharacter)) {
          // keyword belong to identifier, in finally they will send to analyse and auto classify
          state = CONSTANTS.FLAG.IDENTIFIER
          buffer.push(currentCharacter)
        }
        // some separator like space, new line or tab, just ignore
      }
      // is in identifier(keyword), or constant state
      else {
        if (currentCharacter === ' ' || currentCharacter === '\n' || currentCharacter === '\t') {
          if (state === CONSTANTS.FLAG.CONSTANT
            // if is in string or char, just add to buffer because it is legal in it.
            && (subState === CONSTANTS.CONSTANT["'"] || subState === CONSTANTS.CONSTANT["\""])
          ) {
            nextCharacter(i)
            continue;
          }
          handleBuffer(buffer, line, ch, res)

          buffer = []
          state = CONSTANTS.FLAG.EMPTY
          nextCharacter(i)
          continue;
        }
        // constants end?
        else if (currentCharacter === '"' || currentCharacter === '\'') {
          // constants end
          if (subState === CONSTANTS.CONSTANT[currentCharacter]) {
            buffer.push(currentCharacter)
            handleBuffer(buffer, line, ch, res)

            buffer = []
            state = CONSTANTS.FLAG.EMPTY
            nextCharacter(i)
            continue;
          }
          // or just push in buffer
        }
        buffer.push(currentCharacter)
      }
    }

    nextCharacter(i)
  }
  handleBuffer(buffer, line, ch, res)

  return res
}

/**
 * @param {AnalyseResult[]} result 
 */
function parseAnalyseResultToLab3Expand(result) {
  const res = {
    "describe": new Set(["static", "const"]),
    "type": new Set(["int", "char", "float", "void", "double", "string", "bool"]),
    "id": new Set(),
    digit: new Set(),
    string: new Set(),
  }
  result.forEach(({ type, subState, value }) => {
    switch (type) {
      case CONSTANTS.IDENTIFIER.IDENTIFIER_FLAG:
        res.id.add(value)
        break;

      case CONSTANTS.CONSTANT.CONSTANT_FLAG: {
        switch (subState) {
          case CONSTANTS.CONSTANT.int:
          case CONSTANTS.CONSTANT.float:
            res.digit.add(value)
            break;

          case CONSTANTS.CONSTANT['"']:
          case CONSTANTS.CONSTANT["'"]:
            res.string.add(value)
            break;
        }
        break;
      }

      default:
        break;
    }
  })
  for (const key in res) {
    res[key] = Array.from(res[key])
  }

  return res
}

module.exports = {
  getAnalyseResult,
  printAnalyseList,
  parseAnalyseResultToLab3Expand
}