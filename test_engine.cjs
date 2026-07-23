const { assignDisciplineScores } = require('./server/dist/lib/discipline/disciplineEngine.js');
const tradesToInsert = [{
  userId: 'test',
  date: new Date(),
  exitTime: new Date(),
  symbol: 'AAPL',
  market: 'NSE',
  instrumentType: 'EQ',
  direction: 'LONG',
  entryPrice: 100,
  exitPrice: 110,
  quantity: 10,
  realizedPnl: 100,
  charges: 5,
  status: 'WIN',
}];
assignDisciplineScores(tradesToInsert);
console.log(JSON.stringify(tradesToInsert, null, 2));
