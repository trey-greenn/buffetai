// src/lib/openai.ts
import OpenAI from 'openai';
import { ENV } from '../config/env';

let openaiInstance: OpenAI | null = null;

export const getOpenAI = () => {
  if (!openaiInstance) {
    if (!ENV.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }
    
    openaiInstance = new OpenAI({
      apiKey: ENV.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  
  return openaiInstance;
};