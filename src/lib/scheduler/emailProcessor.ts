// Create this new file for processing emails from newsletter sections
import { supabase } from '../supabase/client';
import { scheduleContentCollection } from '../content/automatedCollector';

/**
 * Process newsletter sections and create scheduled emails
 * This should be run by a daily cron job
 */
export async function processNewsletterSections(): Promise<void> {
  try {
    console.log('Processing newsletter sections to create scheduled emails');
    
    // Get all newsletter sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('user_id, section_data, created_at, updated_at');
      
    if (sectionsError) {
      console.error('Error fetching newsletter sections:', sectionsError);
      return;
    }
    
    const now = new Date();
    
    // Process each user's sections
    for (const userSection of sectionsData || []) {
      const userId = userSection.user_id;
      const sections = userSection.section_data || [];
      
      // Skip if no sections
      if (sections.length === 0) continue;
      
      // For each section where send date is in the future
      for (const section of sections) {
        const sendDate = new Date(section.startDate); // startDate is the Send Date
        const nextDate = new Date(section.sendDate);  // sendDate is the Next Date
        
        // Skip if send date is in the past
        if (sendDate <= now) continue;
        
        // Check if we already have a pending email for this section and send date
        const { data: existingEmails, error: existingError } = await supabase
          .from('scheduled_emails')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .eq('send_date', sendDate.toISOString())
          .in('section_ids', [section.id]);
          
        if (existingError) {
          console.error(`Error checking existing emails for user ${userId}:`, existingError);
          continue;
        }
        
        // If no pending email exists, create one
        if (!existingEmails || existingEmails.length === 0) {
          // Create a new scheduled email
          const { error: insertError } = await supabase
            .from('scheduled_emails')
            .insert({
              user_id: userId,
              status: 'pending',
              scheduled_time: sendDate.toISOString(), // For compatibility with existing code
              send_date: sendDate.toISOString(),
              next_date: nextDate.toISOString(),
              section_ids: [section.id],
              created_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`Error creating scheduled email for user ${userId}:`, insertError);
            continue;
          }
          
          console.log(`Created scheduled email for user ${userId}, section ${section.id}`);
          
          // Schedule content collection
          await scheduleContentCollection(
            userId,
            now,
            sendDate,
            [section.id]
          );
        }
      }
    }
    
    console.log('Finished processing newsletter sections');
  } catch (error) {
    console.error('Error in processNewsletterSections:', error);
  }
}

/**
 * Process scheduled emails that need to be sent
 * This should be run by a cron job every hour or so
 */
