import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export const MODEL = 'claude-3-5-sonnet-20241022';
