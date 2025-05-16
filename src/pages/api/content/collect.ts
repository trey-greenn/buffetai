// src/pages/api/content/collect.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { collectContentForTopic } from '../../../lib/content/collector';
import { processBatchContentItems } from '../../../lib/content/processor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Validate input
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  
  try {
    // Collect content
    const contentIds = await collectContentForTopic(topic);
    
    // Process collected content
    await processBatchContentItems(contentIds);
    
    res.status(200).json({ success: true, count: contentIds.length });
  } catch (error: any) {
    console.error('Error collecting content:', error);
    res.status(500).json({ error: error.message });
  }
}