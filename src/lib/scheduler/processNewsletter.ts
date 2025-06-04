import { supabase } from '../supabase/client';

// Store the most recent content items for debugging
let recentContentItems: Record<string, any[]> = {};

// Direct content population without Node.js specific code
export async function processNewsletters(): Promise<void> {
  try {
    console.log("processNewsletters started");
    const now = new Date();
    
    // Get all newsletter sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('user_id, section_data');
      
    if (sectionsError) throw sectionsError;
    console.log("Found sections data:", sectionsData?.length || 0);

    // Process each section
    for (const userSection of sectionsData || []) {
      const userId = userSection.user_id;
      const sections = userSection.section_data || [];
      
      for (const section of sections) {
        console.log("Processing section:", section.topic);
        const sendDate = new Date(section.startDate);
        const nextDate = new Date(section.sendDate);
        
        // Only create pending emails for future dates
        if (sendDate <= now) {
          console.log("Skipping past date:", sendDate);
          continue;
        }

        // Check for existing pending email
        const { data: existing, error } = await supabase
          .from('scheduled_emails')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .eq('send_date', sendDate.toISOString());

        if (error) throw error;
        
        let emailId;
        
        if (!existing || existing.length === 0) {
          console.log("Creating new email for topic:", section.topic);
          // Create new scheduled email
          const { data: newEmail, error: insertError } = await supabase
            .from('scheduled_emails')
            .insert({
              user_id: userId,
              status: 'pending',
              scheduled_time: sendDate.toISOString(),
              send_date: sendDate.toISOString(),
              next_date: nextDate.toISOString(),
              section_data: section,
              created_at: now.toISOString()
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error('Error creating email:', insertError);
            continue;
          }
          
          emailId = newEmail?.id;
        } else {
          console.log("Email already exists for this date:", sendDate);
          emailId = existing[0].id;
        }
        
        if (!emailId) {
          console.log("No email ID found, skipping content update");
          continue;
        }
        
        // Get the three most recent content items for this topic
        console.log("Fetching recent content for topic:", section.topic);
        const { data: contentItems, error: contentError } = await supabase
          .from('content_items')
          .select('id, title, url, topic, summary, source, published_date, content')
          .eq('topic', section.topic)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (contentError) {
          console.error("Error fetching content:", contentError);
          continue;
        }
          
        if (!contentItems || contentItems.length === 0) {
          console.log("No content items found for topic:", section.topic);
          continue;
        }
        
        console.log(`Found ${contentItems.length} content items for ${section.topic}`);
        
        // Format email content similar to NewsletterPreview.tsx
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #6366f1; padding: 20px; text-align: center; color: white;">
              <h1>Your ${section.topic} Newsletter</h1>
              <p>Curated content just for you</p>
            </div>
            <div style="padding: 20px; background-color: #f0f4f8; margin-top: 20px;">
              <h2 style="color: #333;">${section.topic}</h2>
              ${contentItems.map(item => `
                <div style="margin-top: 20px;">
                  <h3 style="margin-bottom: 5px;">
                    <a href="${item.url}" style="text-decoration: none; color: #1a56db;">
                      ${item.title}
                    </a>
                  </h3>
                  <p style="color: #4a5568; font-size: 14px; margin-top: 5px;">
                    ${item.summary || (item.content && item.content.substring(0, 150) + '...') || 'No summary available'}
                  </p>
                  <p style="font-size: 12px; color: #718096; margin-top: 5px;">
                    Source: ${item.source || 'Unknown'} | ${new Date(item.published_date || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              `).join('')}
            </div>
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #718096;">
              <p>You're receiving this email because you subscribed to our newsletter service.</p>
              <p>To unsubscribe or change your preferences, click <a href="#" style="color: #4a5568;">here</a>.</p>
            </div>
          </div>
        `;
        
        // Create the email_content object with both HTML and structured data
        const emailContent = {
          subject: `Your ${section.topic} Newsletter`,
          items: contentItems,
          introduction: `Here are the latest articles about ${section.topic} for you.`,
          section: section,
          html: htmlContent
        };
        
        // Update the email with content
        console.log(`Updating email ${emailId} with content`);
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({ 
            email_content: emailContent
          })
          .eq('id', emailId);
          
        if (updateError) {
          console.error(`Error updating email ${emailId} with content:`, updateError);
        } else {
          console.log(`Successfully updated email ${emailId} with content`);
        }
      }
    }
    
    // Expose the content items to the global window object for debugging
    if (typeof window !== 'undefined') {
      (window as any).recentContentItems = recentContentItems;
      console.log("Content items stored in window.recentContentItems for debugging");
    }
    
    console.log("processNewsletters completed");
    
  } catch (error) {
    console.error('Error processing newsletters:', error);
    throw error;
  }
}

// Export the recent content items for access from other components
export function getRecentContentItems(): Record<string, any[]> {
  return recentContentItems;
}