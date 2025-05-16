// src/lib/content/collector.ts
import axios from 'axios';
import Parser from 'rss-parser';
import { load } from 'cheerio';
import { supabase } from '../supabase/client.ts';

interface ContentItem {
  id?: string;
  topic: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  content: string;
  summary?: string;
}

const rssParser = new Parser();
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';

// Map of topics to relevant RSS feeds
const topicToRssMap: Record<string, string[]> = {
  'Technology': [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml'
  ],
  'Business': [
    'https://www.forbes.com/business/feed/',
    'https://feeds.bloomberg.com/markets/news.rss'
  ],
  'Health': [
    'https://rss.medicalnewstoday.com/featurednews.xml',
    'https://www.health.harvard.edu/blog/feed'
  ],
  // Add more mappings for other topics
};

async function fetchFromNewsApi(topic: string): Promise<ContentItem[]> {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: topic,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 10,
        apiKey: NEWS_API_KEY
      }
    });

    if (response.data.status !== 'ok') {
      console.error('News API error:', response.data);
      return [];
    }

    return response.data.articles.map((article: any) => ({
      topic,
      title: article.title,
      url: article.url,
      source: article.source.name,
      published_date: article.publishedAt,
      content: article.content || article.description,
    }));
  } catch (error) {
    console.error('Error fetching from News API:', error);
    return [];
  }
}

async function fetchFromRelevantRssFeeds(topic: string): Promise<ContentItem[]> {
  const feeds = topicToRssMap[topic] || [];
  const items: ContentItem[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      
      const feedItems = feed.items.slice(0, 5).map(item => ({
        topic,
        title: item.title || 'Untitled',
        url: item.link || '',
        source: feed.title || 'RSS Feed',
        published_date: item.pubDate || new Date().toISOString(),
        content: item.content || item.contentSnippet || '',
      }));
      
      items.push(...feedItems);
    } catch (error) {
      console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    }
  }

  return items;
}

async function scrapeRelevantContent(topic: string): Promise<ContentItem[]> {
  // Define websites to scrape based on topic
  const sitesToScrape = getSitesToScrape(topic);
  const items: ContentItem[] = [];

  for (const site of sitesToScrape) {
    try {
      const response = await axios.get(site.url);
      const $ = load(response.data);
      
      // Use site-specific selectors
      $(site.articleSelector).slice(0, 3).each((_, element) => {
        const title = $(element).find(site.titleSelector).text().trim();
        const url = new URL(
          $(element).find(site.linkSelector).attr('href') || '',
          site.url
        ).toString();
        
        const content = $(element).find(site.contentSelector).text().trim();
        
        if (title && url) {
          items.push({
            topic,
            title,
            url,
            source: site.name,
            published_date: new Date().toISOString(),
            content,
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping ${site.url}:`, error);
    }
  }

  return items;
}

function getSitesToScrape(topic: string) {
  // Return site-specific scraping configurations
  const siteConfigs = {
    'Technology': [
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        articleSelector: '.athing',
        titleSelector: '.title a',
        linkSelector: '.title a',
        contentSelector: '.storylink'
      }
    ],
    'Business': [
      {
        name: 'CNBC',
        url: 'https://www.cnbc.com/business/',
        articleSelector: '.Card-standardBlade',
        titleSelector: '.Card-title',
        linkSelector: 'a',
        contentSelector: '.Card-description'
      }
    ],
    // Add more configurations for other topics
  };
  
  return siteConfigs[topic as keyof typeof siteConfigs] || [];
}

async function storeContentItems(items: ContentItem[]): Promise<void> {
  if (items.length === 0) return;

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
        created_at: new Date().toISOString()
      })),
      { onConflict: 'url' }
    );

  if (error) {
    console.error('Error storing content items:', error);
  }
}

export async function collectContentForTopic(topic: string): Promise<string[]> {
  const contentItems: ContentItem[] = [];
  
  // 1. Check NewsAPI
  const newsApiItems = await fetchFromNewsApi(topic);
  contentItems.push(...newsApiItems);
  
  // 2. Check RSS feeds
  const rssItems = await fetchFromRelevantRssFeeds(topic);
  contentItems.push(...rssItems);
  
  // 3. Web scraping for specialized content
  if (contentItems.length < 5) {
    const scrapedItems = await scrapeRelevantContent(topic);
    contentItems.push(...scrapedItems);
  }
  
  // Store in database
  await storeContentItems(contentItems);
  
  // Get IDs of stored items
  const { data, error } = await supabase
    .from('content_items')
    .select('id')
    .in('url', contentItems.map(item => item.url));
    
  if (error) {
    console.error('Error retrieving content IDs:', error);
    return [];
  }
  
  return (data || []).map(item => item.id);
}