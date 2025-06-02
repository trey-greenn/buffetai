// src/lib/email/sender.ts
import { supabase } from '../supabase/client';
import { Resend } from 'resend';
import { generateNewsletterForUser } from './generator';

interface ScheduledEmail {
  id: string;
  user_id: string;
  userEmail: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_time: string;
  sent_time?: string;
  email_content?: string;
}

// Configure Resend client
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Company email will be set up tomorrow
const companyEmail = process.env.COMPANY_EMAIL || 'info@williamtreygreen.com';

async function getPendingEmailsDue(): Promise<ScheduledEmail[]> {
  const now = new Date().toISOString();
  
  // Get emails that are scheduled to be sent now or earlier
  const { data, error } = await supabase
    .from('scheduled_emails')
    .select(`
      *,
      profiles:profiles(email)
    `)
    .eq('status', 'pending')
    .lte('scheduled_time', now);
    
  if (error) {
    console.error('Error fetching pending emails:', error);
    return [];
  }
  
  return (data || []).map(item => ({
    ...item,
    userEmail: item.profiles?.email
  })) as ScheduledEmail[];
}

async function updateEmailContent(emailId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_emails')
    .update({ email_content: content })
    .eq('id', emailId);
    
  if (error) {
    throw new Error(`Error updating email content: ${error.message}`);
  }
}

async function markEmailAsSent(emailId: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_emails')
    .update({ 
      status: 'sent',
      sent_time: new Date().toISOString()
    })
    .eq('id', emailId);
    
  if (error) {
    throw new Error(`Error marking email as sent: ${error.message}`);
  }
}

async function markEmailAsFailed(emailId: string, errorMessage: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_emails')
    .update({ 
      status: 'failed',
      error_message: errorMessage
    })
    .eq('id', emailId);
    
  if (error) {
    console.error(`Error marking email as failed: ${error.message}`);
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: `Newsletter <${companyEmail}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    // console.log('Email sent with ID:', data?.id);
  } catch (error: any) {
    console.error('Error sending email via Resend:', error);
    throw error;
  }
}

export async function processEmailQueue(): Promise<void> {
  // Get pending emails that are due
  const pendingEmails = await getPendingEmailsDue();
  
  for (const email of pendingEmails) {
    try {
      // Generate content if not already generated
      if (!email.email_content) {
        email.email_content = await generateNewsletterForUser(email.user_id);
        await updateEmailContent(email.id, email.email_content);
      }
      
      // Send the email
      await sendEmail({
        to: email.userEmail,
        subject: "Your Custom Newsletter",
        html: email.email_content
      });
      
      // Mark as sent
      await markEmailAsSent(email.id);
    } catch (error: any) {
      console.error(`Failed to send email ${email.id}:`, error);
      await markEmailAsFailed(email.id, error.message);
    }
  }
}