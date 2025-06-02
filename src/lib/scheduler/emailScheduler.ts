// src/lib/scheduler/emailScheduler.ts
import { supabase } from '../supabase/client';
import {  addDays, addWeeks, addMonths, format } from 'date-fns';

interface User {
  id: string;
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

async function getUsersWithNewsletterConfigs(): Promise<User[]> {
  // Get all users with newsletter sections
  const { data, error } = await supabase
    .from('newsletter_sections')
    .select('user_id, section_data');
    
  if (error) {
    console.error('Error fetching users with newsletter configs:', error);
    return [];
  }
  
  // Transform data to expected format
  return data.map(item => ({
    id: item.user_id,
    sections: item.section_data || []
  }));
}

function calculateNextSendDate(frequency: Frequency): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return addDays(now, 1);
    case 'weekly':
      return addWeeks(now, 1);
    case 'bi-weekly':
      return addWeeks(now, 2);
    case 'monthly':
      return addMonths(now, 1);
    default:
      return addWeeks(now, 1); // Default to weekly
  }
}

async function scheduleEmail({ userId, scheduledTime, sectionIds }: {
  userId: string;
  scheduledTime: Date;
  sectionIds: string[];
}): Promise<void> {
  // Insert email schedule record
  const { error } = await supabase
    .from('scheduled_emails')
    .insert({
      user_id: userId,
      status: 'pending',
      scheduled_time: scheduledTime.toISOString(),
      section_ids: sectionIds,
      created_at: new Date().toISOString()
    });
    
  if (error) {
    console.error(`Error scheduling email for user ${userId}:`, error);
  } else {
    // console.log(`Scheduled email for user ${userId} at ${format(scheduledTime, 'yyyy-MM-dd HH:mm:ss')}`);
  }
}

export async function scheduleNewslettersForNextPeriod(): Promise<void> {
  // Get all users with newsletter configurations
  const users = await getUsersWithNewsletterConfigs();
  
  // For each user, schedule based on their frequency preferences
  for (const user of users) {
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
    Object.entries(frequencyGroups).forEach(([frequency, groupSections]) => {
      if (groupSections.length > 0) {
        const nextSendDate = calculateNextSendDate(frequency as Frequency);
        
        scheduleEmail({
          userId: user.id,
          scheduledTime: nextSendDate,
          sectionIds: groupSections.map((s: { id: string }) => s.id)
        });
      }
    });
  }
}

// Function to handle specific scheduling for a single user
export async function scheduleNewsletterForUser(userId: string): Promise<void> {
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
  Object.entries(frequencyGroups).forEach(([frequency, groupSections]) => {
    const nextSendDate = calculateNextSendDate(frequency as Frequency);
    
    scheduleEmail({
      userId,
      scheduledTime: nextSendDate,
      sectionIds: groupSections.map((s: { id: string }) => s.id)
    });
  });
}

// Add type guard
function isValidFrequency(frequency: string): frequency is Frequency {
  return ['daily', 'weekly', 'bi-weekly', 'monthly'].includes(frequency);
}