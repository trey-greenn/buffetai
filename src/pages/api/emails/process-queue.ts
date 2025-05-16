// src/pages/api/emails/process-queue.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { processEmailQueue } from '../../../lib/email/sender';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Optional API key validation for security
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.EMAIL_PROCESSOR_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await processEmailQueue();
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error processing email queue:', error);
    res.status(500).json({ error: error.message });
  }
}