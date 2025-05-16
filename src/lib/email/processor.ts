// src/lib/email/processor.ts
import { supabase } from '../supabase/client';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export async function processScheduledEmail(emailId: string) {
  try {
    // Get the email data with user information
    const { data: emailData, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*, profiles(email)')
      .eq('id', emailId)
      .single();
      
    if (fetchError || !emailData) {
      throw new Error('Email not found');
    }
    
    // Get user's email from the join with profiles table
    const userEmail = emailData.profiles?.email;
    let finalEmail = userEmail;
    
    if (!finalEmail) {
      // Fallback: get the authenticated user's email
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.email) {
        throw new Error('User email not found');
      }
      finalEmail = data.user.email;
    }
    
    // Send email
    const { error: sendError } = await resend.emails.send({
      from: 'Newsletter <info@williamtreygreen.com>',
      to: [finalEmail],
      subject: 'Your Personalized Newsletter',
      html: emailData.email_content,
    });
    
    if (sendError) {
      throw sendError;
    }
    
    // Update status
    const { error: updateError } = await supabase
      .from('scheduled_emails')
      .update({
        status: 'sent',
        sent_time: new Date().toISOString(),
      })
      .eq('id', emailId);
      
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch (err: any) {
    console.error('Error processing email:', err);
    
    // Update status to failed
    await supabase
      .from('scheduled_emails')
      .update({
        status: 'failed',
        error_message: err.message || 'Failed to send email'
      })
      .eq('id', emailId);
      
    return false;
  }
}