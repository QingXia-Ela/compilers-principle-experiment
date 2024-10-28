const fs = require('fs');
const { getAnalyseResult, printAnalyseList } = require("./wordAnalyser");

function main() {
  const source = fs.readFileSync(`./test.txt`, "utf-8").replaceAll('\r\n', '\n');
  const output = printAnalyseList(
    getAnalyseResult(
      source
    )
  )
  fs.writeFileSync("./output.txt", output, "utf-8");
}

main();
