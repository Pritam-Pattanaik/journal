import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Starting AI test...");
  try {
    const { marketAIService } = await import('./src/market/MarketAIService');
    const summary = await marketAIService.generateSummaryJSON();
    console.log("Summary Result:", summary);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
