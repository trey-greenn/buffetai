import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase/client';

export async function POST() {
  try {
    const now = new Date();
    
    // Get all newsletter sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('user_id, section_data');
      
    if (sectionsError) throw sectionsError;

    // Process each section
    for (const userSection of sectionsData || []) {
      const userId = userSection.user_id;
      const sections = userSection.section_data || [];
      
      for (const section of sections) {
        const sendDate = new Date(section.startDate);
        const nextDate = new Date(section.sendDate);
        
        // Only create pending emails for future dates
        if (sendDate <= now) continue;

        // Check for existing pending email
        const { data: existing } = await supabase
          .from('scheduled_emails')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .eq('send_date', sendDate.toISOString())
          .single();

        if (!existing) {
          // Create new scheduled email
          await supabase
            .from('scheduled_emails')
            .insert({
              user_id: userId,
              status: 'pending',
              send_date: sendDate.toISOString(),
              next_date: nextDate.toISOString(),
              section_ids: [section.id],
              created_at: now.toISOString()
            });
        }
      }
    }

    return NextResponse.json({ message: 'Newsletters processed successfully' });
  } catch (error) {
    console.error('Error processing newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to process newsletters' },
      { status: 500 }
    );
  }
}