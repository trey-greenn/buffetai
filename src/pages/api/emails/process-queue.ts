// src/pages/api/emails/process-queue.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { processPendingEmails } from '../../../lib/scheduler/emailProcessor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // API key validation
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await processPendingEmails();
    res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error('Error processing emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process emails';
    res.status(500).json({ error: errorMessage });
  }
}