import React from 'react';
import { Plus, Trash2, Settings, Send } from 'lucide-react';

const ResearchTool: React.FC = () => {
  return (
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
                    aria-label={`Remove topic ${idx + 1}`}
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
    </div>
  );
};

export default ResearchTool; 