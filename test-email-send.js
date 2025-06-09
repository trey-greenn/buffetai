// test-email-send.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Email sending endpoint
app.post('/api/emails/send', async (req, res) => {
  console.log('📧 Email sending endpoint called');
  console.log('Request body:', JSON.stringify(req.body));
  
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    console.log('❌ Unauthorized: API key mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { emailId } = req.body;
  if (!emailId) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    // Fetch email details
    const { data: email, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('id', emailId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !email) {
      console.log('❌ Email not found:', fetchError);
      return res.status(404).json({ error: 'Email not found or already sent' });
    }

    console.log('✅ Found email:', email);
    
    // Get email content from the appropriate field
    const emailContent = email.email_content || email.content;
    
    if (!emailContent) {
      console.log('❌ No email content found');
      return res.status(400).json({ error: 'Email content missing' });
    }

    // Prepare email data
    const emailData = {
      from: 'Newsletter <info@williamtreygreen.com>',
      to: email.recipient_email,
      subject: email.subject || 'Your Personalized Newsletter',
      html: emailContent
    };

    console.log('Preparing to send email with data:', {
      to: emailData.to,
      subject: emailData.subject,
      contentLength: emailData.html ? emailData.html.length : 0
    });

    // Send email
    const { data, error: sendError } = await resend.emails.send(emailData);

    if (sendError) {
      console.log('❌ Send error:', sendError);
      return res.status(400).json({ error: sendError });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('scheduled_emails')
      .update({ 
        status: 'sent',
      })
      .eq('id', emailId);

    if (updateError) {
      console.log('❌ Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update email status' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      data
    });
    
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});