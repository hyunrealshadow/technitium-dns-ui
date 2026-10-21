// Opt-in integration tests against a disposable server bound to loopback.
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import { fixtures } from './record-fixtures.mjs';

const base = process.env.DNS_UI_TEST_URL;
let server, api, utils, token;
const zone = `ui-audit-${Date.now()}.test`;
const forwardZone = `fwd-${zone}`;

before(async () => {
  if (!base) return;
  assert.ok(
    ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname),
    'Use a disposable loopback server'
  );
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, options) =>
    nativeFetch(
      typeof input === 'string' && input.startsWith('/api') ? new URL(input, base) : input,
      options
    );
  const login = await nativeFetch(`${base}/api/user/login`, {
    method: 'POST',
    body: new URLSearchParams({
      user: 'admin',
      pass: process.env.DNS_UI_TEST_PASSWORD || 'ui-audit-local-only',
    }),
  }).then(r => r.json());
  assert.equal(login.status, 'ok', login.errorMessage);
  token = login.token;
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ token }),
    setItem() {},
    removeItem() {},
  };
  server = await createServer({
    configFile: false,
    cacheDir: 'node_modules/.cache/ui-live-tests',
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { middlewareMode: true, hmr: false },
  });
  utils = await server.ssrLoadModule('/src/pages/Zones/components/AddRecordModal/utils.ts');
  const { ApiClient } = await server.ssrLoadModule('/src/api/client.ts');
  api = new ApiClient();
  await api.post('/zones/create', { zone, type: 'Primary' });
  await api.post('/zones/create', {
    zone: forwardZone,
    type: 'Forwarder',
    forwarder: 'this-server',
    protocol: 'Udp',
    dnssecValidation: true,
  });
  await api.post('/zones/records/add', {
    zone,
    domain: `svc.${zone}`,
    type: 'A',
    ipAddress: '192.0.2.9',
  });
  await api.post('/zones/records/add', {
    zone,
    domain: `svc.${zone}`,
    type: 'AAAA',
    ipAddress: '2001:db8::9',
  });
});

after(async () => {
  if (api) {
    for (const name of [zone, forwardZone]) await api.post('/zones/delete', { zone: name });
    await api.post('/user/logout', {});
  }
  if (server) await server.close();
});

async function read(owner, type, zoneName) {
  const response = await api.get(`/zones/records/get?zone=${zoneName}&domain=${owner}`);
  return response.response.records.find(r => r.name === owner && r.type === type);
}

for (const [type, fixture] of fixtures) {
  test(`live ${type}: add, read, edit, disable, enable, delete`, { skip: !base }, async () => {
    const zoneName = type === 'FWD' ? forwardZone : zone;
    const owner = `${type.toLowerCase()}.${zoneName}`;
    const rData = { ...fixture };
    if (type === 'SVCB' || type === 'HTTPS') rData.svcTargetName = `svc.${zone}`;
    const state = utils.initialStateFrom({ type, rData });
    const add = utils.buildParams(state, null, zoneName, owner, '60', false, 'audit', '300');
    await api.post('/zones/records/add', add);
    let saved = await read(owner, type, zoneName);
    assert.ok(saved, 'requested owner must be created');
    const originalData = saved.rData;
    saved.disabled = true;
    const update = utils.buildParams(
      utils.initialStateFrom(saved),
      saved,
      zoneName,
      owner,
      String(saved.ttl),
      false,
      saved.comments,
      String(saved.expiryTtl)
    );
    await api.post('/zones/records/update', update);
    saved = await read(owner, type, zoneName);
    assert.equal(saved.disabled, true);
    assert.equal(saved.expiryTtl, 300);
    assert.equal(saved.comments, 'audit');
    assert.deepEqual(saved.rData, originalData, 'no-op edit must preserve DNS data');
    await api.post('/zones/records/update', {
      zone: zoneName,
      domain: owner,
      type,
      ttl: saved.ttl,
      comments: saved.comments,
      expiryTtl: saved.expiryTtl,
      disable: false,
      ...utils.getRecordDataParams(saved),
    });
    saved = await read(owner, type, zoneName);
    assert.equal(saved.disabled, false);
    assert.equal(saved.expiryTtl, 300);
    assert.deepEqual(saved.rData, originalData);
    await api.post('/zones/records/delete', {
      zone: zoneName,
      domain: owner,
      type,
      ...utils.getRecordDataParams(saved),
    });
    assert.equal(await read(owner, type, zoneName), undefined);
  });
}

