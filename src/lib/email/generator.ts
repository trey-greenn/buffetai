// src/lib/email/generator.ts
import { supabase } from '../supabase/client';
import mjml2html from 'mjml';

interface NewsletterSection {
  id: string;
  topic: string;
  instructions: string;
  frequency: string;
  other: string;
}

interface NewsletterConfig {
  userName: string;
  sections: NewsletterSection[];
}

interface ContentItem {
  id: string;
  topic: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  content: string;
  summary: string;
}

async function getUserNewsletterConfig(userId: string): Promise<NewsletterConfig> {
  // Get user's name
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Error fetching user profile: ${userError.message}`);
  }
  
  // Get newsletter sections
  const { data: sectionData, error: sectionError } = await supabase
    .from('newsletter_sections')
    .select('section_data')
    .eq('user_id', userId)
    .single();
    
  if (sectionError) {
    throw new Error(`Error fetching newsletter sections: ${sectionError.message}`);
  }
  
  return {
    userName: userData.name || 'Subscriber',
    sections: sectionData.section_data || []
  };
}

async function getRelevantContentForSection(section: NewsletterSection): Promise<ContentItem[]> {
  // Use the topic to find relevant content
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('topic', section.topic)
    .order('published_date', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error(`Error fetching content for section ${section.id}:`, error);
    return [];
  }
  
  return data as ContentItem[];
}

function formatSectionContent(section: NewsletterSection, content: ContentItem[]): string {
  // Create MJML section for this newsletter section
  return `
    <mj-section background-color="#f0f4f8" padding="20px">
      <mj-column>
        <mj-text font-size="22px" font-weight="bold" color="#333">${section.topic}</mj-text>
        ${content.map(item => `
          <mj-spacer height="20px" />
          <mj-text font-size="18px" font-weight="bold">
            <a href="${item.url}" style="text-decoration: none; color: #1a56db;">
              ${item.title}
            </a>
          </mj-text>
          <mj-text color="#4a5568" font-size="14px">
            ${item.summary || item.content.substring(0, 150)}...
          </mj-text>
          <mj-text font-size="12px" color="#718096">
            Source: ${item.source} | ${new Date(item.published_date).toLocaleDateString()}
          </mj-text>
        `).join('')}
      </mj-column>
    </mj-section>
  `;
}

function renderEmailTemplate(data: { userName: string; sections: string[] }): string {
  const mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>Your Personalized Newsletter</mj-title>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#ffffff">
        <mj-section background-color="#6366f1" padding="20px">
          <mj-column>
            <mj-text font-size="28px" font-weight="bold" color="#ffffff" align="center">
              Your Personalized Newsletter
            </mj-text>
            <mj-text color="#ffffff" align="center">
              Curated content just for you, ${data.userName}
            </mj-text>
          </mj-column>
        </mj-section>
        
        ${data.sections.join('\n')}
        
        <mj-section padding="20px">
          <mj-column>
            <mj-text align="center" font-size="12px" color="#718096">
              You're receiving this email because you subscribed to our newsletter service.
              <br/>
              To unsubscribe or change your preferences, click <a href="#" style="color: #4a5568;">here</a>.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;
  
  // Convert MJML to HTML
  const { html, errors } = mjml2html(mjmlTemplate);
  
  if (errors && errors.length) {
    console.error('MJML rendering errors:', errors);
  }
  
  return html;
}

export async function generateNewsletterForUser(userId: string): Promise<string> {
  // Get user's newsletter configuration
  const config = await getUserNewsletterConfig(userId);
  
  // For each section, get relevant content
  const sections = await Promise.all(config.sections.map(async (section) => {
    const content = await getRelevantContentForSection(section);
    return formatSectionContent(section, content);
  }));
  
  // Generate complete email HTML
  return renderEmailTemplate({
    userName: config.userName,
    sections: sections
  });
}