import { supabase } from '../supabase/client';
import { collectContentForTopic } from './collector';
import { addHours, differenceInHours } from 'date-fns';


interface NewsletterSection {
  id: string;
  topic: string;
  frequency: string;
  instructions: string;
  other: string;
}

/**
 * Schedule content collection between newsletter delivery dates
 * This ensures fresh content is available for each newsletter
 */
export async function scheduleContentCollection(
  userId: string,
  startDate: Date,
  nextDeliveryDate: Date,
  sectionIds: string[]
): Promise<void> {
  try {
    // Get section data to determine topics
    const { data: sectionData, error: sectionError } = await supabase
      .from('newsletter_sections')
      .select('section_data')
      .eq('user_id', userId)
      .single();
    
    if (sectionError || !sectionData) {
      console.error(`Error fetching sections for user ${userId}:`, sectionError);
      return;
    }
    
    const allSections: NewsletterSection[] = sectionData.section_data || [];
    
    // Filter for only the sections in our scheduled newsletter
    const relevantSections = allSections.filter(section => 
      sectionIds.includes(section.id)
    );
    
    if (relevantSections.length === 0) {
      console.error(`No relevant sections found for user ${userId}`);
      return;
    }
    
    // Calculate time between newsletters in hours
    const hoursBetween = differenceInHours(nextDeliveryDate, startDate);
    
    // We want at least one collection before the next newsletter
    // For shorter periods (less than 24 hours), collect at least once
    const collectionPoints = Math.max(1, Math.floor(hoursBetween / 24));
    
    // Calculate interval between collections (should be around 24 hours)
    const intervalHours = hoursBetween / collectionPoints;
    
    // Schedule collections at regular intervals
    for (let i = 1; i <= collectionPoints; i++) {
      const collectionTime = addHours(startDate, intervalHours * i);
      
      // Only schedule if collection time is before the next delivery
      if (collectionTime < nextDeliveryDate) {
        await scheduleTopicCollection(
          userId,
          collectionTime,
          relevantSections.map(section => section.topic),
          nextDeliveryDate.toISOString()
        );
      }
    }
    
    console.log(`Scheduled ${collectionPoints} content collection points for user ${userId}`);
  } catch (error) {
    console.error('Error scheduling content collection:', error);
  }
}

/**
 * Schedule a single content collection point for specific topics
 */
async function scheduleTopicCollection(
  userId: string,
  collectionTime: Date,
  topics: string[],
  nextDeliveryDate: string
): Promise<void> {
  try {
    // Insert record into content_collection_schedule table
    const { error } = await supabase
      .from('content_collection_schedule')
      .insert({
        user_id: userId,
        scheduled_time: collectionTime.toISOString(),
        topics: topics,
        status: 'pending',
        max_articles_per_topic: 5,
        next_delivery_date: nextDeliveryDate,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error scheduling content collection:', error);
    }
  } catch (error) {
    console.error('Error in scheduleTopicCollection:', error);
  }
}

/**
 * Process pending content collections
 * This should be called by a cron job every hour or so
 */
export async function processContentCollections(): Promise<void> {
  try {
    // Get current time
    const now = new Date();
    
    // Find scheduled collections that are due
    const { data: pendingCollections, error } = await supabase
      .from('content_collection_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching pending content collections:', error);
      return;
    }
    
    if (!pendingCollections || pendingCollections.length === 0) {
      return; // No pending collections
    }
    
    console.log(`Processing ${pendingCollections.length} content collections`);
    
    // Process each collection
    for (const collection of pendingCollections) {
      try {
        // For each topic, collect content
        for (const topic of collection.topics) {
          // Collect and store content for topic
          const contentIds = await collectContentForTopic(topic);
          console.log(`Collected ${contentIds.length} items for topic: ${topic}`);
          
          // Update user-specific content table to link these items to the user
          if (contentIds.length > 0) {
            await linkContentToUser(collection.user_id, contentIds, collection.next_delivery_date);
          }
        }
        
        // Mark collection as completed
        await supabase
          .from('content_collection_schedule')
          .update({
            status: 'completed',
            processed_at: now.toISOString()
          })
          .eq('id', collection.id);
        
      } catch (topicError) {
        console.error(`Error processing collection ${collection.id}:`, topicError);
        
        // Mark as failed
        await supabase
          .from('content_collection_schedule')
          .update({
            status: 'failed',
            error_message: String(topicError)
          })
          .eq('id', collection.id);
      }
    }
  } catch (error) {
    console.error('Error in processContentCollections:', error);
  }
}

/**
 * Link collected content to a specific user for their next newsletter
 */
async function linkContentToUser(
  userId: string,
  contentIds: string[],
  nextDeliveryDate: string
): Promise<void> {
  try {
    // Insert records linking user to content items
    const linkItems = contentIds.map(contentId => ({
      user_id: userId,
      content_id: contentId,
      status: 'available',
      delivery_date: nextDeliveryDate,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('user_content_items')
      .insert(linkItems);
    
    if (error) {
      console.error('Error linking content to user:', error);
    }
  } catch (error) {
    console.error('Error in linkContentToUser:', error);
  }
}
