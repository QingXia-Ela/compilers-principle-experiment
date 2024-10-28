const fs = require('fs')
const { getAnalyseResult, parseAnalyseResultToLab3Expand } = require('./wordAnalyser')
const { updateGrammar, startAnalyse } = require('./ll1')

function ll1(input) {

  const lab2AnalyseResult = getAnalyseResult(input)
  const keywordAnalyse = lab2AnalyseResult.map(({ value }) => value)

  const grammarSource = fs.readFileSync(`./LL1Grammar.txt`, "utf-8");
  updateGrammar(grammarSource);

  startAnalyse(
    keywordAnalyse,
    parseAnalyseResultToLab3Expand(lab2AnalyseResult)
  )
}

function main() {
  const input = fs.readFileSync(`./input.txt`, "utf-8")
  ll1(input)
}

main()