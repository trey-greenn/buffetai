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
    console.log('🔄 Processing pending emails queue');
    
    // Call the processPendingEmails function
    await processPendingEmails();
    
    // Return success response without trying to access results.length
    return res.status(200).json({ 
      success: true,
      execution_time: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error processing emails:', error);
    return res.status(500).json({ error: error.message || 'Failed to process emails' });
  }
}

// Add these placeholder functions to avoid errors
// async function processNewsletterSections() {
//   console.log('processNewsletterSections - placeholder implementation');
//   return true;
// }

// async function processContentCollections() {
//   console.log('processContentCollections - placeholder implementation');
//   return true;
// }