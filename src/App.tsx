import React, { useState } from 'react';
import { Plus, Trash2, Settings, Send } from 'lucide-react';

interface NewsletterSection {
  id: string;
  topic: string;
  instructions: string;
  frequency: string;
  other: string;
}

function App() {
  const [sections, setSections] = useState<NewsletterSection[]>([
    {
      id: '1',
      topic: '',
      instructions: '',
      frequency: 'weekly',
      other: '',
    },
  ]);

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

  const updateSection = (id: string, field: keyof NewsletterSection, value: string) => {
    setSections(
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter configuration:', sections);
    // Here you would typically send this data to your backend
    alert('Newsletter created successfully!');
  };

  return (
    <><div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Create Your Personal Newsletter
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Customize your newsletter sections below and get content delivered on your schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="mr-2 h-5 w-5" />
              Create Newsletter
            </button>
          </div>
        </form>
      </div>
    </div>
      <div className="max-w-4xl mx-auto mt-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl flex items-center justify-center">
            <Settings className="mr-2 h-7 w-7" />
            Automated Research Tool (Prototype)
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Set a research timer and let our agent work for you while you sleep. Wake up to a detailed research report!
          </p>
        </div>
        <form className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-purple-500">
          {/* Research Time Period */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Time Period <span className="text-xs text-gray-400">(EST)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="datetime-local"
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Start"
                  disabled
                  value="2024-04-28T19:00"
                  aria-label="Start time" />
              </div>
              <span className="self-center text-gray-500">to</span>
              <div className="flex-1">
                <input
                  type="datetime-local"
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="End"
                  disabled
                  value="2024-04-29T05:00"
                  aria-label="End time" />
              </div>
            </div>
          </div>
          {/* Research Topics */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Topics
            </label>
            <div className="space-y-4">
              {[1, 2].map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={`Topic ${idx + 1}`}
                    disabled />
                  {idx > 0 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      disabled
                      tabIndex={-1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled
                tabIndex={-1}
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
              disabled />
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled
              tabIndex={-1}
            >
              <Send className="mr-2 h-5 w-5" />
              Start Research (Prototype)
            </button>
          </div>
        </form>
      </div></>

  );
}

export default App;