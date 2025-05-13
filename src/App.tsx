import NewsletterSection from './components/NewsletterSection';
import ResearchTool from './components/ResearchTool';
import InfographicGenerator from './components/InfographicGenerator';
import SEOMetadata, { SEOConfigs } from './components/SEOMetadata';
import SiteHeader from './components/SiteHeader';


function App() {
  return (
    <>
      <SEOMetadata {...SEOConfigs.home} />
      <SiteHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 mt-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-xl bg-white p-1 mb-12 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-gradient-to-r from-blue-200 via-white to-purple-200">
          <NewsletterSection />
        </div>
        
        <div className="max-w-5xl mx-auto rounded-xl bg-white p-1 mb-12 shadow-[0_0_15px_rgba(124,58,237,0.5)] bg-gradient-to-r from-purple-200 via-white to-indigo-200">
          <ResearchTool />
        </div>
        
        <div className="max-w-5xl mx-auto rounded-xl bg-white p-1 mb-12 shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-gradient-to-r from-green-200 via-white to-teal-200">
          <InfographicGenerator />
        </div>
      </div>
    </>
  );
}

export default App;