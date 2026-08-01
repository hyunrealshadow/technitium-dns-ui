import { useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Text,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../components/notifications';
import { apiClient } from '../../../api/client';
import type { ZoneRecord } from '../types';

const RECORD_TYPES = [
  'A',
  'AAAA',
  'NS',
  'CNAME',
  'SOA',
  'MX',
  'TXT',
  'PTR',
  'RP',
  'SRV',
  'NAPTR',
  'DNAME',
  'DS',
  'SSHFP',
  'RRSIG',
  'NSEC',
  'DNSKEY',
  'NSEC3',
  'NSEC3PARAM',
  'TLSA',
  'ZONEMD',
  'SVCB',
  'HTTPS',
  'URI',
  'CAA',
  'ANAME',
  'FWD',
  'APP',
];

interface AddRecordModalProps {
  zone: string;
  zoneType: string;
  dnssecStatus: string | null;
  editRecord: ZoneRecord | null;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRecordModal({
  zone,
  zoneType,
  dnssecStatus,
  editRecord,
  opened,
  onClose,
  onSuccess,
}: AddRecordModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editRecord;

  const allowedTypes = getRecordTypes(zoneType, dnssecStatus);

  const [recordType, setRecordType] = useState(editRecord?.type || 'A');
  const [domain, setDomain] = useState(editRecord?.name || '');
  const [ttl, setTtl] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [comments, setComments] = useState('');

  // Type-specific fields
  const [ipAddress, setIpAddress] = useState('');
  const [ptr, setPtr] = useState(false);
  const [createPtrZone, setCreatePtrZone] = useState(false);
  const [nameServer, setNameServer] = useState('');
  const [glue, setGlue] = useState('');
  const [cname, setCname] = useState('');
  const [preference, setPreference] = useState(10);
  const [exchange, setExchange] = useState('');
  const [text, setText] = useState('');
  const [splitText, setSplitText] = useState(false);
  const [ptrName, setPtrName] = useState('');
  const [priority, setPriority] = useState(0);
  const [weight, setWeight] = useState(0);
  const [port, setPort] = useState(80);
  const [target, setTarget] = useState('');
  const [uri, setUri] = useState('');
  const [flags, setFlags] = useState(0);
  const [tag, setTag] = useState('');
  const [value, setValue] = useState('');
  const [aname, setAname] = useState('');
  const [forwarder, setForwarder] = useState('');
  const [forwarderProtocol, setForwarderProtocol] = useState('Udp');

  const buildParams = () => {
    const params: Record<string, unknown> = {
      zone,
      domain: domain || zone,
      type: recordType,
    };
    if (ttl) params.ttl = ttl;
    if (overwrite) params.overwrite = true;
    if (comments) params.comments = comments;

    switch (recordType) {
      case 'A':
      case 'AAAA':
        params.ipAddress = ipAddress;
        if (ptr) {
          params.ptr = true;
          if (createPtrZone) params.createPtrZone = true;
        }
        break;
      case 'NS':
        params.nameServer = nameServer;
        if (glue) params.glue = glue;
        break;
      case 'CNAME':
        params.cname = cname;
        break;
      case 'MX':
        params.preference = preference;
        params.exchange = exchange;
        break;
      case 'TXT':
        params.text = text;
        if (splitText) params.splitText = true;
        break;
      case 'PTR':
        params.ptrName = ptrName;
        break;
      case 'SRV':
        params.priority = priority;
        params.weight = weight;
        params.port = port;
        params.target = target;
        break;
      case 'URI':
        params.priority = priority;
        params.weight = weight;
        params.uri = uri;
        break;
      case 'CAA':
        params.flags = flags;
        params.tag = tag;
        params.value = value;
        break;
      case 'ANAME':
        params.aname = aname;
        break;
      case 'FWD':
        params.forwarder = forwarder;
        params.forwarderProtocol = forwarderProtocol;
        break;
    }
    return params;
  };

  const handleSubmit = async () => {
    try {
      const endpoint = isEdit ? '/zones/records/update' : '/zones/records/add';
      await apiClient.post(endpoint, buildParams());
      success(t('common.success'), isEdit ? t('zones.recordUpdated') : t('zones.recordAdded'));
      onSuccess();
    } catch {
      error(t('common.error'), isEdit ? t('zones.recordUpdateFailed') : t('zones.recordAddFailed'));
    }
  };

  const renderTypeFields = () => {
    switch (recordType) {
      case 'A':
      case 'AAAA':
        return (
          <Stack gap="sm">
            <TextInput
              label="IP Address"
              placeholder="1.2.3.4"
              value={ipAddress}
              onChange={e => setIpAddress(e.target.value)}
              required
            />
            <Checkbox
              label="Add PTR record"
              checked={ptr}
              onChange={e => setPtr(e.currentTarget.checked)}
            />
            {ptr && (
              <Checkbox
                label="Create PTR zone if not exists"
                checked={createPtrZone}
                onChange={e => setCreatePtrZone(e.currentTarget.checked)}
              />
            )}
          </Stack>
        );
      case 'NS':
        return (
          <Stack gap="sm">
            <TextInput
              label="Name Server"
              placeholder="ns1.example.com"
              value={nameServer}
              onChange={e => setNameServer(e.target.value)}
              required
            />
            <TextInput
              label="Glue Addresses"
              placeholder="Optional"
              value={glue}
              onChange={e => setGlue(e.target.value)}
            />
          </Stack>
        );
      case 'CNAME':
        return (
          <TextInput
            label="CNAME"
            placeholder="target.example.com"
            value={cname}
            onChange={e => setCname(e.target.value)}
            required
          />
        );
      case 'MX':
        return (
          <Stack gap="sm">
            <NumberInput
              label="Preference"
              value={preference}
              onChange={v => setPreference(Number(v))}
              min={0}
            />
            <TextInput
              label="Exchange"
              placeholder="mail.example.com"
              value={exchange}
              onChange={e => setExchange(e.target.value)}
              required
            />
          </Stack>
        );
      case 'TXT':
        return (
          <Stack gap="sm">
            <Textarea
              label="Text"
              placeholder="v=spf1 ..."
              value={text}
              onChange={e => setText(e.target.value)}
              minRows={3}
              required
            />
            <Checkbox
              label="Split long text into multiple strings"
              checked={splitText}
              onChange={e => setSplitText(e.currentTarget.checked)}
            />
          </Stack>
        );
      case 'PTR':
        return (
          <TextInput
            label="PTR Name"
            placeholder="host.example.com"
            value={ptrName}
            onChange={e => setPtrName(e.target.value)}
            required
          />
        );
      case 'SRV':
        return (
          <Stack gap="sm">
            <NumberInput
              label="Priority"
              value={priority}
              onChange={v => setPriority(Number(v))}
              min={0}
            />
            <NumberInput
              label="Weight"
              value={weight}
              onChange={v => setWeight(Number(v))}
              min={0}
            />
            <NumberInput
              label="Port"
              value={port}
              onChange={v => setPort(Number(v))}
              min={0}
              max={65535}
            />
            <TextInput
              label="Target"
              placeholder="server.example.com"
              value={target}
              onChange={e => setTarget(e.target.value)}
              required
            />
          </Stack>
        );
      case 'DNAME':
        return (
          <TextInput
            label="DNAME"
            placeholder="target.example.com"
            value={cname}
            onChange={e => setCname(e.target.value)}
            required
          />
        );
      case 'URI':
        return (
          <Stack gap="sm">
            <NumberInput
              label="Priority"
              value={priority}
              onChange={v => setPriority(Number(v))}
              min={0}
            />
            <NumberInput
              label="Weight"
              value={weight}
              onChange={v => setWeight(Number(v))}
              min={0}
            />
            <TextInput
              label="URI"
              placeholder="https://example.com"
              value={uri}
              onChange={e => setUri(e.target.value)}
              required
            />
          </Stack>
        );
      case 'CAA':
        return (
          <Stack gap="sm">
            <NumberInput label="Flags" value={flags} onChange={v => setFlags(Number(v))} min={0} />
            <TextInput
              label="Tag"
              placeholder="issue / issuewild / iodef"
              value={tag}
              onChange={e => setTag(e.target.value)}
              required
            />
            <TextInput
              label="Value"
              placeholder="example.com"
              value={value}
              onChange={e => setValue(e.target.value)}
              required
            />
          </Stack>
        );
      case 'ANAME':
        return (
          <TextInput
            label="ANAME"
            placeholder="target.example.com"
            value={aname}
            onChange={e => setAname(e.target.value)}
            required
          />
        );
      case 'FWD':
        return (
          <Stack gap="sm">
            <Select
              label="Protocol"
              data={['Udp', 'Tcp', 'Tls', 'Https', 'Quic'].map(p => ({ value: p, label: p }))}
              value={forwarderProtocol}
              onChange={v => setForwarderProtocol(v || 'Udp')}
            />
            <TextInput
              label="Forwarder"
              placeholder="8.8.8.8"
              value={forwarder}
              onChange={e => setForwarder(e.target.value)}
              required
            />
          </Stack>
        );
      default:
        return (
          <Text c="dimmed">
            Fields for {recordType} records are not yet implemented in this form.
          </Text>
        );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? `Edit ${editRecord?.type} Record` : 'Add Record'}
      size="lg"
    >
      <Stack gap="md">
        <Select
          label="Record Type"
          data={allowedTypes.map(t => ({ value: t, label: t }))}
          value={recordType}
          onChange={v => {
            if (v) {
              setRecordType(v);
              setIpAddress('');
              setPtr(false);
              setCreatePtrZone(false);
              setNameServer('');
              setGlue('');
              setCname('');
              setPreference(10);
              setExchange('');
              setText('');
              setSplitText(false);
              setPtrName('');
              setPriority(0);
              setWeight(0);
              setPort(80);
              setTarget('');
              setUri('');
              setFlags(0);
              setTag('');
              setValue('');
              setAname('');
              setForwarder('');
              setForwarderProtocol('Udp');
            }
          }}
          disabled={isEdit}
        />

        <TextInput
          label="Domain Name"
          placeholder={zone}
          value={domain}
          onChange={e => setDomain(e.target.value)}
          description={`Leave empty to use zone root (${zone})`}
        />

        <TextInput
          label="TTL"
          placeholder="Auto"
          value={ttl}
          onChange={e => setTtl(e.target.value)}
          description="TTL in seconds (e.g. 3600) or leave empty for default"
        />

        {renderTypeFields()}

        {!isEdit && (
          <Checkbox
            label="Overwrite existing record with same name and type"
            checked={overwrite}
            onChange={e => setOverwrite(e.currentTarget.checked)}
          />
        )}

        <TextInput
          label="Comments"
          placeholder="Optional"
          value={comments}
          onChange={e => setComments(e.target.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? t('common.save') : t('common.add')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function getRecordTypes(zoneType: string, dnssecStatus: string | null): string[] {
  const types = [...RECORD_TYPES];
  if (zoneType === 'Forwarder') {
    return types.filter(t => !['DS', 'SSHFP', 'TLSA'].includes(t));
  }
  if (zoneType === 'Primary') {
    if (dnssecStatus) {
      return types.filter(t => !['ANAME', 'APP'].includes(t));
    }
    return types.filter(t => !['FWD'].includes(t));
  }
  return ['A', 'AAAA', 'NS', 'CNAME', 'MX', 'TXT', 'PTR', 'SRV', 'NAPTR', 'DNAME'];
}
