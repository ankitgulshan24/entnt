import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker
export const worker = setupWorker(...handlers);

// Initialize MSW
export const initializeMSW = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log('Starting MSW initialization...');
      
      // Check if MSW is already running
      if (worker.listenerCount('request') > 0) {
        console.log('MSW already running');
        return;
      }

      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        waitUntilReady: true,
      });
      
      // Wait longer to ensure MSW is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('MSW initialized successfully');
      
      // Test MSW by making a test request
      try {
        const testResponse = await fetch('/api/jobs?page=1&pageSize=1');
        const testData = await testResponse.json();
        console.log('MSW test successful:', testData);
      } catch (testError) {
        console.error('MSW test failed:', testError);
      }
      
    } catch (error) {
      console.error('Failed to start MSW:', error);
      // Don't throw error, just log it
      console.log('Continuing without MSW...');
    }
  } else {
    console.log('MSW not started - not in development mode');
  }
};
