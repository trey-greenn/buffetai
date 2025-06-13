// test-direct.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

async function processPendingEmails() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();
    console.log(`Current time: ${nowISO}`);
    
    // Find emails to send
    const { data: emailsToSend, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('send_date', nowISO);
      
    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }
    
    console.log(`Found ${emailsToSend?.length || 0} emails to send`);
    
    // Process each email
    for (const email of emailsToSend || []) {
      try {
        console.log(`Processing email ${email.id}`);
        
        // Send the email
        const { data, error: sendError } = await resend.emails.send({
          from: 'Newsletter <info@williamtreygreen.com>',
          to: email.recipient_email,
          subject: email.subject || 'Your Newsletter',
          html: email.email_content || email.content
        });
        
        if (sendError) {
          console.error(`Error sending email:`, sendError);
          continue;
        }
        
        console.log(`Email sent successfully:`, data);
        
        // Update status
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({ status: 'sent' })
          .eq('id', email.id);
          
        if (updateError) {
          console.error(`Error updating status:`, updateError);
        }
      } catch (err) {
        console.error(`Error processing email ${email.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in processPendingEmails:', error);
  }
}

// Run the function
processPendingEmails().then(() => {
  console.log('Done!');
}).catch(console.error);