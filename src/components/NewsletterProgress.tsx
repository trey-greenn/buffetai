import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/supabase/auth-context';
import { Calendar, Clock, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { formatToEasternTime } from '../lib/utils/dateUtils';

interface ContentItem {
  id: string;
  title: string;
  topic: string;
}



interface ScheduledEmail {
  id: string;
  user_id: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_time: string;
  send_date: string;
  next_date: string;
  section_ids: string[];
  title?: string;
  content_summary?: string[];
  email_content?: { items: ContentItem[] };
  section_data?: { topic: string };
}

const NewsletterProgress: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmails, setCurrentEmails] = useState<ScheduledEmail[]>([]);
  const [pastEmails, setPastEmails] = useState<ScheduledEmail[]>([]);
  const [articles, setArticles] = useState<Record<string, ContentItem[]>>({});
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all scheduled emails including email_content
      const { data: scheduledEmails, error: emailsError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', user?.id)
        .order('send_date', { ascending: true });
        
      if (emailsError) throw emailsError;
      
      // Split emails into current and past
      const current: ScheduledEmail[] = [];
      const past: ScheduledEmail[] = [];
      
      // Process and prepare content map
      const contentMap: Record<string, ContentItem[]> = {};
      
      (scheduledEmails || []).forEach(email => {
        if (email.status === 'sent') {
          past.push(email);
        } else {
          current.push(email);
          
          // If email has content, extract it directly
          if (email.email_content && email.email_content.items) {
            console.log("Found email_content for email:", email.id);
            contentMap[email.id] = email.email_content.items;
          }
        }
      });
      
      setCurrentEmails(current);
      setPastEmails(past);
      
      // For emails without content, try fetching from content_items
      for (const email of current) {
        if (contentMap[email.id]) continue; // Skip if already has content
        
        const topic = email.section_data?.topic;
        if (!topic) continue;
        
        console.log("Fetching content for topic:", topic);
        const { data: contentItems } = await supabase
          .from('content_items')
          .select('id, title, topic')
          .eq('topic', topic)
          .order('created_at', { ascending: false })
          .limit(3);
        
        contentMap[email.id] = contentItems || [];
      }
      
      console.log("Final content map:", contentMap);
      setArticles(contentMap);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="h-10 w-10 animate-spin mx-auto text-indigo-600" />
        <p className="mt-2 text-gray-500">Loading newsletter data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Newsletter Progress</h2>
        <button 
          onClick={fetchData}
          className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
      
      {/* Current Newsletter Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
          Current Newsletters
        </h3>
        
        {currentEmails.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No newsletters currently in progress.</p>
            <p className="mt-2 text-sm text-gray-400">
              Configure your newsletter settings to start a new newsletter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentEmails.map((email, index) => (
              <div 
                key={email.id} 
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500"
              >
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Newsletter #{index + 1}
                    </h3>
                    <div className="mt-2 flex flex-col sm:flex-row sm:space-x-4">
                      <div className="flex items-center text-sm text-gray-500 mt-1 sm:mt-0">
                        <Calendar className="h-4 w-4 mr-1 text-indigo-500" />
                        <span className="mr-1 font-medium">Send Date:</span> 
                        {formatToEasternTime(email.send_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1 sm:mt-0">
                        <Clock className="h-4 w-4 mr-1 text-indigo-500" />
                        <span className="mr-1 font-medium">Next Date:</span> 
                        {formatToEasternTime(email.next_date)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Pending
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Content Collection</h4>
                  {articles[email.id] && articles[email.id].length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {articles[email.id].slice(0, 5).map((article) => (
                        <li key={article.id} className="py-2 pl-3 border-l-2 border-indigo-200">
                          <span className="block text-sm font-medium text-gray-900">{article.title}</span>
                          <span className="block text-xs text-gray-500">{article.topic}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No content collected yet for this newsletter.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Past Newsletters Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
          Past Newsletters
        </h3>
        
        {pastEmails.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No newsletters have been sent yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastEmails.map((email) => (
              <div 
                key={email.id} 
                className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500"
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{email.title || `Newsletter #${email.id.slice(0, 8)}`}</h4>
                    <p className="text-sm text-gray-500">
                      Sent on {formatToEasternTime(email.send_date)}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Sent
                    </span>
                  </div>
                </div>
                
                {email.content_summary && email.content_summary.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Articles:</p>
                    <ul className="mt-1 space-y-1">
                      {email.content_summary.slice(0, 3).map((title, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <ArrowRight className="h-3 w-3 text-gray-400 mr-1 mt-1 flex-shrink-0" />
                          {title}
                        </li>
                      ))}
                      {email.content_summary.length > 3 && (
                        <li className="text-sm text-gray-500 italic">
                          +{email.content_summary.length - 3} more articles
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterProgress;
