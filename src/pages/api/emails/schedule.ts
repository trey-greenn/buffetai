import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API key validation
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    console.log('❌ Unauthorized: API key mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract request body
  const { 
    recipient_email, 
    subject, 
    email_content, 
    scheduled_for = new Date().toISOString(), 
    frequency = 'once'
  } = req.body;

  // Validate required fields
  if (!recipient_email || !email_content) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      requiredFields: ['recipient_email', 'email_content']
    });
  }

  try {
    // Insert new scheduled email into Supabase
    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        recipient_email,
        subject: subject || 'Your Personalized Newsletter',
        email_content,
        scheduled_for,
        status: 'pending',
        frequency
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error scheduling email:', error);
      return res.status(500).json({ error: 'Failed to schedule email', details: error.message });
    }

    console.log('✅ Email scheduled successfully:', data.id);
    return res.status(201).json({ 
      success: true, 
      message: 'Email scheduled successfully',
      emailId: data.id,
      scheduledFor: data.scheduled_for
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Server error while scheduling email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
