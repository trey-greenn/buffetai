import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase/client';
import { processEmailQueue } from '../../../lib/email/sender';
import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Option 1: Test direct send
    if (req.query.mode === 'direct') {
      const { data, error } = await resend.emails.send({
        from: 'Newsletter <info@williamtreygreen.com>',
        to: [req.body.email || 'your-test-email@example.com'],
        subject: 'Test Newsletter Email',
        html: '<h1>This is a test newsletter email</h1><p>If you can read this, the email sending is working!</p>',
      });

      if (error) {
        throw new Error(`Failed to send test email: ${error.message}`);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Test email sent directly', 
        id: data?.id 
      });
    }
    
    // Option 2: Test through queue
    // Create a test scheduled email
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
      .single();
      
    if (!userData) {
      return res.status(404).json({ error: 'No user found to test with' });
    }
    
    const { error } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: userData.id,
        status: 'pending',
        scheduled_time: new Date().toISOString(),
        email_content: `
          <html>
            <body>
              <h1>Test Newsletter Email</h1>
              <p>This is a test email from the newsletter system.</p>
              <p>If you're seeing this, the email queue processing is working!</p>
            </body>
          </html>
        `,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      throw new Error(`Error creating test email: ${error.message}`);
    }
    
    // Process the email queue
    await processEmailQueue();
    
    res.status(200).json({ success: true, message: 'Test email processed through queue' });
  } catch (error: any) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({ error: error.message });
  }
}