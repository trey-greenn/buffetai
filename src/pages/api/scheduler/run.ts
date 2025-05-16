// src/pages/api/scheduler/run.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { scheduleNewslettersForNextPeriod } from '../../../lib/scheduler/emailScheduler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Optional API key validation for security
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SCHEDULER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await scheduleNewslettersForNextPeriod();
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error running scheduler:', error);
    res.status(500).json({ error: error.message });
  }
}