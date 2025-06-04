import { processNewsletterSections } from '../../lib/scheduler/emailProcessor';

export async function POST() {
  try {
    await processNewsletterSections();
    return new Response('Newsletters processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing newsletters:', error);
    return new Response('Error processing newsletters', { status: 500 });
  }
}