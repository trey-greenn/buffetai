const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
// const { processPendingEmails } = require('./src/lib/scheduler/emailProcessor.ts');
// const { processNewsletterSections } = require('./src/lib/scheduler/emailProcessor.ts');
// const { processContentCollections } = require('./src/lib/content/automatedCollector.ts');

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
  // Log the execution at the start
  await logCronExecution('process-queue');
  
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('🔄 Processing pending emails queue');
    
    // Call our local implementation of processPendingEmails
    const results = await processPendingEmails();
    
    // Add execution details to the response
    return res.status(200).json({ 
      success: true, 
      processed: results.length,
      results,
      execution_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error processing emails:', error);
    return res.status(500).json({ error: error.message || 'Failed to process emails' });
  }
});

// Process newsletter sections - called by cron
app.post('/api/newsletters/process-sections', async (req, res) => {
  await logCronExecution('process-sections');
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
  await logCronExecution('collect-content');
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

// Add this to server.cjs
app.get('/api/cron/health', async (req, res) => {
  try {
    // Get the last 5 cron job executions
    const { data, error } = await supabase
      .from('cron_executions')  // Create this table in your database
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    
    // Check if any emails were processed in the last 24 hours
    const { data: emailsProcessed, error: emailsError } = await supabase
      .from('scheduled_emails')
      .select('count')
      .eq('status', 'sent')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    return res.status(200).json({
      status: 'healthy',
      last_executions: data,
      emails_processed_24h: emailsProcessed,
      current_time: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a function to log cron executions
async function logCronExecution(jobName, status = 'completed', details = {}) {
  try {
    await supabase.from('cron_executions').insert({
      job_name: jobName,
      executed_at: new Date().toISOString(),
      status,
      details
    });
  } catch (error) {
    console.error(`Failed to log cron execution: ${error.message}`);
  }
}

// Add this to server.cjs
app.post('/api/test/cron-email', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Create a test email scheduled to send 1 minute from now
    const now = new Date();
    const sendDate = new Date(now.getTime() + 60 * 1000); // 1 minute from now
    
    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: req.body.user_id || '0af0bba4-248f-49fe-8721-6219ea538bfc',
        recipient_email: req.body.email || 'test@example.com',
        subject: 'CRON TEST - ' + now.toISOString(),
        email_content: `<p>This is a test email to verify cron jobs are working. Created at ${now.toISOString()}</p>`,
        status: 'pending',
        scheduled_time: now.toISOString(),
        send_date: sendDate.toISOString(),
        next_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week later
        created_at: now.toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      message: 'Test email scheduled',
      email: data,
      should_send_at: sendDate.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add a simple admin endpoint to view recent cron activities
app.get('/api/admin/cron-activity', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get recent executions grouped by job
    const { data, error } = await supabase
      .from('cron_executions')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    
    // Group by job name
    const groupedByJob = {};
    data.forEach(execution => {
      if (!groupedByJob[execution.job_name]) {
        groupedByJob[execution.job_name] = [];
      }
      groupedByJob[execution.job_name].push(execution);
    });
    
    // Get pending email stats
    const { data: pendingData, error: pendingError } = await supabase
      .from('scheduled_emails')
      .select('count')
      .eq('status', 'pending');
      
    if (pendingError) throw pendingError;
    
    return res.status(200).json({
      job_executions: groupedByJob,
      pending_emails: pendingData[0]?.count || 0,
      server_time: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

// Add this function after your import statements
async function processPendingEmails() {
  try {
    const now = new Date();
    
    // Find emails that need to be sent (send_date has passed)
    const { data: emailsToSend, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('send_date', now.toISOString());
      
    if (error) {
      console.error('Error fetching emails to send:', error);
      return [];
    }
    
    console.log(`Found ${emailsToSend?.length || 0} emails to send`);
    
    const results = [];
    
    // Process each email
    for (const email of emailsToSend || []) {
      try {
        console.log(`Processing email ${email.id}`);
        
        // Extract email content
        const emailContent = email.email_content || email.content;
        
        if (!emailContent || !email.recipient_email) {
          console.log(`❌ Missing content or recipient for email ${email.id}`);
          results.push({ id: email.id, success: false, reason: 'Missing content or recipient' });
          continue;
        }
        
        // Send the email directly using Resend
        const { data, error: sendError } = await resend.emails.send({
          from: 'Newsletter <info@williamtreygreen.com>',
          to: email.recipient_email,
          subject: email.subject || 'Your Personalized Newsletter',
          html: emailContent
        });
        
        if (sendError) {
          console.log(`❌ Error sending email ${email.id}:`, sendError);
          results.push({ id: email.id, success: false, error: sendError });
          continue;
        }
        
        // Update status to sent
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({ status: 'sent' })
          .eq('id', email.id);
          
        if (updateError) {
          console.log(`❌ Error updating email status ${email.id}:`, updateError);
          results.push({ id: email.id, success: true, updateError: true });
          continue;
        }
        
        // Schedule next email
        await scheduleNextEmail(email);
        
        console.log(`✅ Processed email ${email.id} successfully`);
        results.push({ 
          id: email.id, 
          success: true, 
          nextScheduled: true
        });
      } catch (err) {
        console.error(`❌ Error processing email ${email.id}:`, err);
        results.push({ id: email.id, success: false, error: err.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in processPendingEmails:', error);
    return [];
  }
}

// Add this function after processPendingEmails
async function scheduleNextEmail(email) {
  try {
    const userId = email.user_id;
    const now = new Date();
    
    // Use the next_date from the email as the new send_date
    const nextSendDate = new Date(email.next_date || now);
    let nextNextDate = new Date(nextSendDate);
    
    // Calculate the next-next date based on frequency
    const frequency = email.frequency || 'weekly';
    switch (frequency) {
      case 'daily': nextNextDate.setDate(nextNextDate.getDate() + 1); break;
      case 'weekly': nextNextDate.setDate(nextNextDate.getDate() + 7); break;
      case 'bi-weekly': nextNextDate.setDate(nextNextDate.getDate() + 14); break;
      case 'monthly': nextNextDate.setMonth(nextNextDate.getMonth() + 1); break;
      default: nextNextDate.setDate(nextNextDate.getDate() + 7); // Default to weekly
    }
    
    // Create next scheduled email
    const { data: newEmail, error: scheduleError } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: email.user_id,
        recipient_email: email.recipient_email,
        subject: email.subject,
        email_content: email.email_content || email.content,
        status: 'pending',
        scheduled_time: nextSendDate.toISOString(),
        send_date: nextSendDate.toISOString(),
        next_date: nextNextDate.toISOString(),
        section_data: email.section_data || [],
        frequency: frequency,
        created_at: now.toISOString()
      })
      .select('id');
      
    if (scheduleError) {
      console.log('⚠️ Failed to schedule next email:', scheduleError);
      return false;
    } else {
      console.log('✅ Next email scheduled successfully for:', nextSendDate.toISOString());
      return true;
    }
  } catch (error) {
    console.error('Error in scheduleNextEmail:', error);
    console.error('Email data:', JSON.stringify(email));
    return false;
  }
}