import http from 'k6/http';
import { sleep, check } from 'k6';

// CONFIG
const BASE_URL = 'https://apiloyalty.hotstonelondon.com/api';

// Multiple users to bypass 25 req/min per user
const USERS = [
  { email: 'kushalniraula41@gmail.com', password: 'Password@1' },
  { email: 'footballover049@gmail.com', password: 'Password@1' },
];

export let options = {
  scenarios: {

    // 🔹 LOAD TEST (normal traffic)
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },

    // 🔹 STRESS TEST (push system)
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 150 },
        { duration: '2m', target: 300 }, // increased
        { duration: '1m', target: 0 },
      ],
      startTime: '6m',
    },

    // 🔹 SPIKE TEST (sudden traffic burst)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 400 }, // harder spike
        { duration: '1m', target: 400 },
        { duration: '10s', target: 0 },
      ],
      startTime: '12m',
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<800'], // relaxed for stress
    http_req_failed: ['rate<0.5'],    // allow failures during stress
  },
};

export default function () {

  // 🔹 Rotate users (important for rate limit)
  const user = USERS[__VU % USERS.length];

  // 🔹 LOGIN
  const loginRes = http.post(
    `${BASE_URL}/auth/staff/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login success': (r) => r.status === 200 || r.status === 201,
  });

  if (!loginSuccess) {
    return; // stop if login fails
  }

  const token = loginRes.json('accessToken');

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-restaurant-id': __ENV.RESTAURANT_ID || '1',
  };

  // 🔹 CUSTOMER OFFERS
  const res1 = http.get(
    `${BASE_URL}/special-offer/special-offer/customer`,
    { headers }
  );

  check(res1, {
    'customer offers success': (r) => r.status === 200,
  });

  // 🔹 ADMIN OFFERS
  const res2 = http.get(
    `${BASE_URL}/special-offer`,
    { headers }
  );

  check(res2, {
    'admin offers success': (r) => r.status === 200,
  });

  // 🔹 CONTROL SPEED (IMPORTANT)
  sleep(3); // keeps per-user requests under limit
}
