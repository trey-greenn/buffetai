// src/pages/newsletter-preview.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase/client';
import { useAuth } from './lib/supabase/auth-context';
import ContentSelectionPanel from './components/ContentSelectionPanel';
import { processScheduledEmail } from './lib/email/processor';

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

const NewsletterPreview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<ContentItem[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  const handleSelectionComplete = (items: ContentItem[]) => {
    setSelectedItems(items);
    setPreviewMode(true);
    generateEmailPreview(items);
  };

  const generateEmailPreview = async (items: ContentItem[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Group items by topic
      const itemsByTopic: Record<string, ContentItem[]> = {};
      
      items.forEach(item => {
        if (!itemsByTopic[item.topic]) {
          itemsByTopic[item.topic] = [];
        }
        itemsByTopic[item.topic].push(item);
      });
      
      // Create email content in HTML format
      // This is a simplified version - in a real app, you would call an API endpoint
      // that uses your email generator functionality
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366f1; padding: 20px; text-align: center; color: white;">
            <h1>Your Personalized Newsletter</h1>
            <p>Curated content just for you</p>
          </div>
      `;
      
      Object.entries(itemsByTopic).forEach(([topic, topicItems]) => {
        htmlContent += `
          <div style="padding: 20px; background-color: #f0f4f8; margin-top: 20px;">
            <h2 style="color: #333;">${topic}</h2>
            ${topicItems.map(item => `
              <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 5px;">
                  <a href="${item.url}" style="text-decoration: none; color: #1a56db;">
                    ${item.title}
                  </a>
                </h3>
                <p style="color: #4a5568; font-size: 14px; margin-top: 5px;">
                  ${item.summary || item.content.substring(0, 150)}...
                </p>
                <p style="font-size: 12px; color: #718096; margin-top: 5px;">
                  Source: ${item.source} | ${new Date(item.published_date).toLocaleDateString()}
                </p>
              </div>
            `).join('')}
          </div>
        `;
      });
      
      htmlContent += `
        <div style="padding: 20px; text-align: center; font-size: 12px; color: #718096;">
          <p>You're receiving this email because you subscribed to our newsletter service.</p>
          <p>To unsubscribe or change your preferences, click <a href="#" style="color: #4a5568;">here</a>.</p>
        </div>
      </div>
      `;
      
      setEmailPreview(htmlContent);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate email preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userEmail = user?.email;
      
      if (!userEmail) {
        throw new Error('Could not find your email address');
      }
      
      // Make sure we're authenticated
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('You need to be logged in to send newsletters');
      }
      
      // Debug the user IDs
      console.log('Auth user ID:', userData.user.id);
      console.log('Context user ID:', user?.id);
      console.log('User email:', userEmail);
      
      // Verify email preview content
      if (!emailPreview || emailPreview.trim() === '') {
        throw new Error('Newsletter content is empty. Please add content before sending.');
      }
      
      // Check if we're using mock content
      const hasMockContent = selectedItems.some(item => item.id.startsWith('mock-'));
      
      console.log('Preparing to save newsletter to database');
      
      // Insert with better error handling
      const { data, error: insertError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: userData.user.id, // Use the ID from auth.getUser()
          status: 'pending',
          scheduled_time: new Date().toISOString(),
          ...(hasMockContent ? {} : { content_ids: selectedItems.map(item => item.id) }),
          email_content: emailPreview
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error('Insert error details:', insertError);
        if (insertError.code === '42501') {
          throw new Error('Permission denied: You do not have access to create newsletters');
        }
        throw new Error('Failed to schedule your newsletter');
      }
      
      if (!data) {
        throw new Error('No data returned from insert operation');
      }
      
      console.log('Successfully created email record with ID:', data.id);
      
      // Process the email immediately
      console.log('Sending email...');
      try {
        const emailSent = await processScheduledEmail(data.id);
        
        if (!emailSent) {
          throw new Error('Failed to send the email. Please check the console for details.');
        }
        
        setSuccess('Your newsletter has been sent! It will arrive in your inbox shortly.');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (sendErr: any) {
        // Get the detailed error message from the database
        const { data: errorData } = await supabase
          .from('scheduled_emails')
          .select('error_message')
          .eq('id', data.id)
          .single();
          
        const errorMessage = errorData?.error_message || sendErr.message || 'Unknown error';
        throw new Error(`Email sending failed: ${errorMessage}`);
      }
    } catch (err: any) {
      console.error('Error sending newsletter:', err);
      setError(err.message || 'Failed to send newsletter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      setError('Please select a date and time to schedule your newsletter');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get the user data directly from supabase auth
      const { data: userData } = await supabase.auth.getUser();
      
      // Debug the user IDs
      console.log('Auth user ID (scheduler):', userData?.user?.id);
      console.log('Context user ID (scheduler):', user?.id);
      
      // Check if we're using mock content
      const hasMockContent = selectedItems.some(item => item.id.startsWith('mock-'));

      // Insert a new scheduled email with the selected date/time
      const { error: insertError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: userData?.user?.id, // Use the ID from auth.getUser()
          status: 'pending',
          scheduled_time: new Date(scheduledDate).toISOString(),
          // Only include content_ids if not using mock content
          ...(hasMockContent ? {} : { content_ids: selectedItems.map(item => item.id) }),
          email_content: emailPreview // Store the preview HTML for mock content
        });
        
      if (insertError) {
        throw new Error('Failed to schedule your newsletter');
      }
      
      setSuccess('Your newsletter has been scheduled!');
      
      // In a few seconds, redirect back to the dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('Error scheduling newsletter:', err);
      setError(err.message || 'Failed to schedule newsletter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Newsletter Selection
        </h1>
        <p className="mt-3 text-xl text-gray-500">
          Choose content for your next newsletter and schedule delivery.
        </p>
      </div>

      {previewMode ? (
        <div className="space-y-6">
          <button
            onClick={() => setPreviewMode(false)}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Selection
          </button>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Newsletter Preview</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="border rounded-md p-4">
                <iframe
                  srcDoc={emailPreview}
                  title="Email Preview"
                  className="w-full h-[600px]"
                  frameBorder="0"
                ></iframe>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleSendNow}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="mr-2 h-5 w-5" />
                Send Now
              </button>
              
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="mr-2 h-5 w-5" />
                {showScheduler ? 'Hide Scheduler' : 'Schedule For Later'}
              </button>
            </div>
            
            {showScheduler && (
              <div className="mt-6 p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-3">Schedule Delivery</h3>
                <div className="mb-4">
                  <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">
                    Select Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="schedule-date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={loading || !scheduledDate}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ContentSelectionPanel onSelectionComplete={handleSelectionComplete} />
      )}
    </div>
  );
};

export default NewsletterPreview;