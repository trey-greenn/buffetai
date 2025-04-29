import React from 'react';
import NewsletterSection from './components/NewsletterSection';
import ResearchTool from './components/ResearchTool';
import InfographicGenerator from './components/InfographicGenerator';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <NewsletterSection />
      <ResearchTool />
      <InfographicGenerator />
    </div>
  );
}

export default App;