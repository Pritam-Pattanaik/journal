const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

(async function() {
  const rawSourceMap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const consumer = await new SourceMapConsumer(rawSourceMap);
  const pos = consumer.originalPositionFor({
    line: parseInt(process.argv[3], 10),
    column: parseInt(process.argv[4], 10)
  });
  console.log(pos);
  consumer.destroy();
})();
