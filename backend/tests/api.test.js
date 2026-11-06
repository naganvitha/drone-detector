'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');

let server, base;
test.before(async () => {
  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('health', async () => {
  const r = await fetch(base + '/api/health');
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(await r.json(), { status: 'ok' });
});

test('model has 1568 weights and a bias', async () => {
  const m = await (await fetch(base + '/api/model')).json();
  assert.strictEqual(m.w.length, 1568);
  assert.strictEqual(typeof m.b, 'number');
});

test('cascade has features and stages', async () => {
  const c = await (await fetch(base + '/api/cascade')).json();
  assert.ok(c.f.length > 0 && c.s.length > 0);
});

test('frontend files are served', async () => {
  for (const p of ['/', '/css/styles.css', '/js/bootstrap.js', '/js/main.js']) {
    const r = await fetch(base + p);
    assert.strictEqual(r.status, 200, p);
  }
});
