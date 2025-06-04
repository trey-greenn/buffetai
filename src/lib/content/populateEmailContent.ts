import { supabase } from '../supabase/client';
import { scheduleContentCollection } from './automatedCollector';

interface ContentItem {
  id: string;
  title: string;
  url: string;
  topic: string;
}

/**
 * Populate email_content for pending scheduled emails based on collected content
 */
export async function populatePendingEmailContent(): Promise<void> {
  try {
    console.log('Running email content population job');
    
    // Get all pending emails with empty content
    const { data: pendingEmails, error: emailsError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .is('email_content', null);
      
    if (emailsError) throw emailsError;
    
    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails with empty content found');
      return;
    }
    
    // Process each email
    for (const email of pendingEmails) {
      try {
        const userId = email.user_id;
        const sendDate = new Date(email.send_date);
        const nextDate = new Date(email.next_date);
        
        // Get newsletter section data
        const { data: sectionData, error: sectionError } = await supabase
          .from('newsletter_sections')
          .select('section_data')
          .eq('user_id', userId)
          .single();
          
        if (sectionError) {
          console.error(`Error fetching sections for email ${email.id}:`, sectionError);
          continue;
        }
        
        const sections = sectionData?.section_data || [];
        
        // Find section associated with this email
        const section = sections.find(s => s.id === email.section_data?.id);
        
        if (!section || !section.topic) {
          console.warn(`No section or topic found for email ${email.id}`);
          continue;
        }
        
        // 1. Schedule content collection if not already done
        await scheduleContentCollection(
          userId,
          new Date(), // current date as start
          sendDate,   // send date as next delivery
          [section.id]
        );
        
        // 2. Get content already collected for this user and topic
        const { data: contentItems, error: contentError } = await supabase
          .from('content_items')
          .select('id, title, url, topic, created_at')
          .eq('topic', section.topic)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (contentError) {
          console.error(`Error fetching content for email ${email.id}:`, contentError);
          continue;
        }
        
        if (!contentItems || contentItems.length === 0) {
          console.log(`No content found for topic ${section.topic}, skipping for now`);
          continue;
        }
        
        // 3. Format email content
        const emailContent = {
          subject: `Your ${section.topic} Newsletter`,
          items: contentItems.map(item => ({
            id: item.id,
            title: item.title,
            url: item.url,
            topic: item.topic
          })),
          introduction: `Here are the latest articles about ${section.topic} for you.`,
          section: section
        };
        
        // 4. Update the email with content
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({ 
            email_content: emailContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
          
        if (updateError) {
          console.error(`Error updating email ${email.id} with content:`, updateError);
          continue;
        }
        
        console.log(`Updated email ${email.id} with ${contentItems.length} content items`);
      } catch (err) {
        console.error(`Error processing email ${email.id}:`, err);
      }
    }
    
    console.log('Finished populating email content');
  } catch (error) {
    console.error('Error in populatePendingEmailContent:', error);
  }
}