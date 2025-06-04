// src/lib/email/updateEmailContent.ts
import { supabase } from '../supabase/client';



/**
 * Updates a pending scheduled email with the 3 most recent content items
 * @param emailId The ID of the scheduled email to update
 * @param topic The topic to fetch content for
 */
export async function updateEmailWithRecentContent(
  emailId: string,
  topic: string
): Promise<void> {
  try {
    // Get the 3 most recent content items for this topic
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('id, title, url, topic, summary, source')
      .eq('topic', topic)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (contentError) {
      console.error('Error fetching content items:', contentError);
      throw contentError;
    }
    
    if (!contentItems || contentItems.length === 0) {
      console.warn(`No content items found for topic: ${topic}`);
      return;
    }
    
    // Get the email and its section data
    const { data: emailData, error: emailError } = await supabase
      .from('scheduled_emails')
      .select('section_data')
      .eq('id', emailId)
      .single();
      
    if (emailError) {
      console.error('Error fetching email data:', emailError);
      throw emailError;
    }
    
    const section = emailData.section_data;
    
    // Format email content
    const emailContent = {
      subject: `Your ${topic} Newsletter`,
      items: contentItems,
      introduction: `Here are the latest articles about ${topic} for you.`,
      section: section
    };
    
    // Update email with content
    const { error: updateError } = await supabase
      .from('scheduled_emails')
      .update({ 
        email_content: emailContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);
      
    if (updateError) {
      console.error('Error updating email content:', updateError);
      throw updateError;
    }
    
    console.log(`Updated email ${emailId} with ${contentItems.length} content items`);
  } catch (error) {
    console.error('Error updating email with latest content:', error);
    throw error;
  }
}

/**
 * Updates all pending scheduled emails with recent content
 */
export async function updateAllPendingEmails(): Promise<void> {
  try {
    // Get all pending scheduled emails
    const { data: pendingEmails, error: emailsError } = await supabase
      .from('scheduled_emails')
      .select('id, section_data')
      .eq('status', 'pending')
      .is('email_content', null);
      
    if (emailsError) {
      console.error('Error fetching pending emails:', emailsError);
      throw emailsError;
    }
    
    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails found that need content.');
      return;
    }
    
    // Update each pending email
    for (const email of pendingEmails) {
      const topic = email.section_data?.topic;
      if (!topic) {
        console.warn(`Email ${email.id} has no topic in section_data`);
        continue;
      }
      
      await updateEmailWithRecentContent(email.id, topic);
    }
    
    console.log(`Updated ${pendingEmails.length} pending emails with content`);
  } catch (error) {
    console.error('Error updating pending emails:', error);
    throw error;
  }
}