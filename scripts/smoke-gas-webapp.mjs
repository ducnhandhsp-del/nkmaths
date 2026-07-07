const url = process.argv[2] || process.env.GAS_WEB_APP_URL_PROD;

if (!url) {
  throw new Error('Usage: node scripts/smoke-gas-webapp.mjs <GAS_WEB_APP_URL>');
}

if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
  throw new Error('GAS Web App URL must look like https://script.google.com/macros/s/.../exec');
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

try {
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    signal: controller.signal,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'getData' }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Response is not JSON: ${err.message}`);
  }

  if (data?.ok !== true) {
    throw new Error(`GAS returned ok=false: ${data?.error || 'unknown error'}`);
  }

  for (const key of ['hs', 'uCls', 'py', 'ex', 'logs', 'tv', 'summary']) {
    if (!(key in data)) {
      throw new Error(`GAS response is missing key: ${key}`);
    }
  }

  const count = (value) => Array.isArray(value) ? value.length : 0;
  console.log([
    'GAS smoke ok:',
    `hs=${count(data.hs)}`,
    `classes=${count(data.uCls)}`,
    `payments=${count(data.py)}`,
    `expenses=${count(data.ex)}`,
    `logs=${count(data.logs)}`,
    `teachers=${count(data.tv)}`,
  ].join(' '));
} catch (err) {
  if (err?.name === 'AbortError') {
    throw new Error('GAS smoke timed out after 30s');
  }
  throw err;
} finally {
  clearTimeout(timeout);
}
