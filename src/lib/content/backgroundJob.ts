import { collectGlobalContent } from './scheduledCollector';

// This function would be called by a cron job or scheduled function
export async function runContentRefreshJob() {
  console.log('Starting scheduled content refresh job');
  
  try {
    const refreshed = await collectGlobalContent();
    
    if (refreshed) {
      console.log('Content successfully refreshed');
    } else {
      console.log('Content refresh not needed or unsuccessful');
    }
    
    return { success: true, refreshed };
  } catch (error) {
    console.error('Error in content refresh job:', error);
    return { success: false, error };
  }
}

// For testing purposes, we can also add a manual trigger
export async function manuallyTriggerContentRefresh() {
  console.log('Manually triggering content refresh');
  return await collectGlobalContent(true);
}
