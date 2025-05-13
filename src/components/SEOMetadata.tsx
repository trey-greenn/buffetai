import React from 'react';
import { Helmet } from 'react-helmet';

type SEOMetadataProps = {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  author?: string;
  twitterCard?: 'summary' | 'summary_large_image';
};

/**
 * SEOMetadata component for managing page-specific metadata
 * 
 * This component can be included on any page to provide custom SEO metadata
 * When you expand to multiple pages, import this component at the top level of each page
 */
export const SEOMetadata: React.FC<SEOMetadataProps> = ({
  title,
  description,
  keywords = 'ai infographic, data visualization, timeline generator, chart maker, comparison infographic',
  ogImage = 'https://yourdomain.com/og-image.jpg',
  twitterImage = 'https://yourdomain.com/twitter-image.jpg',
  canonicalUrl = 'https://buffetai-seven.vercel.app/',
  type = 'website',
  author = 'BuffetAI',
  twitterCard = 'summary_large_image',
}) => {
  // Use title directly without appending anything else
  const fullTitle = title;
  
  return (
    <Helmet>
      {/* Primary SEO Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={twitterImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

/**
 * Predefined metadata configurations for different page types
 */
export const SEOConfigs = {
  home: {
    title: 'BuffetAI',
    description: 'Generate professional infographics instantly with our AI-powered tool.',
    keywords: 'ai infographic, data visualization, ai image generator',
    canonicalUrl: 'https://buffetai-seven.vercel.app/',
  },
  timeline: {
    title: 'Timeline Infographic Generator',
    description: 'Create beautiful timeline infographics with our AI-powered tool. Perfect for visualizing history, project timelines, and sequential events.',
    keywords: 'timeline generator, timeline infographic, history timeline, project timeline, chronological visualization',
    canonicalUrl: 'https://yourdomain.com/timeline/',
  },
  comparison: {
    title: 'Comparison Infographic Generator',
    description: 'Generate side-by-side comparison infographics instantly. Perfect for product comparisons, pros and cons, or before and after visualizations.',
    keywords: 'comparison chart, side by side infographic, product comparison, pros cons visualization',
    canonicalUrl: 'https://yourdomain.com/comparison/',
  },
  chart: {
    title: 'Chart & Graph Infographic Generator',
    description: 'Create professional data charts and graphs with our AI tool. Visualize statistics, trends, and numerical data with beautiful infographics.',
    keywords: 'chart maker, graph generator, data visualization, statistics infographic, bar chart creator',
    canonicalUrl: 'https://yourdomain.com/chart/',
  },
  flowchart: {
    title: 'Flowchart Infographic Generator',
    description: 'Design professional flowchart infographics with our AI tool. Visualize processes, decisions, and workflows with stunning diagrams.',
    keywords: 'flowchart maker, process visualization, workflow diagram, decision tree, step by step graphic',
    canonicalUrl: 'https://yourdomain.com/flowchart/',
  },
};

export default SEOMetadata; 