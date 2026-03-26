import http from 'k6/http';
import { sleep, check } from 'k6';

// CONFIG: change base URL
const BASE_URL = 'https://apiloyalty.hotstonelondon.com/api';

export let options = {
  scenarios: {
    
    // 🔹 LOAD TEST
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },

    // 🔹 STRESS TEST
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      startTime: '6m',
    },

    // 🔹 SPIKE TEST
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 300 },
        { duration: '1m', target: 300 },
        { duration: '10s', target: 0 },
      ],
      startTime: '12m',
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function () {
  const res = http.get(`${BASE_URL}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
