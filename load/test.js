import http from 'k6/http';
import { sleep } from 'k6';

const scenario = __ENV.SCENARIO || 'mixed';

export const options = {
  setupTimeout: '10m',
  scenarios:
    scenario === 'mixed'
      ? {
          mixed: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE) || 1,
            timeUnit: '1s',
            duration: '30s',
            preAllocatedVUs: 50,
            maxVUs: 300,
            exec: 'mixedFlow',
          },
        }
      : scenario === 'heavy'
      ? {
          heavy: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE) || 1,
            timeUnit: '1s',
            duration: '30s',
            preAllocatedVUs: 50,
            maxVUs: 300,
            exec: 'heavyFlow',
          },
        }
      : {
          getOnly: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE) || 1,
            timeUnit: '1s',
            duration: '30s',
            preAllocatedVUs: 50,
            maxVUs: 300,
            exec: 'getOnlyFlow',
          },
        },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'taisia_demidova_client';
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export function setup() {
  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      title: 'Load Test Order',
      specification: 'Spec',
      role: ['BACKEND'],
      stack: ['Nest.js'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 1000,
    }),
    { headers: HEADERS, timeout: '120s' },
  );

  const orderId = orderRes.json('id');

  http.post(`${BASE_URL}/orders/${orderId}/simulate-responses`, null, {
    headers: HEADERS,
    timeout: '120s',
  });

  return { orderId };
}

export function mixedFlow(data) {
  const rand = Math.random() * 100;

  if (rand < 90) {
    http.get(`${BASE_URL}/orders/${data.orderId}/responses`, {
      headers: HEADERS,
      timeout: '120s',
    });
  } else {
    http.post(
      `${BASE_URL}/orders`,
      JSON.stringify({
        title: 'New Order',
        specification: 'Spec',
        role: ['BACKEND'],
        stack: ['Nest.js'],
        gradeRequired: 'MIDDLE',
        totalPriceRub: 1000,
      }),
      { headers: HEADERS, timeout: '120s' },
    );
  }

  sleep(1);
}

export function heavyFlow() {
  http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      title: 'Heavy Load Order',
      specification: 'Spec',
      role: ['BACKEND'],
      stack: ['Nest.js'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 1000,
    }),
    { headers: HEADERS, timeout: '120s' },
  );

  sleep(1);
}

export function getOnlyFlow(data) {
  http.get(`${BASE_URL}/orders/${data.orderId}/responses`, {
    headers: HEADERS,
    timeout: '120s',
  });

  sleep(1);
}