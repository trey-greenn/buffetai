// /api/cron-heartbeat.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Verify this is a Vercel cron job
  if (req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Simply insert the current timestamp
    const { data, error } = await supabase
      .from('cron_heartbeat')
      .insert([{ timestamp: new Date().toISOString() }]);
      
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron heartbeat error:', error);
    return res.status(500).json({ error: error.message });
  }
}