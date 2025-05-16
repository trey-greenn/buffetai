import { collectContentForTopic } from '../../../lib/content/collector.ts';
import { processBatchContentItems } from '../../../lib/content/processor.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCollector() {
  const topic = process.argv[2] || 'Technology';
  
  try {
    console.log(`Collecting content for topic: ${topic}...`);
    
    // Step 1: Collect content
    const contentIds = await collectContentForTopic(topic);
    console.log(`Collected ${contentIds.length} items for topic: ${topic}`);
    
    // Step 2: Process content (generate summaries with OpenAI)
    if (contentIds.length > 0) {
      console.log('Processing content to generate summaries...');
      await processBatchContentItems(contentIds);
      console.log('Content processing complete!');
    }
    
    console.log('Content collection and processing complete!');
  } catch (error) {
    console.error('Error testing content collection:', error);
  }
}

testCollector();