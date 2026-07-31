import { AIProvider } from './AIProvider';
import { GroqProvider } from './providers/GroqProvider';
import { NemotronProvider } from './providers/NemotronProvider';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  const providerType = process.env.AI_PROVIDER || 'groq';

  switch (providerType.toLowerCase()) {
    case 'nemotron':
      providerInstance = new NemotronProvider();
      break;
    case 'groq':
    default:
      providerInstance = new GroqProvider();
      break;
  }

  return providerInstance;
}
