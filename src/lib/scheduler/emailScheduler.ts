// src/lib/scheduler/emailScheduler.ts
import { supabase } from '../supabase/client';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { scheduleContentCollection } from '../content/automatedCollector';
import { NYC_TIMEZONE } from '../utils/dateUtils';

interface User {
  id: string;
  email: string;
  timezone?: string;
  sections: Array<{
    id: string;
    topic: string;
    frequency: string;
    instructions: string;
    other: string;
  }>;
}

type Frequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

type Section = {
  id: string;
  frequency: Frequency;
  // ... other section properties
};

interface ScheduleEmailParams {
  userId: string;
  scheduledTime: Date;
  sectionIds: string[];
  timezone?: string;
  retryCount?: number;
  startDate?: Date;
}

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Get all users with newsletter configurations
 */
async function getUsersWithNewsletterConfigs(): Promise<User[]> {
  try {
    // Join newsletter_sections with user table to get email and timezone
    const { data, error } = await supabase
      .from('newsletter_sections')
      .select(`
        user_id, 
        section_data,
        users(email, timezone)
      `);
      
    if (error) {
      console.error('Error fetching users with newsletter configs:', error);
      return [];
    }
    
    // Transform data to expected format
    return data.map(item => ({
      id: item.user_id,
      email: item.users && item.users[0] ? item.users[0].email || '' : '',
      timezone: item.users && item.users[0] ? item.users[0].timezone || 'UTC' : 'UTC',
      sections: item.section_data || []
    }));
  } catch (error) {
    console.error('Error in getUsersWithNewsletterConfigs:', error);
    return [];
  }
}

/**
 * Calculate the next send date based on frequency and timezone
 */
