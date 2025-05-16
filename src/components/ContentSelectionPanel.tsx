// src/components/ContentSelectionPanel.tsx
import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/supabase/auth-context';

interface ContentItem {
  id: string;
  topic: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  content: string;
  summary?: string;
  selected?: boolean;
}

interface ContentSelectionPanelProps {
  onSelectionComplete?: (selectedItems: ContentItem[]) => void;
}

const ContentSelectionPanel: React.FC<ContentSelectionPanelProps> = ({ 
  onSelectionComplete 
}) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<string[]>([]);
  const [contentByTopic, setContentByTopic] = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's newsletter topics
  useEffect(() => {
    if (user) {
      fetchUserTopics();
    }
  }, [user]);

  // Fetch content for topics when topics change
  useEffect(() => {
    if (topics.length > 0) {
      fetchContentForTopics();
    }
  }, [topics]);

  const fetchUserTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_sections')
        .select('section_data')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching sections:', error);
        setError('Failed to load your newsletter topics. Please try again.');
        setLoading(false);
        return;
      }

      if (data && data.section_data) {
        // Extract unique topics from section_data
        const topicsList = (data.section_data as any[]).map((section) => section.topic as string);
        setTopics([...new Set(topicsList)].filter(Boolean));
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error('Error in fetchUserTopics:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const fetchContentForTopics = async () => {
    setLoading(true);
    setError(null);
    const contentMap: Record<string, ContentItem[]> = {};

    try {
      for (const topic of topics) {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('topic', topic)
          .order('published_date', { ascending: false })
          .limit(10);

        if (error) {
          console.error(`Error fetching content for ${topic}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          contentMap[topic] = data.map(item => ({ ...item, selected: false }));
        }
      }

      setContentByTopic(contentMap);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (topic: string, itemId: string) => {
    setContentByTopic(prev => {
      const updatedContent = { ...prev };
      
      // Find and toggle the selected item
      updatedContent[topic] = updatedContent[topic].map(item => 
        item.id === itemId ? { ...item, selected: !item.selected } : item
      );
      
      // Update selected items list
      const allItems = Object.values(updatedContent).flat();
      setSelectedItems(allItems.filter(item => item.selected));
      
      return updatedContent;
    });
  };

  const handleRefresh = () => {
    fetchContentForTopics();
  };

  const handleSubmit = () => {
    if (onSelectionComplete) {
      onSelectionComplete(selectedItems);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="text-center p-6 bg-yellow-50 rounded-lg">
        <p className="text-yellow-600 mb-4">You haven't set up any newsletter topics yet.</p>
        <a 
          href="/newsletter-section" 
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors inline-block"
        >
          Set Up Newsletter Topics
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Content Selection</h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Content
        </button>
      </div>

      {Object.keys(contentByTopic).length === 0 ? (
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <p className="text-blue-600 mb-4">No content found for your topics. Try refreshing or adding more topics.</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Content
          </button>
        </div>
      ) : (
        <>
          {Object.entries(contentByTopic).map(([topic, items]) => (
            <div key={topic} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">{topic}</h3>
              
              <div className="space-y-4">
                {items.map(item => (
                  <div 
                    key={item.id}
                    className={`p-4 border rounded-md transition-colors ${
                      item.selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <button
                        onClick={() => toggleItemSelection(topic, item.id)}
                        className={`p-1 rounded-full ${
                          item.selected 
                            ? 'text-green-500 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {item.selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2">
                      {item.summary ? item.summary : item.content.substring(0, 150)}...
                    </p>
                    
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <span>Source: {item.source}</span>
                      <span>{new Date(item.published_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white p-4 border-t shadow-md">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div>
                <span className="font-medium">{selectedItems.length} items selected</span>
              </div>
              <div className="space-x-4">
                <button
                  onClick={handleSubmit}
                  disabled={selectedItems.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Preview
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentSelectionPanel;