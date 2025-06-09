const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { processPendingEmails } = require('./dist/lib/scheduler/emailProcessor');
const { processNewsletterSections } = require('./dist/lib/scheduler/emailProcessor');
const { processContentCollections } = require('./dist/lib/content/automatedCollector');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for both local and production
app.use(cors({
  origin: [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, 'http://localhost:5173']
}));
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    const { data, error } = await resend.emails.send({
      from: 'Newsletter <info@williamtreygreen.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ data });
  } catch (error) {
    // console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Test endpoint to create a scheduled email
app.post('/test/schedule-email', async (req, res) => {
  console.log('🧪 TEST: Schedule email endpoint called');
  console.log('Request body:', JSON.stringify(req.body));
  
  const { 
    recipient_email = 'test@example.com',
    user_id = '0af0bba4-248f-49fe-8721-6219ea538bfc',
    subject = 'Test Email',
    content = '<p>This is a test email</p>',
    frequency = 'weekly'
  } = req.body;

  // Calculate dates
  const now = new Date();
  const scheduledDate = new Date(now);
  const nextDate = new Date(now);
  
  switch (frequency) {
    case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
    case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
    case 'bi-weekly': nextDate.setDate(nextDate.getDate() + 14); break;
    case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
    default: nextDate.setDate(nextDate.getDate() + 7);
  }

  try {
    // Insert test record
    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id,
        recipient_email,
        email_content: content, // Include both field names for compatibility
        status: 'pending',
        scheduled_time: scheduledDate.toISOString(),
        send_date: scheduledDate.toISOString(), 
        next_date: nextDate.toISOString(),
        section_data: [],
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error
      });
    }

    console.log('✅ Test email scheduled successfully:', data);
    return res.status(201).json({ 
      success: true,
      data,
      message: 'Test email record created successfully'
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});


// Email sending endpoint (add your complete implementation from server.js)
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

    // Schedule the next email automatically
    const now = new Date();
    const nextScheduledDate = new Date(email.next_date || now);
    const nextNextDate = new Date(nextScheduledDate);
    
    // Calculate the date after next based on frequency
    const frequency = email.frequency || 'weekly';
    switch (frequency) {
      case 'daily': nextNextDate.setDate(nextNextDate.getDate() + 1); break;
      case 'weekly': nextNextDate.setDate(nextNextDate.getDate() + 7); break;
      case 'bi-weekly': nextNextDate.setDate(nextNextDate.getDate() + 14); break;
      case 'monthly': nextNextDate.setMonth(nextNextDate.getMonth() + 1); break;
      default: nextNextDate.setDate(nextNextDate.getDate() + 7);
    }
    
    // Create next scheduled email
    const { error: scheduleError } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: email.user_id,
        recipient_email: email.recipient_email,
        subject: email.subject,
        email_content: emailContent,
        status: 'pending',
        scheduled_time: nextScheduledDate.toISOString(),
        send_date: nextScheduledDate.toISOString(),
        next_date: nextNextDate.toISOString(),
        section_data: email.section_data || [],
        frequency: email.frequency || 'weekly',
        created_at: now.toISOString()
      });
      
    if (scheduleError) {
      console.log('⚠️ Failed to schedule next email:', scheduleError);
      // Continue with success response even if scheduling fails
    } else {
      console.log('✅ Next email scheduled successfully for:', nextScheduledDate.toISOString());
    }

    console.log('✅ Email sent successfully');
    return res.status(200).json({ 
      success: true,
      data,
      nextEmailScheduled: !scheduleError
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Process email queue - called by cron
app.post('/api/emails/process-queue', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await processPendingEmails();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: error.message || 'Failed to process emails' });
  }
});

// Process newsletter sections - called by cron
app.post('/api/newsletters/process-sections', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await processNewsletterSections();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing sections:', error);
    res.status(500).json({ error: error.message || 'Failed to process sections' });
  }
});

// Collect content - called by cron
app.post('/api/content/collect-all', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await processContentCollections();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error collecting content:', error);
    res.status(500).json({ error: error.message || 'Failed to collect content' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;