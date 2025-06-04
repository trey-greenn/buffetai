import type { NextApiRequest, NextApiResponse } from 'next';
import { scheduleContentCollection } from '../../lib/content/automatedCollector';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, startDate, nextDeliveryDate, sectionIds } = req.body;
    
    await scheduleContentCollection(
      userId,
      new Date(startDate),
      new Date(nextDeliveryDate),
      sectionIds
    );

    return res.status(200).json({ message: 'Content collection scheduled' });
  } catch (error) {
    console.error('Error scheduling collection:', error);
    return res.status(500).json({ error: 'Failed to schedule collection' });
  }
}