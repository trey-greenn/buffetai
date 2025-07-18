// server.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server URL
  credentials: true
}));
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET);

// Create scheduled email endpoint
app.post('/api/emails/schedule', async (req, res) => {
  console.log('📅 Schedule email endpoint called');
  
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    console.log('❌ Unauthorized: API key mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    recipient_email, 
    user_id = '0af0bba4-248f-49fe-8721-6219ea538bfc',
    subject = 'Your Personalized Newsletter',
    content,
    email_content,
    frequency = 'weekly'
  } = req.body;
  
  // Use either content or email_content
  const finalContent = content || email_content;
  
  // Validate required fields
  if (!recipient_email || !finalContent) {
    return res.status(400).json({ error: 'Recipient email and content are required' });
  }

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
    // Create new scheduled email with the format from test-scheduler-server.js
    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id,
        recipient_email,
        subject,
        email_content: finalContent,
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
      console.log('❌ Error scheduling email:', error);
      return res.status(500).json({ error: 'Failed to schedule email' });
    }

    console.log('✅ Email scheduled successfully:', data.id);
    return res.status(201).json({ success: true, emailId: data.id });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to schedule email' });
  }
});

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
    
    // Validate recipient email
    if (!email.recipient_email) {
      console.log('❌ No recipient email found, trying to fetch from user profile');
      
      // Try to get recipient email from user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', email.user_id)
        .single();
        
      if (userError || !userData?.email) {
        console.log('❌ Could not find user email:', userError);
        return res.status(400).json({ error: 'No recipient email found and could not retrieve from user profile' });
      }
      
      // Update the email record with the user's email
      const { error: updateEmailError } = await supabase
        .from('scheduled_emails')
        .update({ recipient_email: userData.email })
        .eq('id', emailId);
        
      if (updateEmailError) {
        console.log('❌ Failed to update email record with recipient:', updateEmailError);
      } else {
        console.log('✅ Updated email record with recipient:', userData.email);
        email.recipient_email = userData.email;
      }
    }
    
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
        email_content: emailContent,
        status: 'pending',
        scheduled_time: nextScheduledDate.toISOString(),
        send_date: nextScheduledDate.toISOString(),
        next_date: nextNextDate.toISOString(),
        section_data: email.section_data || [],
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
      message: 'Email sent successfully',
      data,
      nextEmailScheduled: !scheduleError
    });
    
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Test endpoints (from test-scheduler-server.js)
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
        subject,
        email_content: content,
        status: 'pending',
        scheduled_time: scheduledDate.toISOString(),
        send_date: scheduledDate.toISOString(),
        next_date: nextDate.toISOString(),
        section_data: [],
        frequency,
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

app.get('/test/list-emails', async (req, res) => {
  console.log('🧪 TEST: List emails endpoint called');
  
  try {
    const { data, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { priceId, productName, userId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }
  
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/pricing`,
        metadata: {
          productName,
          userId, // Store the user ID to associate with subscription later
        },
      });
  
      res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.error('Missing webhook secret');
    return res.status(500).send('Webhook secret is not configured');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      try {
        // Associate customer with user
        // First get the user ID from the session metadata (add this to your checkout session)
        const userId = session.metadata.userId;
        
        if (!userId) {
          console.warn('No user ID in session metadata');
          break;
        }
        
        // Update user subscription status in database
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            subscription_plan: session.metadata.productName,
            stripe_customer_id: session.customer,
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (error) {
          console.error('Error updating user subscription:', error);
        } else {
          console.log(`Updated subscription status for user ${userId}`);
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
      break;
      
    case 'customer.subscription.updated':
      // Handle subscription updates
      break;
      
    case 'customer.subscription.deleted':
      // Handle subscription cancellations
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.status(200).json({received: true});
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});