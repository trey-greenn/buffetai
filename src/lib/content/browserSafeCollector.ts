import { supabase } from '../supabase/client';

// This file provides browser-safe versions of collector functions

/**
 * Browser-safe function to schedule content collection
 */
export async function scheduleContentCollectionSafe(
  userId: string,
  startDate: Date,
  nextDeliveryDate: Date,
  sectionIds: string[]
): Promise<void> {
  try {
    // Call an API endpoint instead of using Node.js specific code
    const response = await fetch('/api/schedule-collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        startDate: startDate.toISOString(),
        nextDeliveryDate: nextDeliveryDate.toISOString(),
        sectionIds
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule content collection');
    }
  } catch (error) {
    console.error('Error scheduling content collection:', error);
  }
}

/**
 * Browser-safe function to populate email content
 */
export async function populateEmailContentSafe(): Promise<void> {
  try {
    // Call an API endpoint instead of using Node.js specific code
    const response = await fetch('/api/populate-content', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to populate email content');
    }
  } catch (error) {
    console.error('Error populating email content:', error);
  }
}
