import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.cache/ui-field-tests',
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
});
after(() => server.close());
const { RecordTypeFields } = await server.ssrLoadModule(
  '/src/pages/Zones/components/AddRecordModal/fields.tsx'
);
const { initialStateFrom } = await server.ssrLoadModule(
  '/src/pages/Zones/components/AddRecordModal/utils.ts'
);

function flatten(element) {
  if (!element || typeof element !== 'object') return [];
  return [element, ...[].concat(element.props?.children || []).flatMap(flatten)];
}

function form(recordType, patch = {}, options = {}) {
  let state = { ...initialStateFrom(null), recordType, ...patch };
  return {
    get state() {
      return state;
    },
    fields() {
      return flatten(
        RecordTypeFields({
          recordType,
          s: state,
          set: patch => {
            state = { ...state, ...patch };
          },
          t: key => key,
          ...options,
        })
      );
    },
    field(label) {
      return this.fields().find(e => e.props?.label === label)?.props;
    },
  };
}

test('FWD selection locks the local protocol, hides proxies, and keeps DNSSEC editable', () => {
  const f = form('FWD', {
    forwarder: 'https://example.net/dns-query',
    forwarderProtocol: 'Https',
    forwarderProxyType: 'Http',
  });
  f.field('zones.useThisServer').onChange({ currentTarget: { checked: true } });
  assert.equal(f.state.forwarder, 'this-server');
  assert.equal(f.field('zones.protocol').value, 'Udp');
  assert.equal(f.field('zones.protocol').disabled, true);
  assert.equal(f.field('zones.forwarder').disabled, true);
  assert.equal(f.field('zones.forwarderProxyType'), undefined);
  assert.ok(f.field('zones.enableDnssecValidation'));
  f.field('zones.useThisServer').onChange({ currentTarget: { checked: false } });
  assert.equal(f.field('zones.forwarder').disabled, false);
  assert.ok(f.field('zones.forwarderProxyType'));
  assert.ok(f.field('zones.recordProxyAddress'));
});

test('APP options include record handlers, exclude other handlers, and load their templates', () => {
  const apps = [
    { name: 'Other', dnsApps: [{ classPath: 'Other.Logger', isAppRecordRequestHandler: false }] },
    {
      name: 'Example',
      dnsApps: [
        {
          classPath: 'Example.Handler',
          isAppRecordRequestHandler: true,
          recordDataTemplate: '{"example":true}',
        },
      ],
    },
  ];
  const f = form('APP', {}, { apps });
  assert.deepEqual(f.field('common.appName').data, ['Example']);
  f.field('common.appName').onChange('Example');
  assert.deepEqual(f.field('common.classPath').data, ['Example.Handler']);
  f.field('common.classPath').onChange('Example.Handler');
  assert.equal(f.state.recordData, '{"example":true}');
  const edit = form(
    'APP',
    { appName: 'Missing', appClassPath: 'Missing.Handler' },
    { isEdit: true }
  );
  assert.equal(edit.field('common.appName').disabled, true);
  assert.equal(edit.field('common.classPath').disabled, true);
});

test('custom types expose RDATA and SOA respects zone-specific restrictions', () => {
  assert.ok(form('Unknown').field('zones.customRecordType'));
  assert.ok(form('Unknown').field('RDATA'));
  assert.equal(
    form('SOA', {}, { zoneType: 'Forwarder' }).field('zones.responsiblePerson').disabled,
    true
  );
  assert.equal(
    form('SOA', {}, { zoneType: 'Catalog' }).field('zones.primaryNameServer').disabled,
    true
  );
});
