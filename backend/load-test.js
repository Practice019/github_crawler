const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 50;

async function loadTest() {
  console.log(`Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENT_REQUESTS} concurrent`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  const responseTimes = [];

  const makeRequest = async () => {
    const reqStart = Date.now();
    try {
      await axios.get(`${BASE_URL}/api/github/trending`, { timeout: 10000 });
      successCount++;
      responseTimes.push(Date.now() - reqStart);
    } catch (error) {
      failCount++;
    }
  };

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = Array(Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i))
      .fill(null)
      .map(() => makeRequest());
    await Promise.all(batch);
  }

  const totalTime = Date.now() - startTime;
  const avgTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);

  console.log('\n=== Load Test Results ===');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Avg Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minTime}ms`);
  console.log(`Max Response Time: ${maxTime}ms`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
}

loadTest().catch(console.error);
