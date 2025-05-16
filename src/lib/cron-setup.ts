// src/lib/cron-setup.ts
import cron from 'node-cron';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.CRON_INTERNAL_API_KEY || '';

// Schedule daily content collection for all topics
export function setupContentCollectionCron() {
  const topics = [
    'Technology', 'Business', 'Health', 'Science', 
    'Politics', 'Entertainment', 'Sports', 
    'Education', 'Environment', 'Finance'
  ];
  
  // Run at 2 AM every day
  cron.schedule('0 2 * * *', async () => {
    console.log('Running content collection cron job');
    
    for (const topic of topics) {
      try {
        await axios.post(`${API_BASE_URL}/content/collect`, 
          { topic }, 
          { headers: { 'x-api-key': API_KEY } }
        );
        console.log(`Collected content for topic: ${topic}`);
      } catch (error) {
        console.error(`Error collecting content for topic ${topic}:`, error);
      }
    }
  });
}

// Schedule newsletter email sending
export function setupEmailSendingCron() {
  // Check every 10 minutes for emails to send
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running email sending cron job');
    
    try {
      await axios.post(`${API_BASE_URL}/emails/process-queue`,
        {}, 
        { headers: { 'x-api-key': API_KEY } }
      );
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  });
}

// Schedule daily creation of newsletter schedules
export function setupNewsletterSchedulingCron() {
  // Run at 1 AM every day
  cron.schedule('0 1 * * *', async () => {
    console.log('Running newsletter scheduling cron job');
    
    try {
      await axios.post(`${API_BASE_URL}/scheduler/run`,
        {}, 
        { headers: { 'x-api-key': API_KEY } }
      );
    } catch (error) {
      console.error('Error scheduling newsletters:', error);
    }
  });
}

// Initialize all cron jobs
export function initializeCronJobs() {
  setupContentCollectionCron();
  setupEmailSendingCron();
  setupNewsletterSchedulingCron();
  
  console.log('All cron jobs initialized');
}