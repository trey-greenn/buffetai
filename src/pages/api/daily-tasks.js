// /api/daily-tasks.js
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import axios from 'axios';
import OpenAI from 'openai';

// Initialize services
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.VITE_RESEND_API_KEY);
const openai = new OpenAI(process.env.VITE_OPENAI_API_KEY);
const newsApiKey = process.env.VITE_NEWS_API_KEY;

export default async function handler(req, res) {
  // Verify this is a Vercel cron job
  if (req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('Starting daily tasks: content collection and email updates');
    
    // 1. Log execution in our monitoring table
    await supabase
      .from('cron_heartbeat')
      .insert([{ timestamp: new Date().toISOString() }]);
    
    // 2. Process emails that need to be sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all emails due today
    const { data: emailsToSend, error: emailError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .gte('send_date', today.toISOString())
      .lt('send_date', tomorrow.toISOString());
    
    if (emailError) throw emailError;
    
    console.log(`Found ${emailsToSend?.length || 0} emails to process for today`);
    
    // Process each email
    const emailResults = [];
    for (const email of emailsToSend || []) {
      try {
        // Send the email
        const emailContent = email.email_content || email.content;
        
        if (!emailContent || !email.recipient_email) {
          console.log(`Skipping email ${email.id} - missing content or recipient`);
          continue;
        }
        
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: 'Newsletter <info@williamtreygreen.com>',
          to: email.recipient_email,
          subject: email.subject || 'Your Daily Newsletter',
          html: emailContent
        });
        
        if (sendError) {
          console.error(`Error sending email ${email.id}:`, sendError);
          continue;
        }
        
        // Update status to sent
        await supabase
          .from('scheduled_emails')
          .update({ status: 'sent' })
          .eq('id', email.id);
        
        // Generate content for the next newsletter
        const newsContent = await fetchNewsContent();
        const newsletterHtml = await generateNewsletterContent(newsContent);
        
        // Schedule next email for tomorrow
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1); // tomorrow
        
        await supabase
          .from('scheduled_emails')
          .insert({
            user_id: email.user_id,
            recipient_email: email.recipient_email,
            subject: `Your Daily Newsletter - ${nextDate.toLocaleDateString()}`,
            email_content: newsletterHtml,
            status: 'pending',
            send_date: nextDate.toISOString(),
            frequency: 'daily',
            created_at: new Date().toISOString()
          });
        
        emailResults.push({ id: email.id, success: true });
      } catch (emailErr) {
        console.error(`Error processing email ${email.id}:`, emailErr);
        emailResults.push({ id: email.id, success: false, error: emailErr.message });
      }
    }
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      emails_processed: emailResults.length
    });
  } catch (error) {
    console.error('Daily tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Function to fetch news content from News API
async function fetchNewsContent() {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        apiKey: newsApiKey
      }
    });
    
    return response.data.articles.slice(0, 5); // Get top 5 articles
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Function to generate newsletter content using OpenAI
async function generateNewsletterContent(newsArticles) {
  if (!newsArticles || newsArticles.length === 0) {
    return '<p>No news content available for today.</p>';
  }
  
  try {
    // Format the news articles for the prompt
    const articlesText = newsArticles.map((article, index) => 
      `${index + 1}. ${article.title}\nSource: ${article.source.name}\nSummary: ${article.description || 'No description available'}`
    ).join('\n\n');
    
    // Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a newsletter writer. Create a concise, engaging HTML newsletter based on the provided news articles. Include a brief introduction, summaries of each article with your insights, and a conclusion. Format with proper HTML tags."
        },
        {
          role: "user",
          content: `Generate a daily newsletter based on these top news stories:\n\n${articlesText}`
        }
      ]
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating newsletter with OpenAI:', error);
    // Fallback content if OpenAI fails
    return `
      <h2>Today's Top News</h2>
      ${newsArticles.map(article => `
        <div>
          <h3>${article.title}</h3>
          <p><strong>Source:</strong> ${article.source.name}</p>
          <p>${article.description || 'No description available'}</p>
          ${article.url ? `<p><a href="${article.url}" target="_blank">Read more</a></p>` : ''}
        </div>
      `).join('<hr>')}
    `;
  }
}