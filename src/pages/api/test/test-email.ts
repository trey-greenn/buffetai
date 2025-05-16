import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function sendTestEmail() {
  const resendApiKey = process.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('VITE_RESEND_API_KEY not found in environment variables');
    return;
  }

  const resend = new Resend(resendApiKey);
  const testEmail = process.argv[2] || 'w.treygreen@gmail.com';

  try {
    console.log(`Sending test email to ${testEmail}...`);
    const { data, error } = await resend.emails.send({
      from: 'Newsletter <info@williamtreygreen.com>',
      to: [testEmail],
      subject: 'Test Newsletter Email',
      html: '<h1>This is a test newsletter email</h1><p>If you can read this, the email sending is working!</p>',
    });

    if (error) {
      throw error;
    }

    console.log('Email sent successfully!');
    console.log('Email ID:', data?.id);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();