test('live SOA: editing preserves its date serial scheme', { skip: !base }, async () => {
  let soa = await read(zone, 'SOA', zone);
  const state = { ...utils.initialStateFrom(soa), soaUseSerialDateScheme: true };
  await api.post(
    '/zones/records/update',
    utils.buildParams(state, soa, zone, zone, String(soa.ttl), false, '', '0')
  );
  soa = await read(zone, 'SOA', zone);
  assert.equal(soa.rData.useSerialDateScheme, true);
  await api.post(
    '/zones/records/update',
    utils.buildParams(utils.initialStateFrom(soa), soa, zone, zone, String(soa.ttl), false, '', '0')
  );
  assert.equal((await read(zone, 'SOA', zone)).rData.useSerialDateScheme, true);
});

test(
  'live changed fields: mapped records, raw records, APP data, glue and SVCB parameter removal',
  { skip: !base },
  async () => {
    const cases = [
      ['SSHFP', { sshfpAlgorithm: 'Ed25519' }, r => assert.equal(r.rData.algorithm, 'Ed25519')],
      ['TLSA', { tlsaSelector: 'Cert' }, r => assert.equal(r.rData.selector, 'Cert')],
      ['NAPTR', { naptrOrder: 200 }, r => assert.equal(r.rData.order, 200)],
      ['URI', { uriPriority: 50 }, r => assert.equal(r.rData.priority, 50)],
      ['SVCB', { svcParams: [] }, r => assert.deepEqual(r.rData.svcParams, {})],
      [
        'APP',
        { recordData: '{"updated":true}' },
        r => assert.equal(r.rData.data, '{"updated":true}'),
      ],
      ['65400', { rawData: 'AB:CD:EF' }, r => assert.equal(r.rData.value, 'AB:CD:EF')],
      ['NS', { glue: '192.0.2.2' }, r => assert.deepEqual(r.glueRecords, ['192.0.2.2'])],
      [
        'FWD',
        {
          forwarder: '192.0.2.53',
          forwarderProtocol: 'Tcp',
          forwarderPriority: '100',
          forwarderDnssecValidation: false,
          forwarderProxyType: 'NoProxy',
        },
        r => {
          assert.equal(r.rData.forwarder, '192.0.2.53');
          assert.equal(r.rData.protocol, 'Tcp');
          assert.equal(r.rData.priority, 100);
          assert.equal(r.rData.dnssecValidation, false);
        },
      ],
    ];
    for (const [type, patch, verify] of cases) {
      const zoneName = type === 'FWD' ? forwardZone : zone;
      const owner = `change-${type.toLowerCase()}.${zoneName}`;
      const state = utils.initialStateFrom({
        type,
        rData: fixtures.find(([name]) => name === type)[1],
      });
      await api.post(
        '/zones/records/add',
        utils.buildParams(state, null, zoneName, owner, '60', false, '', '0')
      );
      const original = await read(owner, type, zoneName);
      await api.post(
        '/zones/records/update',
        utils.buildParams(
          { ...utils.initialStateFrom(original), ...patch },
          original,
          zoneName,
          owner,
          '60',
          false,
          '',
          '0'
        )
      );
      const updated = await read(owner, type, zoneName);
      verify(updated);
      await api.post('/zones/records/delete', {
        zone: zoneName,
        domain: owner,
        type,
        ...utils.getRecordDataParams(updated),
      });
    }
  }
);

test(
  'live API: a rejected mutation throws and never reaches the success path',
  { skip: !base },
  async () => {
    await assert.rejects(
      api.post('/zones/records/add', {
        zone,
        domain: `invalid.${zone}`,
        type: 'A',
        ipAddress: 'invalid',
      })
    );
  }
);
