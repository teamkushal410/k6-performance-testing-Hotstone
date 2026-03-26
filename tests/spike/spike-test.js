import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '10s', target: 300 }, // spike
    { duration: '1m', target: 300 },
    { duration: '10s', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
