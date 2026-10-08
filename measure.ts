import 'dotenv/config';

const PREFIX = 'taisia_demidova';
const AUTH_HEADER = 'Bearer taisia_demidova_client';
const REPEATS = 1;
const WARMUPS = 0;

const ROUTES = [
  {
    name: 'POST /orders',
    url: 'http://localhost:3000/orders',
    method: 'POST',
    body: JSON.stringify({
      title: 'Test',
      specification: 'Specs',
      role: ['BACKEND'],
      stack: ['Nest.js', 'TypeScript', 'PostgreSQL'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 100,
    }),
  },
  {
    name: 'POST /simulate-responses',
    url: 'http://localhost:3000/orders/test-order-id-123/simulate-responses',
    method: 'POST',
    body: null,
  },
  {
    name: 'GET /responses (Сводка с JOIN)',
    url: 'http://localhost:3000/orders/test-order-id-123/responses',
    method: 'GET',
    body: null,
  },
];

function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function runRouteTest(route: (typeof ROUTES)[0]) {
  // Прогрев
  for (let i = 0; i < WARMUPS; i++) {
    await fetch(route.url, {
      method: route.method,
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: route.body,
    }).then((r) => r.json().catch(() => ({})));
  }


  const timings: number[] = [];
  for (let i = 0; i < REPEATS; i++) {
    const start = performance.now();
    const res = await fetch(route.url, {
      method: route.method,
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: route.body,
    });
    await res.json().catch(() => ({}));
    timings.push(performance.now() - start);
  }

  const p50 = calculatePercentile(timings, 50);
  const p95 = calculatePercentile(timings, 95);
  console.log(
    `[${route.name}] p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms`,
  );
}

async function main() {
  console.log(`=== АВТОМАТИЧЕСКИЙ СТЕНД НАГРУЗКИ: ${PREFIX} ===`);
  for (const route of ROUTES) {
    await runRouteTest(route);
  }
  console.log(`==================================================`);
}

main().catch(console.error);
