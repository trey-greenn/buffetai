// src/pages/api/emails/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { supabase } from '../../../lib/supabase/client';
// import { scheduleNextEmail } from '../../../lib/scheduler/emailProcessor';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📧 TEST SCHEDULING VERSION - Email sending endpoint called');
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API key validation
  const apiKey = req.headers['x-api-key'];
  console.log('🔑 API Key provided:', apiKey);
  console.log('🔑 Expected API Key:', process.env.CRON_INTERNAL_API_KEY);
  
  if (apiKey !== process.env.CRON_INTERNAL_API_KEY) {
    console.log('❌ Unauthorized: API key mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { emailId } = req.body;
  console.log('📝 Email ID:', emailId);
  
  if (!emailId) {
    console.log('❌ No email ID provided');
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    // 1. Fetch email details from database
    console.log('🔍 Fetching email details from database');
    const { data: email, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('id', emailId)
      .eq('status', 'pending')
      .single();

    if (fetchError) {
      console.log('❌ Database fetch error:', fetchError);
      return res.status(404).json({ error: `Database error: ${fetchError.message}` });
    }

    if (!email) {
      console.log('❌ Email not found or already sent');
      return res.status(404).json({ error: 'Email not found or already sent' });
    }

    console.log('✅ Found email in database:', {
      id: email.id,
      recipient: email.recipient_email,
      subject: email.subject,
      status: email.status,
      scheduled_for: email.send_date
    });

    // 2. Send the email
    console.log('📤 Attempting to send email');
    const { data, error: sendError } = await resend.emails.send({
      from: 'Newsletter <info@williamtreygreen.com>',
      to: email.recipient_email,
      subject: email.subject,
      html: email.content,
    });

    if (sendError) {
      console.log('❌ Email sending error:', sendError);
      return res.status(400).json({ error: sendError });
    }

    console.log('✅ Email sent successfully:', data);

    // 3. Update status to 'sent' in database
    console.log('📝 Updating email status in database');
    const { error: updateError } = await supabase
      .from('scheduled_emails')
      .update({ 
        status: 'sent', 
      })
      .eq('id', emailId);

    if (updateError) {
      console.log('❌ Database update error:', updateError);
      return res.status(500).json({ error: `Failed to update email status: ${updateError.message}` });
    }

    console.log('✅ Email status updated to sent');
    
    // 4. Schedule the next email directly
    console.log('📋 DEBUG: About to schedule next email directly');
    try {
      // Get complete email data if needed
      let sectionIds = email.section_ids || [];
      let sectionData = email.section_data;
      const userId = email.user_id;
      
      console.log('📋 DEBUG: Initial email data:', {
        id: email.id,
        userId,
        sectionIds,
        sectionData: sectionData ? 'exists' : 'missing',
        next_date: email.next_date
      });
      
      if (!sectionIds.length && !sectionData) {
        console.log('📋 DEBUG: Missing section data, will try to use existing data');
        sectionIds = email.section_ids || [];
        sectionData = email.section_data;
        
        console.log('📋 DEBUG: After reassignment:', {
          sectionIds,
          sectionData: sectionData ? 'exists' : 'still missing'
        });
      }
      
      // Get section details
      console.log(`📋 DEBUG: Fetching section details for user ${userId}`);
      const { data: sectionsData, error: sectionsFetchError } = await supabase
        .from('newsletter_sections')
        .select('section_data')
        .eq('user_id', userId)
        .single();
      
      if (sectionsFetchError) {
        console.error('📋 DEBUG: Error fetching sections:', sectionsFetchError);
      }
        
      const sections = sectionsData?.section_data || [];
      console.log(`📋 DEBUG: Found ${sections.length} sections for user`);
      console.log('📋 DEBUG: Available sections:', JSON.stringify(sections.map((s: any) => ({ id: s.id, name: s.name }))));
      
      // Find relevant section
      console.log('📋 DEBUG: Looking for matching section');
      const section = sections.find((s: any) => 
        sectionIds.includes(s.id) || (sectionData && sectionData.id === s.id)
      );
      
      if (!section) {
        console.error('📋 DEBUG: Section not found! sectionIds:', sectionIds);
        console.error('📋 DEBUG: Section data ID:', sectionData?.id);
        throw new Error(`Section not found for email ${email.id}`);
      }
      
      console.log('📋 DEBUG: Found matching section:', { 
        id: section.id, 
        name: section.name,
        frequency: section.frequency 
      });
      
      // Calculate next dates
      console.log('📋 DEBUG: Calculating next dates');
      console.log('📋 DEBUG: Current next_date from email:', email.next_date);
      
      const nextSendDate = new Date(email.next_date);
      let nextNextDate = new Date(nextSendDate);
      
      console.log('📋 DEBUG: Base nextSendDate:', nextSendDate.toISOString());
      
      switch (section.frequency) {
        case 'daily': 
          nextNextDate.setDate(nextNextDate.getDate() + 1);
          console.log('📋 DEBUG: Using daily frequency');
          break;
        case 'weekly': 
          nextNextDate.setDate(nextNextDate.getDate() + 7);
          console.log('📋 DEBUG: Using weekly frequency');
          break;
        case 'bi-weekly': 
          nextNextDate.setDate(nextNextDate.getDate() + 14);
          console.log('📋 DEBUG: Using bi-weekly frequency');
          break;
        case 'monthly': 
          nextNextDate.setMonth(nextNextDate.getMonth() + 1);
          console.log('📋 DEBUG: Using monthly frequency');
          break;
        default: 
          nextNextDate.setDate(nextNextDate.getDate() + 7);
          console.log('📋 DEBUG: Using default weekly frequency');
      }
      
      console.log('📋 DEBUG: Calculated nextNextDate:', nextNextDate.toISOString());
      
      // Create new scheduled email
      console.log('📋 DEBUG: Creating new scheduled email');
      const { data: newEmail, error: insertError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: userId,
          status: 'pending',
          scheduled_time: nextSendDate.toISOString(),
          send_date: nextSendDate.toISOString(),
          next_date: nextNextDate.toISOString(),
          section_ids: sectionIds,
          section_data: sectionData || null,
          created_at: new Date().toISOString()
        })
        .select('id');
        
      if (insertError) {
        console.error('📋 DEBUG: Error inserting new email:', insertError);
        throw new Error(`Error scheduling next email: ${insertError.message}`);
      }
      
      console.log('📋 DEBUG: New email created successfully:', {
        id: newEmail?.[0]?.id,
        sendDate: nextSendDate.toISOString(),
        nextDate: nextNextDate.toISOString()
      });
      
      // Update newsletter section dates
      console.log('📋 DEBUG: Updating newsletter section dates');
      const updatedSections = sections.map((s: any) => {
        if (sectionIds.includes(s.id) || (sectionData && sectionData.id === s.id)) {
          console.log(`📋 DEBUG: Updating section ${s.id}`);
          return {
            ...s,
            startDate: nextSendDate.toISOString().slice(0, 16),
            sendDate: nextNextDate.toISOString().slice(0, 16)
          };
        }
        return s;
      });
      
      const { error: updateSectionsError } = await supabase
        .from('newsletter_sections')
        .update({
          section_data: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateSectionsError) {
        console.error('📋 DEBUG: Error updating section dates:', updateSectionsError);
      } else {
        console.log('📋 DEBUG: Section dates updated successfully');
      }
      
      console.log(`✅ Next email scheduled successfully: ${newEmail?.[0]?.id}`);
    } catch (scheduleError: any) {
      console.error('⚠️ Error scheduling next email:', scheduleError);
      console.error('Error stack:', scheduleError.stack);
    }

    return res.status(200).json({ 
      success: true, 
      data,
      nextEmailScheduled: true
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}