export async function processPendingEmails(): Promise<void> {
  try {
    const now = new Date();
    
    // Find emails that need to be sent (send_date has passed)
    const { data: emailsToSend, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('send_date', now.toISOString());
      
    if (error) {
      console.error('Error fetching emails to send:', error);
      return;
    }
    
    console.log(`Found ${emailsToSend?.length || 0} emails to send`);
    
    // Process each email
    for (const email of emailsToSend || []) {
      try {
        // Call the email sending endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/emails/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CRON_INTERNAL_API_KEY || ''
          },
          body: JSON.stringify({ emailId: email.id })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send email');
        }
        
        console.log(`Sent email ${email.id}`);
        
        // Schedule the next email based on frequency
        await scheduleNextEmail(email);
      } catch (err) {
        console.error(`Error processing email ${email.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in processPendingEmails:', error);
  }
}

/**
 * Schedule the next email based on the frequency of the sections
 */
export async function scheduleNextEmail(email: any): Promise<void> {
  try {
    const userId = email.user_id;
    let sectionIds = email.section_ids || [];
    let sectionData = email.section_data;
    
    // If both section_ids and section_data are missing, fetch them from the database
    if (!sectionIds.length && !sectionData) {
      console.log(`Fetching missing section data for email ${email.id}`);
      
      // Try to fetch complete email data
      const { data: completeEmail, error: emailError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('id', email.id)
        .single();
        
      if (emailError) {
        console.error(`Error fetching complete email data: ${emailError.message}`);
        return;
      }
      
      if (completeEmail) {
        sectionIds = completeEmail.section_ids || [];
        sectionData = completeEmail.section_data;
      }
      
      // If still no section data, we can't proceed
      if (!sectionIds.length && !sectionData) {
        console.error('Email has no section IDs or section data after fetch:', email.id);
        return;
      }
    }
    
    // Get section details
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('section_data')
      .eq('user_id', userId)
      .single();
      
    if (sectionsError) {
      console.error(`Error fetching sections for user ${userId}:`, sectionsError);
      return;
    }
    
    const sections = sectionsData?.section_data || [];
    
    // Find the section that was used in this email
    const section = sections.find((s: any) => 
      sectionIds.includes(s.id) || (sectionData && sectionData.id === s.id)
    );
    
    if (!section) {
      console.error(`Section not found for email ${email.id}`);
      return;
    }
    
    // Get the next send date from the current email
    const nextSendDate = new Date(email.next_date);
    
    // Calculate the next-next date based on frequency
    let nextNextDate = new Date(nextSendDate);
    
    switch (section.frequency) {
      case 'daily':
        nextNextDate.setDate(nextNextDate.getDate() + 1);
        break;
      case 'weekly':
        nextNextDate.setDate(nextNextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextNextDate.setDate(nextNextDate.getDate() + 14);
        break;
      case 'monthly':
        nextNextDate.setMonth(nextNextDate.getMonth() + 1);
        break;
      default:
        nextNextDate.setDate(nextNextDate.getDate() + 7); // Default to weekly
    }
    
    // STEP 1: Create a new scheduled email for the next period
    const { data: newEmail, error: insertError } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: userId,
        status: 'pending',
        scheduled_time: nextSendDate.toISOString(),
        send_date: nextSendDate.toISOString(),
        next_date: nextNextDate.toISOString(),
        section_ids: sectionIds || [],
        section_data: sectionData || null,
        created_at: new Date().toISOString()
      })
      .select('id');
      
    console.log('Insert result:', newEmail, insertError);
    
    if (insertError) {
      console.error(`Error scheduling next email for user ${userId}:`, insertError);
      return;
    }
    
    console.log(`Scheduled next email ${newEmail?.[0]?.id} for user ${userId} at ${nextSendDate.toISOString()}`);
    
    // STEP 2: Update the newsletter section with the new dates
    const updatedSections = sections.map((s: any) => {
      if ((sectionIds && sectionIds.includes(s.id)) || (sectionData && sectionData.id === s.id)) {
        // Update this section's dates
        return {
          ...s,
          startDate: nextSendDate.toISOString().slice(0, 16), // Update Send Date to Next Date
          sendDate: nextNextDate.toISOString().slice(0, 16)   // Update Next Date to the following date
        };
      }
      return s;
    });
    
    // Save the updated section data
    const { error: updateError } = await supabase
      .from('newsletter_sections')
      .update({
        section_data: updatedSections,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (updateError) {
      console.error(`Error updating section dates for user ${userId}:`, updateError);
    } else {
      console.log(`Updated section dates for user ${userId}`);
    }
    
    // STEP 3: Schedule content collection for the next period
    await scheduleContentCollection(
      userId,
      new Date(), // current date
      nextSendDate,
      sectionIds || [sectionData?.id].filter(Boolean)
    );
  } catch (error) {
    console.error('Error in scheduleNextEmail:', error);
    console.error('Email data:', JSON.stringify(email));
  }
}

// Add this function to manually trigger processing without waiting for cron
export async function manuallyProcessSections(): Promise<void> {
  try {
    await processNewsletterSections();
    return Promise.resolve();
  } catch (error) {
    console.error("Error manually processing sections:", error);
    return Promise.reject(error);
  }
}