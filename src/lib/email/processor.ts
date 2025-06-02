// src/lib/email/processor.ts
import { supabase } from '../supabase/client';
// import { Resend } from 'resend';

// Get Resend API key from environment variables
// const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
// const resend = new Resend(resendApiKey);

export async function processScheduledEmail(emailId: string) {
  try {
    // console.log(`Processing email ID: ${emailId}`);
    // console.log(`Using Resend API key: ${resendApiKey ? 'Available' : 'Missing'}`);
    
    // Get the email data first without joining
    const { data: emailData, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('id', emailId)
      .single();
      
    if (fetchError || !emailData) {
      console.error('Email fetch error:', fetchError);
      throw new Error('Email not found');
    }
    
    // console.log('Retrieved email data:', JSON.stringify({
    //   id: emailData.id,
    //   status: emailData.status,
    //   user_id: emailData.user_id,
    //   content_length: emailData.email_content?.length || 0
    // }));
    
    // Get email directly from auth user
    let finalEmail;
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (currentUser?.user?.email) {
      finalEmail = currentUser.user.email;
      // console.log(`Using current user email: ${finalEmail}`);
    } else {
      throw new Error('Could not determine recipient email address');
    }
    
    // Check if email content exists
    if (!emailData.email_content) {
      throw new Error('Email content is empty');
    }
    
    // Send email using Resend
    // console.log(`Sending email to: ${finalEmail}`);
    
    try {
      // Log full Resend config for debugging
      // console.log('Sending email via API:', {
      //   to: finalEmail,
      //   subject: 'Your Personalized Newsletter',
      //   htmlLength: emailData.email_content.length
      // });
      
      const apiUrl = import.meta.env.PROD 
  ? '/api/send-email'  // Relative URL for production
  : 'http://localhost:3000/api/send-email'; // Full URL for development

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: [finalEmail],
    subject: 'Your Personalized Newsletter',
    html: emailData.email_content,
  }),
});

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`Failed to send email: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      // console.log('Email sent successfully with ID:', result.data?.id);
      
      // Update status
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'sent',
          sent_time: new Date().toISOString(),
        })
        .eq('id', emailId);
        
      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      
      return true;
    } catch (resendErr: any) {
      console.error('Detailed Resend error:', JSON.stringify(resendErr));
      throw new Error(`Email sending failed: ${resendErr.message}`);
    }
  } catch (err: any) {
    console.error('Error processing email:', err);
    
    // Update status to failed with detailed error message
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