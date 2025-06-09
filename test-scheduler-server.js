// test-scheduler-server.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Use a different port from main server

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Test endpoint to list all scheduled emails
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

// Start test server
app.listen(PORT, () => {
  console.log(`🧪 TEST SERVER running on port ${PORT}`);
});