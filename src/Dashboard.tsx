// src/Dashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Settings, Clock, ChevronRight, BarChart2 } from 'lucide-react';
import { useAuth } from './lib/supabase/auth-context';
import EmailStatus from './components/EmailStatus';
import NewsletterProgress from './components/NewsletterProgress';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Please log in to view your dashboard</p>
        <Link 
          to="/login" 
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Dashboard</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <User className="h-10 w-10 text-indigo-600 p-2 bg-indigo-100 rounded-full" />
              <div className="ml-3">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-500">Member</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'overview' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'history' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Clock className="mr-3 h-5 w-5" />
              Email History
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'progress' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart2 className="mr-3 h-5 w-5" />
              Newsletter Progress
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'settings' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              User Settings
            </button>
            <Link 
              to="/newsletter-section" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Settings className="mr-3 h-5 w-5" />
              Newsletter Settings
            </Link>
            <Link 
              to="/newsletter-preview" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Mail className="mr-3 h-5 w-5" />
              Create Newsletter
            </Link>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  to="/newsletter-section" 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700"
                >
                  <div>
                    <h3 className="font-medium">Newsletter Settings</h3>
                    <p className="text-sm opacity-80">Configure your topics and preferences</p>
                  </div>
                  <Settings className="h-8 w-8" />
                </Link>
                
                <Link 
                  to="/newsletter-preview" 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700"
                >
                  <div>
                    <h3 className="font-medium">Create Newsletter</h3>
                    <p className="text-sm opacity-80">Select content for your next edition</p>
                  </div>
                  <Mail className="h-8 w-8" />
                </Link>
                
                <button
                  onClick={() => setActiveTab('progress')}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700"
                >
                  <div>
                    <h3 className="font-medium">Newsletter Progress</h3>
                    <p className="text-sm opacity-80">View scheduled newsletter status</p>
                  </div>
                  <BarChart2 className="h-8 w-8" />
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700"
                >
                  <div>
                    <h3 className="font-medium">User Settings</h3>
                    <p className="text-sm opacity-80">Manage your profile and preferences</p>
                  </div>
                  <Settings className="h-8 w-8" />
                </button>
              </div>
              
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Recent Newsletters</h3>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-indigo-600 text-sm font-medium flex items-center"
                  >
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <EmailStatus limit={3} />
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Newsletter History</h2>
              <EmailStatus />
            </div>
          )}
          
          {activeTab === 'progress' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <NewsletterProgress />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">User Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Profile Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Notification Preferences</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                        Receive email notifications about new content
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="weeklyDigest"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="weeklyDigest" className="ml-2 block text-sm text-gray-700">
                        Subscribe to weekly digest
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;