import React, { useState } from 'react';
import { Plus, Trash2, Settings, Send } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase/client';

// Research topic validation schema
const researchTopicSchema = z.string().min(3, 'Topic must be at least 3 characters');

// Research form validation schema
const researchFormSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  topics: z.array(researchTopicSchema).min(1, 'At least one topic is required'),
  notes: z.string().optional(),
});

type ResearchFormData = z.infer<typeof researchFormSchema>;

const ResearchTool: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState<ResearchFormData>({
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    topics: [''],
    notes: '',
  });
  
  // State for form errors and submission status
  const [errors, setErrors] = useState<Partial<Record<keyof ResearchFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Handle input changes
  const handleInputChange = (field: keyof ResearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when changed
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  // Handle topic changes
  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...formData.topics];
    newTopics[index] = value;
    setFormData(prev => ({ ...prev, topics: newTopics }));
    
    // Clear topics error when changed
    if (errors.topics) {
      setErrors(prev => ({ ...prev, topics: undefined }));
    }
  };
  
  // Add a new topic
  const addTopic = () => {
    setFormData(prev => ({ ...prev, topics: [...prev.topics, ''] }));
  };
  
  // Remove a topic
  const removeTopic = (index: number) => {
    const newTopics = [...formData.topics];
    newTopics.splice(index, 1);
    setFormData(prev => ({ ...prev, topics: newTopics }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      researchFormSchema.parse(formData);
      
      // Set submitting state
      setIsSubmitting(true);
      
      // Create research job in database
      const {  error } = await supabase
        .from('research_jobs')
        .insert({
          start_time: formData.startTime,
          end_time: formData.endTime,
          topics: formData.topics,
          notes: formData.notes || null,
          status: 'scheduled',
        })
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Set success state
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({
          startTime: getDefaultStartTime(),
          endTime: getDefaultEndTime(),
          topics: [''],
          notes: '',
        });
      }, 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format zod errors
        const formattedErrors: Partial<Record<keyof ResearchFormData, string>> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as keyof ResearchFormData;
          formattedErrors[path] = err.message;
        });
        setErrors(formattedErrors);
      } else {
        // Handle other errors
        console.error('Form submission error:', error);
        setErrors({ topics: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto mt-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl flex items-center justify-center">
          <Settings className="mr-2 h-7 w-7" />
          Automated Research Tool
        </h2>
        <p className="mt-3 text-lg text-gray-500">
          Set a research timer and let our agent work for you while you sleep. Wake up to a detailed research report!
        </p>
      </div>
      
      {submitSuccess ? (
        <div className="bg-green-50 p-6 rounded-lg shadow-lg border-l-4 border-green-500 mb-6">
          <h3 className="text-xl font-medium text-green-800">Research scheduled successfully!</h3>
          <p className="mt-2 text-green-700">
            Your research job has been scheduled and will run during the specified time period.
            You'll receive a notification when the results are ready.
          </p>
        </div>
      ) : null}
      
      <form 
        className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-purple-500"
        onSubmit={handleSubmit}
      >
        {/* Research Time Period */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Time Period <span className="text-xs text-gray-400">(EST)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="datetime-local"
                className={`block w-full border ${errors.startTime ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                placeholder="Start"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                aria-label="Start time" 
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>
            <span className="self-center text-gray-500">to</span>
            <div className="flex-1">
              <input
                type="datetime-local"
                className={`block w-full border ${errors.endTime ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                placeholder="End"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                aria-label="End time" 
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Research Topics */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Topics
          </label>
          <div className="space-y-4">
            {formData.topics.map((topic, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  className={`flex-1 border ${errors.topics ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  placeholder={`Topic ${idx + 1}`}
                  value={topic}
                  onChange={(e) => handleTopicChange(idx, e.target.value)}
                />
                {idx > 0 && (
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeTopic(idx)}
                    aria-label={`Remove topic ${idx + 1}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            {errors.topics && (
              <p className="text-sm text-red-600">{errors.topics}</p>
            )}
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              onClick={addTopic}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </button>
          </div>
        </div>
        
        {/* Notes/Commands */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes / Other Commands
          </label>
          <textarea
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            rows={3}
            placeholder="E.g. prioritize recent studies, summarize findings, etc."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scheduling...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Start Research
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper functions to set default start and end times
function getDefaultStartTime() {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
}

function getDefaultEndTime() {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
}

export default ResearchTool;