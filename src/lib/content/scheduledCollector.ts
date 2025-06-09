import { supabase } from '../supabase/client';
import axios from 'axios';
import { getOpenAI } from '../openai';

// News API key from environment variables
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '4e3de078824d4e228b6f4a50d3007d0a';

// OpenAI for summarization - use the centralized utility
const openai = getOpenAI();

// Topics we want to collect
const TOPICS = ['Technology', 'Politics'];
const ARTICLES_PER_TOPIC = 5;
const REFRESH_INTERVAL_HOURS = 48;

interface ContentItem {
  topic: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  content: string;
  summary?: string;
  is_global_sample: boolean;
  last_fetched: string;
}

/**
 * Check if we need to refresh content based on the last fetch time
 */
export async function shouldRefreshContent(): Promise<boolean> {
  try {
    // Find the most recent content fetch
    const { data, error } = await supabase
      .from('content_items')
      .select('last_fetched')
      .eq('is_global_sample', true)
      .order('last_fetched', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error checking last fetch time:', error);
      return true; // If error, assume we should refresh
    }
    
    if (!data || data.length === 0) {
      return true; // No previous fetch, so we should fetch
    }
    
    const lastFetched = new Date(data[0].last_fetched);
    const now = new Date();
    const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastFetch >= REFRESH_INTERVAL_HOURS;
  } catch (error) {
    console.error('Error in shouldRefreshContent:', error);
    return true; // If error, assume we should refresh
  }
}

/**
 * Fetch articles from News API for a specific topic
 */
async function fetchArticlesFromNewsAPI(topic: string): Promise<ContentItem[]> {
  try {
    console.log(`Fetching ${topic} articles from News API`);
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: topic,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: ARTICLES_PER_TOPIC,
        apiKey: NEWS_API_KEY
      }
    });

    if (response.data.status !== 'ok') {
      console.error(`News API error for ${topic}:`, response.data);
      return [];
    }

    const now = new Date().toISOString();
    
    return response.data.articles.map((article: any) => ({
      topic,
      title: article.title,
      url: article.url,
      source: article.source.name,
      published_date: article.publishedAt,
      content: article.content || article.description || `Article about ${topic}`,
      is_global_sample: true,
      last_fetched: now
    }));
  } catch (error) {
    console.error(`Error fetching ${topic} from News API:`, error);
    return [];
  }
}

/**
 * Generate summary for an article using OpenAI
 */
async function generateSummary(content: string, title: string): Promise<string> {
  try {
    // Trim content if it's too long
    const truncatedContent = content.length > 4000 ? 
      content.substring(0, 4000) + '...' : 
      content;
    
    const prompt = `Please summarize the following article in 2-3 concise sentences, highlighting key points.\n\nTitle: ${title}\nContent: ${truncatedContent}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes news articles concisely." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content?.trim() || 'No summary available';
  } catch (error) {
    console.error('Error generating summary with OpenAI:', error);
    return 'Failed to generate summary.';
  }
}

/**
 * Store content items in the database
 */
async function storeContentItems(items: ContentItem[]): Promise<void> {
  if (items.length === 0) return;

  try {
    for (const item of items) {
      // Generate summary for each item
      item.summary = await generateSummary(item.content, item.title);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Use Supabase to insert items
    const { error } = await supabase
      .from('content_items')
      .upsert(
        items.map(item => ({
          topic: item.topic,
          title: item.title,
          url: item.url,
          source: item.source,
          published_date: item.published_date,
          content: item.content,
          summary: item.summary,
          is_global_sample: true,
          last_fetched: item.last_fetched,
          created_at: new Date().toISOString()
        })),
        { onConflict: 'url' }
      );

    if (error) {
      console.error('Error storing content items:', error);
    } else {
      console.log(`Successfully stored ${items.length} articles`);
    }
  } catch (error) {
    console.error('Error in storeContentItems:', error);
  }
}

/**
 * Main function to collect and store content
 */
export async function collectGlobalContent(forceRefresh = false): Promise<boolean> {
  try {
    // Check if we need to refresh based on last fetch time
    const needsRefresh = forceRefresh || await shouldRefreshContent();
    
    if (!needsRefresh) {
      console.log('Content is still fresh, skipping fetch');
      return false;
    }
    
    console.log('Starting content collection for global sample articles');
    
    let allContentItems: ContentItem[] = [];
    
    // Collect articles for each topic
    for (const topic of TOPICS) {
      const articles = await fetchArticlesFromNewsAPI(topic);
      allContentItems = [...allContentItems, ...articles];
    }
    
    // Store collected articles with summaries
    await storeContentItems(allContentItems);
    
    console.log(`Content collection complete: ${allContentItems.length} articles collected`);
    return true;
  } catch (error) {
    console.error('Error in collectGlobalContent:', error);
    return false;
  }
}
