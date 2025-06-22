// // src/lib/cron-setup.ts
// import cron from 'node-cron';
// import axios from 'axios';
// import { processContentCollections } from './content/automatedCollector';
// import { supabase } from './supabase/client';
// import { processNewsletterSections, processPendingEmails } from './scheduler/emailProcessor';
// import { populatePendingEmailContent } from './content/populateEmailContent';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
// const API_KEY = process.env.CRON_INTERNAL_API_KEY || '';



// // Schedule daily content collection for all topics
// export function setupContentCollectionCron() {
//   const topics = [
//     'Technology', 'Business', 'Health', 'Science', 
//     'Politics', 'Entertainment', 'Sports', 
//     'Education', 'Environment', 'Finance'
//   ];
  
//   // Run at 2 AM every day
//   cron.schedule('0 2 * * *', async () => {
//     console.log('Running content collection cron job');
    
//     for (const topic of topics) {
//       try {
//         await axios.post(`${API_BASE_URL}/content/collect`, 
//           { topic }, 
//           { headers: { 'x-api-key': API_KEY } }
//         );
//         console.log(`Collected content for topic: ${topic}`);
//       } catch (error) {
//         console.error(`Error collecting content for topic ${topic}:`, error);
//       }
//     }
//   });
// }

// // Setup automated content collection for user newsletters
// export function setupAutomatedContentCollectionCron() {
//   // Run every hour to check for scheduled content collections
//   cron.schedule('0 * * * *', async () => {
//     console.log('Running automated content collection cron job');
    
//     try {
//       await processContentCollections();
//     } catch (error) {
//       console.error('Error processing content collections:', error);
//     }
//   });
// }

// // Schedule newsletter email sending
// export function setupEmailSendingCron() {
//   // Check every 10 minutes for emails to send
//   cron.schedule('*/10 * * * *', async () => {
//     console.log('Running email sending cron job');
    
//     try {
//       // Find emails whose send_date has passed but are still pending
//       const now = new Date();
      
//       const { data: emailsToSend, error } = await supabase
//         .from('scheduled_emails')
//         .select('*')
//         .eq('status', 'pending')
//         .lte('send_date', now.toISOString());
      
//       if (error) {
//         console.error('Error fetching emails to send:', error);
//         return;
//       }
      
//       console.log(`Found ${emailsToSend.length} emails to send`);
      
//       // Process each email
//       for (const email of emailsToSend) {
//         try {
//           await axios.post(`${API_BASE_URL}/emails/send`,
//             { emailId: email.id }, 
//             { headers: { 'x-api-key': API_KEY } }
//           );
//         } catch (sendError) {
//           console.error(`Error sending email ${email.id}:`, sendError);
//         }
//       }
//     } catch (error) {
//       console.error('Error processing email queue:', error);
//     }
//   });
// }

// // Schedule daily creation of newsletter schedules
// export function setupNewsletterSchedulingCron() {
//   // Run at 1 AM every day
//   cron.schedule('0 1 * * *', async () => {
//     console.log('Running newsletter scheduling cron job');
    
//     try {
//       await axios.post(`${API_BASE_URL}/scheduler/run`,
//         {}, 
//         { headers: { 'x-api-key': API_KEY } }
//       );
//     } catch (error) {
//       console.error('Error scheduling newsletters:', error);
//     }
//   });
// }

// // Setup newsletter section processing
// export function setupNewsletterSectionsCron() {
//   // Run at midnight every day
//   cron.schedule('0 0 * * *', async () => {
//     console.log('Running newsletter sections processing cron job');
    
//     try {
//       await processNewsletterSections();
//     } catch (error) {
//       console.error('Error processing newsletter sections:', error);
//     }
//   });
// }

// // Setup pending email processing
// export function setupPendingEmailsCron() {
//   // Check every hour
//   cron.schedule('0 * * * *', async () => {
//     console.log('Running pending emails processing cron job');
    
//     try {
//       await processPendingEmails();
//     } catch (error) {
//       console.error('Error processing pending emails:', error);
//     }
//   });
// }

// // Setup content population cron
// export function setupContentPopulationCron() {
//   // Run every 6 hours
//   cron.schedule('0 */6 * * *', async () => {
//     console.log('Running content population job');
    
//     try {
//       await populatePendingEmailContent();
//     } catch (error) {
//       console.error('Error populating email content:', error);
//     }
//   });
// }

// // Initialize all cron jobs
// export function initializeCronJobs() {
//   setupContentCollectionCron();
//   setupAutomatedContentCollectionCron();
//   setupEmailSendingCron();
//   setupNewsletterSchedulingCron();
//   setupNewsletterSectionsCron();
//   setupPendingEmailsCron();
//   setupContentPopulationCron();
  
//   console.log('All cron jobs initialized');
// }

// //curl -X POST http://localhost:3000/api/emails/send -H "Content-Type: application/json" -H "x-api-key:1234567890" -d '{"emailId": "f3a9c4e2-1851-4855-bcf2-95d3ad0d668d"}'

// // curl -X POST http://localhost:3001/test/schedule-email -H "Content-Type: application/json" -d '{"recipient_email":"w.treygreer@gmail.com","subject":"Test Email"}'