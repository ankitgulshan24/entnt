// Utility to check if API is ready and retry failed requests
let isApiReady = false;
const maxRetries = 5;
const retryDelay = 1000; // 1 second

export const setApiReady = (ready) => {
  isApiReady = ready;
  console.log('API ready status:', ready);
};

export const isApiReadyCheck = () => isApiReady;

// Retry function for API calls
export const retryApiCall = async (apiCall, maxAttempts = maxRetries) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${maxAttempts}`);
      const result = await apiCall();
      
      // If we get a successful result, mark API as ready
      if (result && (Array.isArray(result) || (result.data && Array.isArray(result.data)))) {
        setApiReady(true);
        return result;
      }
      
      // If result is empty but no error, wait and retry
      if (attempt < maxAttempts) {
        console.log(`Empty result, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.log(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxAttempts) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('All API retry attempts failed');
        throw error;
      }
    }
  }
  
  throw new Error('Max retry attempts reached');
};

// Wait for API to be ready
export const waitForApiReady = async (timeout = 10000) => {
  const startTime = Date.now();
  
  console.log('Waiting for API to be ready...');
  
  while (!isApiReady && (Date.now() - startTime) < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!isApiReady) {
    console.warn('API ready timeout reached, proceeding anyway');
    // Force API to be ready if timeout reached
    setApiReady(true);
  } else {
    console.log('API is ready!');
  }
  
  return true; // Always return true to proceed
};
