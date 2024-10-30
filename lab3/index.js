const fs = require('fs')
const path = require('path')
const { getAnalyseResult, parseAnalyseResultToLab3Expand } = require('./wordAnalyser')
const { updateGrammar, startAnalyse } = require('./ll1')
const slr1 = require('./slr1')

const LL1_GRAMMAR_PATH = path.resolve('./lab3/LL1Grammar.txt')
const SLR1_GRAMMAR_PATH = path.resolve('./lab3/SLR1Grammar.txt')


function ll1(input) {
  const lab2AnalyseResult = getAnalyseResult(input)
  const keywordAnalyse = lab2AnalyseResult.map(({ value }) => value)

  const grammarSource = fs.readFileSync(LL1_GRAMMAR_PATH, "utf-8");
  updateGrammar(grammarSource);

  startAnalyse(
    keywordAnalyse,
    parseAnalyseResultToLab3Expand(lab2AnalyseResult)
  )
}

function slr1Exec(input) {
  const grammarSource = fs.readFileSync(SLR1_GRAMMAR_PATH, "utf-8");
  slr1.updateGrammar(grammarSource)
}

function main() {
  const input = fs.readFileSync(`./lab3/input.txt`, "utf-8")
  ll1(input)
  // slr1Exec(input)
}

main()