function calculateNextSendDate(frequency: Frequency, startDate?: Date, timezone: string = 'UTC'): Date {
  // Use provided start date or current date
  const baseDate = startDate ? new Date(startDate) : new Date();
  
  // Convert to user's timezone
  const zonedDate = toZonedTime(baseDate, timezone);
  
  let nextDate: Date;
  
  switch (frequency) {
    case 'daily':
      nextDate = addDays(zonedDate, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(zonedDate, 1);
      break;
    case 'bi-weekly':
      nextDate = addWeeks(zonedDate, 2);
      break;
    case 'monthly':
      nextDate = addMonths(zonedDate, 1);
      break;
    default:
      nextDate = addWeeks(zonedDate, 1); // Default to weekly
  }
  
  // Convert back to UTC for storage (manually create UTC date)
  return new Date(nextDate.toISOString());
}

/**
 * Schedule a newsletter email with error handling and retries
 */
async function scheduleEmail({
  userId,
  scheduledTime,
  sectionIds,
  timezone = NYC_TIMEZONE,
  retryCount = 0,
  startDate
}: ScheduleEmailParams): Promise<boolean> {
  try {
    // Calculate next send date
    const currentDate = startDate || new Date();
    const sendDate = currentDate;
    
    // Get frequency from first section
    const { data: sectionsData } = await supabase
      .from('newsletter_sections')
      .select('section_data')
      .eq('user_id', userId)
      .single();
      
    const sections = sectionsData?.section_data || [];
    const sectionMap = sections.reduce((map: Record<string, any>, section: any) => {
      map[section.id] = section;
      return map;
    }, {});
    
    // Use frequency of first section for now
    const firstSectionId = sectionIds[0];
    const frequency = sectionMap[firstSectionId]?.frequency || 'weekly';
    
    // Calculate next date based on frequency
    const nextDate = calculateNextSendDate(frequency, sendDate, timezone);

    // Insert email schedule record
    const { error } = await supabase
      .from('scheduled_emails')
      .insert({
        user_id: userId,
        status: 'pending',
        scheduled_time: scheduledTime.toISOString(),
        send_date: sendDate.toISOString(),
        next_date: nextDate.toISOString(),
        section_ids: sectionIds,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying schedule for user ${userId}, attempt ${retryCount + 1}`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return scheduleEmail({
          userId,
          scheduledTime,
          sectionIds,
          timezone,
          retryCount: retryCount + 1,
          startDate
        });
      }
      
      console.error(`Failed to schedule email for user ${userId} after ${MAX_RETRY_ATTEMPTS} attempts:`, error);
      return false;
    }
    
    // Schedule content collection between now and the next newsletter
    await scheduleContentCollection(
      userId, 
      currentDate, 
      scheduledTime, 
      sectionIds
    );
    
    console.log(`Scheduled email for user ${userId} at ${scheduledTime.toISOString()}`);
    return true;
  } catch (error) {
    console.error(`Error scheduling email for user ${userId}:`, error);
    return false;
  }
}

/**
 * Schedule newsletters for the next period for all users
 */
export async function scheduleNewslettersForNextPeriod(): Promise<void> {
  try {
    // Get all users with newsletter configurations
    const users = await getUsersWithNewsletterConfigs();
    
    if (users.length === 0) {
      console.log('No users with newsletter configurations found');
      return;
    }
    
    console.log(`Scheduling newsletters for ${users.length} users`);
    
    // For each user, schedule based on their frequency preferences
    for (const user of users) {
      // Skip users without email
      if (!user.email) {
        console.warn(`User ${user.id} has no email address, skipping`);
        continue;
      }
      
      // Find the earliest frequency among sections
      const sections = user.sections;
      
      // Group sections by frequency for consolidated emails
      const frequencyGroups: Record<Frequency, Section[]> = {
        'daily': [],
        'weekly': [],
        'bi-weekly': [],
        'monthly': []
      };
      
      sections.forEach((section: { id: string; frequency: string }) => {
        if (isValidFrequency(section.frequency)) {
          frequencyGroups[section.frequency].push(section as unknown as Section);
        }
      });
      
      // Schedule emails for each frequency group
      for (const [frequency, groupSections] of Object.entries(frequencyGroups)) {
        if (groupSections.length > 0) {
          const nextSendDate = calculateNextSendDate(
            frequency as Frequency, 
            undefined, 
            user.timezone
          );
          
          const scheduled = await scheduleEmail({
            userId: user.id,
            scheduledTime: nextSendDate,
            sectionIds: groupSections.map(s => s.id),
            timezone: user.timezone
          });
          
          if (scheduled) {
            console.log(`Successfully scheduled ${frequency} newsletter for user ${user.id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in scheduleNewslettersForNextPeriod:', error);
  }
}

/**
 * Schedule a newsletter with a specific start date (for manual scheduling)
 */
export async function scheduleNewsletterWithDate(
  userId: string,
  startDate: Date,
  frequency: Frequency,
  sectionIds: string[],
  timezone: string = 'UTC'
): Promise<boolean> {
  try {
    // Calculate the next send date based on the start date
    const nextSendDate = calculateNextSendDate(frequency, startDate, timezone);
    
    // Schedule the email
    return await scheduleEmail({
      userId,
      scheduledTime: nextSendDate,
      sectionIds,
      timezone,
      startDate
    });
  } catch (error) {
    console.error(`Error scheduling newsletter with date for user ${userId}:`, error);
    return false;
  }
}

/**
 * Schedule newsletters for a specific user
 */
export async function scheduleNewsletterForUser(userId: string): Promise<void> {
  try {
    // Get user data with timezone
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, timezone')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error(`Error fetching user data for ${userId}:`, userError);
      return;
    }
    
    // Get newsletter sections
    const { data, error } = await supabase
      .from('newsletter_sections')
      .select('section_data')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
      console.error(`Error fetching newsletter config for user ${userId}:`, error);
      return;
    }
    
    const sections = data.section_data || [];
    
    // Group sections by frequency
    const frequencyGroups: Record<string, typeof sections> = {};
    
    sections.forEach((section: { id: string; frequency: string }) => {
      if (!frequencyGroups[section.frequency]) {
        frequencyGroups[section.frequency] = [];
      }
      frequencyGroups[section.frequency].push(section);
    });
    
    // Schedule emails for each frequency group
    for (const [frequency, groupSections] of Object.entries(frequencyGroups)) {
      const nextSendDate = calculateNextSendDate(
        frequency as Frequency, 
        undefined, 
        userData.timezone || 'UTC'
      );
      
      await scheduleEmail({
        userId,
        scheduledTime: nextSendDate,
        sectionIds: groupSections.map((s: { id: string }) => s.id),
        timezone: userData.timezone
      });
    }
  } catch (error) {
    console.error(`Error in scheduleNewsletterForUser for user ${userId}:`, error);
  }
}

/**
 * Add type guard for frequency validation
 */
function isValidFrequency(frequency: string): frequency is Frequency {
  return ['daily', 'weekly', 'bi-weekly', 'monthly'].includes(frequency);
}