// /api/daily-tasks.js
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize services
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  // Verify this is a Vercel cron job
  if (req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('Starting daily tasks: content collection and email updates');
    
    // 1. Log execution in our monitoring table
    await supabase
      .from('cron_heartbeat')
      .insert([{ timestamp: new Date().toISOString() }]);
    
    // 2. Process emails that need to be sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all emails due today
    const { data: emailsToSend, error: emailError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .gte('send_date', today.toISOString())
      .lt('send_date', tomorrow.toISOString());
    
    if (emailError) throw emailError;
    
    console.log(`Found ${emailsToSend?.length || 0} emails to process for today`);
    
    // Process each email
    const emailResults = [];
    for (const email of emailsToSend || []) {
      try {
        // Send the email
        const emailContent = email.email_content || email.content;
        
        if (!emailContent || !email.recipient_email) {
          console.log(`Skipping email ${email.id} - missing content or recipient`);
          continue;
        }
        
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: 'Newsletter <info@williamtreygreen.com>',
          to: email.recipient_email,
          subject: email.subject || 'Your Daily Newsletter',
          html: emailContent
        });
        
        if (sendError) {
          console.error(`Error sending email ${email.id}:`, sendError);
          continue;
        }
        
        // Update status to sent
        await supabase
          .from('scheduled_emails')
          .update({ status: 'sent' })
          .eq('id', email.id);
        
        // Schedule next email for tomorrow (since we only support daily now)
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1); // tomorrow
        
        await supabase
          .from('scheduled_emails')
          .insert({
            user_id: email.user_id,
            recipient_email: email.recipient_email,
            subject: email.subject,
            email_content: emailContent,
            status: 'pending',
            send_date: nextDate.toISOString(),
            frequency: 'daily',
            created_at: new Date().toISOString()
          });
        
        emailResults.push({ id: email.id, success: true });
      } catch (emailErr) {
        console.error(`Error processing email ${email.id}:`, emailErr);
        emailResults.push({ id: email.id, success: false, error: emailErr.message });
      }
    }
    
    // 3. Collect new content for subscribed topics
    // This is simplified - you would need to implement your specific content collection logic
    const { data: activeTopics, error: topicsError } = await supabase
      .from('content_topics')
      .select('*')
      .eq('active', true);
    
    if (topicsError) throw topicsError;
    
    console.log(`Processing ${activeTopics?.length || 0} active topics for content collection`);
    
    // Here you would add your content collection logic for each topic
    // This is placeholder for your actual implementation
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      emails_processed: emailResults.length,
      topics_processed: activeTopics?.length || 0
    });
  } catch (error) {
    console.error('Daily tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}