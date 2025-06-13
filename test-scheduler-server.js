// test-process-existing-emails.js
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProcessExistingEmails() {
  try {
    // Step 1: Check for existing pending emails
    console.log('Checking for existing pending emails...');
    const now = new Date();
    
    const { data: pendingEmails, error: pendingError } = await supabase
      .from('scheduled_emails')
      .select('id, recipient_email, send_date, subject')
      .eq('status', 'pending')
      .lte('send_date', now.toISOString());
      
    if (pendingError) {
      throw new Error(`Error fetching pending emails: ${pendingError.message}`);
    }
    
    console.log(`Found ${pendingEmails.length} emails ready to be sent:`);
    pendingEmails.forEach(email => {
      console.log(`- Email ID: ${email.id}, Send date: ${email.send_date}`);
    });
    
    if (pendingEmails.length === 0) {
      console.log('No pending emails found. Test cannot continue.');
      return;
    }
    
    // Save the IDs of pending emails for later comparison
    const pendingEmailIds = pendingEmails.map(email => email.id);
    
    // Step 2: Trigger the cron job manually
    console.log('\nTriggering the email processor...');
    const response = await fetch('http://localhost:3000/api/emails/process-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CRON_INTERNAL_API_KEY
      }
    });
    
    const responseData = await response.json();
    console.log('Email processor response:', responseData);
    
    // Step 3: Verify the emails were sent
    console.log('\nVerifying emails were sent...');
    const { data: sentEmails, error: sentError } = await supabase
      .from('scheduled_emails')
      .select('id, recipient_email, updated_at, subject, status')
      .in('id', pendingEmailIds);
      
    if (sentError) {
      throw new Error(`Error fetching sent emails: ${sentError.message}`);
    }
    
    console.log('Status of processed emails:');
    sentEmails.forEach(email => {
      console.log(`- Email ID: ${email.id}, Status: ${email.status}, Updated at: ${email.updated_at}`);
    });
    
    const allSent = sentEmails.every(email => email.status === 'sent');
    if (allSent) {
      console.log('\n✅ SUCCESS: All emails were processed and marked as sent');
    } else {
      console.log('\n⚠️ WARNING: Some emails were not marked as sent');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testProcessExistingEmails();