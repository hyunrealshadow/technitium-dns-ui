import { fixtures } from './record-fixtures.mjs';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.cache/ui-tests',
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
});
after(() => server.close());
const { initialStateFrom, buildParams, getRecordDataParams } = await server.ssrLoadModule(
  '/src/pages/Zones/components/AddRecordModal/utils.ts'
);

const record = (type, rData) => ({
  name: 'host.example.test',
  type,
  ttl: 60,
  ttlString: '1m',
  disabled: true,
  expiryTtl: 300,
  comments: 'keep',
  rData,
});
const edit = r =>
  buildParams(
    initialStateFrom(r),
    r,
    'example.test',
    r.name,
    String(r.ttl),
    false,
    r.comments,
    String(r.expiryTtl)
  );

test('new records use the requested owner name, with an empty name selecting the zone apex', () => {
  const state = { ...initialStateFrom(null), recordType: 'A', ipAddress: '192.0.2.1' };
  assert.equal(
    buildParams(state, null, 'example.test', 'www.example.test', '', false, '', '').domain,
    'www.example.test'
  );
  assert.equal(
    buildParams(state, null, 'example.test', '', '', false, '', '').domain,
    'example.test'
  );
});

for (const [type, rData] of fixtures) {
  test(`${type}: edit and record actions preserve the API identity and metadata`, () => {
    const r = record(type, rData),
      payload = edit(r),
      identity = getRecordDataParams(r);
    assert.equal(payload.ttl, '60');
    assert.equal(payload.disable, true);
    assert.equal(payload.expiryTtl, '300');
    assert.equal(payload.comments, 'keep');
    for (const [key, value] of Object.entries(identity)) {
      if (
        [
          'autoIpv4Hint',
          'autoIpv6Hint',
          'priority',
          'proxyType',
          'characterStrings',
          'text',
          'splitText',
        ].includes(key)
      )
        continue;
      if (type === 'TXT' && key !== 'characterStringsBase64') continue;
      if (
        type === 'FWD' &&
        !['protocol', 'forwarder', 'forwarderPriority', 'dnssecValidation'].includes(key)
      )
        continue;
      assert.notEqual(value, undefined, `${key} must exist`);
      assert.equal(String(payload[key]), String(value), `${key} must identify the original record`);
    }
  });
}

test('SOA preserves the date serial scheme and NS glue can be cleared', () => {
  const soa = initialStateFrom(record('SOA', { useSerialDateScheme: true }));
  assert.equal(soa.soaUseSerialDateScheme, true);
  const ns = { ...record('NS', { nameServer: 'ns.example.net' }), glueRecords: ['192.0.2.2'] };
  assert.equal(initialStateFrom(ns).glue, '192.0.2.2');
  const payload = buildParams(
    { ...initialStateFrom(ns), glue: '' },
    ns,
    'example.test',
    ns.name,
    '60',
    false,
    '',
    '0'
  );
  assert.equal(payload.glue, '');
});

test('TXT no-op edits preserve raw character strings and split mode can be disabled', () => {
  const r = record(...fixtures.find(([type]) => type === 'TXT'));
  assert.equal(edit(r).characterStringsBase64, 'b25l,IHR3bw==');
  assert.equal('newText' in edit(r), false);
  const payload = buildParams(
    { ...initialStateFrom(r), splitText: false },
    r,
    'example.test',
    r.name,
    '60',
    false,
    '',
    '0'
  );
  assert.equal(payload.newSplitText, false);
  assert.equal(payload.newText, 'one two');
});

test('SVCB empty parameters use the API sentinel and existing parameters can be removed', () => {
  const r = record(...fixtures.find(([type]) => type === 'SVCB'));
  const payload = buildParams(
    { ...initialStateFrom(r), svcParams: [] },
    r,
    'example.test',
    r.name,
    '60',
    false,
    '',
    '0'
  );
  assert.equal(payload.svcParams, 'alpn|h2|port|8443');
  assert.equal(payload.newSvcParams, 'false');
  const state = {
    ...initialStateFrom(null),
    recordType: 'HTTPS',
    svcPriority: 0,
    svcTargetName: 'target.example.net',
  };
  assert.equal(buildParams(state, null, 'example.test', '', '', false, '', '').svcParams, 'false');
});

test('this-server ignores a stale external protocol and proxy settings', () => {
  const state = {
    ...initialStateFrom(null),
    recordType: 'FWD',
    forwarder: 'this-server',
    forwarderProtocol: 'Https',
    forwarderProxyType: 'Http',
    forwarderProxyAddress: 'proxy.example.net',
  };
  const payload = buildParams(state, null, 'example.test', '', '', false, '', '');
  assert.equal(payload.protocol, 'Udp');
  assert.equal('proxyType' in payload, false);
  assert.equal('proxyAddress' in payload, false);
});
