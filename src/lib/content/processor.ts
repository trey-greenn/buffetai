// src/lib/content/processor.ts
import { supabase } from '../supabase/client.ts';
import { getOpenAI } from '../../lib/openai';

interface ContentItem {
  id: string;
  topic: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  content: string;
  summary?: string;
}

const openai = getOpenAI();

async function fetchContentItem(contentId: string): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', contentId)
    .single();
    
  if (error || !data) {
    throw new Error(`Error fetching content item: ${error?.message || 'Not found'}`);
  }
  
  return data as ContentItem;
}

async function generateSummaryWithOpenAI(content: string): Promise<string> {
  try {
    // Trim content if it's too long
    const truncatedContent = content.length > 4000 ? 
      content.substring(0, 4000) + '...' : 
      content;
    
    const prompt = `Please summarize the following content in 2-3 concise sentences, highlighting key points:\n\n${truncatedContent}`;
    
    const response = await openai.completions.create({
      model: "gpt-3.5-turbo", // or use gpt-3.5-turbo with chat endpoint
      prompt,
      max_tokens: 150,
      temperature: 0.3,
    });
    
    return response.choices[0]?.text?.trim() || 'No summary available';
  } catch (error) {
    console.error('Error generating summary with OpenAI:', error);
    return 'Failed to generate summary.';
  }
}

async function updateContentWithSummary(contentId: string, summary: string): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .update({ summary })
    .eq('id', contentId);
    
  if (error) {
    throw new Error(`Error updating content summary: ${error.message}`);
  }
}

export async function processContentItem(contentId: string): Promise<void> {
  // Fetch content from database
  const contentItem = await fetchContentItem(contentId);
  
  // Skip if already has a summary
  if (contentItem.summary) {
    console.log(`Content item ${contentId} already has a summary`);
    return;
  }
  
  // Generate summary using OpenAI
  const summary = await generateSummaryWithOpenAI(contentItem.content);
  
  // Update content item with summary
  await updateContentWithSummary(contentId, summary);
}

// Process multiple content items in batch
export async function processBatchContentItems(contentIds: string[]): Promise<void> {
  for (const contentId of contentIds) {
    try {
      await processContentItem(contentId);
    } catch (error) {
      console.error(`Error processing content item ${contentId}:`, error);
    }
  }
}