import type { NextApiRequest, NextApiResponse } from 'next';
import { populatePendingEmailContent } from '../../lib/content/populateEmailContent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await populatePendingEmailContent();
    return res.status(200).json({ message: 'Email content populated' });
  } catch (error) {
    console.error('Error populating content:', error);
    return res.status(500).json({ error: 'Failed to populate content' });
  }
}