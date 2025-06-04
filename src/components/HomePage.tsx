import { Link } from 'react-router-dom';
import { useAuth } from '../lib/supabase/auth-context';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>AI-Powered Tools | Newsletter Builder, Research Tool & Infographic Generator</title>
        <meta name="description" content="Create custom newsletters with our AI agent for personal newsletters. Automate research with our AI research tool. Generate beautiful infographics with our AI infographic generator." />
        <meta name="keywords" content="AI AGENT FOR PERSONAL NEWSLETTER, CUSTOMIZE PERSONAL NEWSLETTER, AI AGENT FOR RESEARCH, AUTOMATED RESEARCH AI AGENT, AI INFOGRAPHIC GENERATOR" />
      </Helmet>
      
      <div className="bg-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                AI-Powered Content Creation Suite
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl">
                Streamline your content workflow with our powerful AI tools for newsletters, research, and visual content.
              </p>
              <div className="mt-10">
                {user ? (
                  <Link 
                    to="/dashboard" 
                    className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-100"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-100"
                  >
                    Get Started Free
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Builder Section */}
        <div className="py-16 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div className="mb-12 lg:mb-0">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  AI Agent for Personal Newsletters
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  Create custom newsletters tailored to your audience with our AI-powered content generator. Schedule automated delivery and track engagement all in one place.
                </p>
                <div className="mt-8">
                  <ul className="space-y-3">
                    {['Personalized content recommendations', 'AI-generated summaries', 'Automated scheduling', 'Beautiful templates'].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link 
                    to="/newsletter" 
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Try Newsletter Builder
                  </Link>
                </div>
              </div>
              <div className="lg:ml-8 flex justify-center">
                <img 
                  src="/info.jpg" 
                  alt="Newsletter Builder interface" 
                  className="rounded-lg shadow-xl w-full max-w-md" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Research Tool Section */}
        <div className="py-16 bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div className="lg:order-2 mb-12 lg:mb-0">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  AI Agent for Research
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  Automate your research process with our intelligent AI agent. Gather data, analyze information, and generate insights in a fraction of the time.
                </p>
                <div className="mt-8">
                  <ul className="space-y-3">
                    {['Multi-source data collection', 'Automated analysis', 'Citation management', 'Research summaries'].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link 
                    to="/research" 
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Try Research Tool
                  </Link>
                </div>
              </div>
              <div className="lg:order-1 lg:mr-8 flex justify-center">
                <img 
                  src="/info.jpg" 
                  alt="Research Tool interface" 
                  className="rounded-lg shadow-xl w-full max-w-md" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Infographic Generator Section */}
        <div className="py-16 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div className="mb-12 lg:mb-0">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  AI Infographic Generator
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  Transform complex data into beautiful visual stories with our AI-powered infographic generator. Create engaging visual content for learning and presentations.
                </p>
                <div className="mt-8">
                  <ul className="space-y-3">
                    {['Custom design templates', 'Data visualization', 'One-click generation', 'Export in multiple formats'].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link 
                    to="/infographic" 
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Try Infographic Generator
                  </Link>
                </div>
              </div>
              <div className="lg:ml-8 flex justify-center">
                <img 
                  src="/info.jpg" 
                  alt="Infographic Generator interface" 
                  className="rounded-lg shadow-xl w-full max-w-md" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-700">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-indigo-200">Try our tools for free today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              {user ? (
                <div className="inline-flex rounded-md shadow">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="inline-flex rounded-md shadow">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                  >
                    Sign up for free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}