import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Save, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/supabase/auth-context';
import { Link } from 'react-router-dom';

interface NewsletterSectionData {
  id: string;
  topic: string;
  instructions: string;
  frequency: string;
  other: string;
}

const NewsletterSection: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<NewsletterSectionData[]>([
    {
      id: '1',
      topic: '',
      instructions: '',
      frequency: 'weekly',
      other: '',
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch user's saved sections on component mount
  useEffect(() => {
    if (user) {
      fetchSavedSections();
    }
  }, [user]);

  const fetchSavedSections = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_sections')
        .select('section_data')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching sections:', error);
        return;
      }

      if (data && data.section_data) {
        setSections(data.section_data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const predefinedTopics = [
    'Technology',
    'Business',
    'Health',
    'Science',
    'Politics',
    'Entertainment',
    'Sports',
    'Education',
    'Environment',
    'Finance',
  ];

  const frequencyOptions = [
    'daily',
    'weekly',
    'bi-weekly',
    'monthly',
  ];

  const addNewSection = () => {
    setSections([
      ...sections,
      {
        id: Date.now().toString(),
        topic: '',
        instructions: '',
        frequency: 'weekly',
        other: '',
      },
    ]);
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== id));
    }
  };

  const updateSection = (id: string, field: keyof NewsletterSectionData, value: string) => {
    setSections(
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const saveSections = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSaveMessage('Please sign in to save your newsletter settings');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Check if record exists
      const { data: existingData } = await supabase
        .from('newsletter_sections')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('newsletter_sections')
          .update({
            section_data: sections,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('newsletter_sections')
          .insert({
            user_id: user.id,
            section_data: sections,
            updated_at: new Date().toISOString()
          });
      }
      
      if (result.error) throw result.error;
      
      setSaveMessage('Newsletter settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSaveMessage(`Error saving newsletter settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Create Your Personal Newsletter
        </h1>
        <p className="mt-3 text-xl text-gray-500">
          Customize your newsletter sections below and get content delivered on your schedule.
        </p>
      </div>

      <form onSubmit={saveSections}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Settings className="mr-2 h-6 w-6" />
            Newsletter Sections
          </h2>
          <button
            type="button"
            onClick={addNewSection}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </button>
        </div>

        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-indigo-500 transition-all hover:shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Section {index + 1}</h3>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label={`Remove section ${index + 1}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor={`topic-${section.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id={`topic-${section.id}`}
                    value={section.topic}
                    onChange={(e) => updateSection(section.id, 'topic', e.target.value)}
                    list={`topics-${section.id}`}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    placeholder="Search or enter a topic..." />
                  <datalist id={`topics-${section.id}`}>
                    {predefinedTopics.map((topic) => (
                      <option key={topic} value={topic} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label htmlFor={`instructions-${section.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  id={`instructions-${section.id}`}
                  value={section.instructions}
                  onChange={(e) => updateSection(section.id, 'instructions', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="How would you like this section written or formatted?" />
              </div>

              <div>
                <label htmlFor={`frequency-${section.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  id={`frequency-${section.id}`}
                  value={section.frequency}
                  onChange={(e) => updateSection(section.id, 'frequency', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`other-${section.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Other Guidelines
                </label>
                <textarea
                  id={`other-${section.id}`}
                  value={section.other}
                  onChange={(e) => updateSection(section.id, 'other', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Any additional preferences or guidelines..." />
              </div>
            </div>
          </div>
        ))}

        {saveMessage && (
          <div className={`mt-4 p-2 text-center text-sm rounded ${
            saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="mt-4">
          <a 
            href="/newsletter-preview" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Select Content
          </a>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">What's Next?</h3>
          <p className="text-gray-600 mb-4">
            Now that you've set up your newsletter preferences, you can start creating personalized newsletters.
          </p>
          <Link 
            to="/newsletter-preview" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
          >
            <Mail className="mr-2 h-5 w-5" />
            Create Your Newsletter
          </Link>
        </div>
      </form>
    </div>
  );
};

export default NewsletterSection; 