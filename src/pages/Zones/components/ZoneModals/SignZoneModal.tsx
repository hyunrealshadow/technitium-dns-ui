import { useState } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Radio,
  Select,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function SignZoneModal({
  zone,
  opened,
  onClose,
  onSuccess,
}: {
  zone: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [algorithm, setAlgorithm] = useState('ECDSA');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA256');
  const [curve, setCurve] = useState('P256');
  const [kskKeySize, setKskKeySize] = useState(2048);
  const [zskKeySize, setZskKeySize] = useState(1024);
  const [pemKsk, setPemKsk] = useState('');
  const [pemZsk, setPemZsk] = useState('');
  const [nxProof, setNxProof] = useState<'NSEC' | 'NSEC3'>('NSEC');
  const [iterations, setIterations] = useState(0);
  const [saltLength, setSaltLength] = useState(0);
  const [dnsKeyTtl, setDnsKeyTtl] = useState('3600');
  const [zskRolloverDays, setZskRolloverDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSign = async () => {
    setSaving(true);
    try {
      const params: Record<string, unknown> = {
        zone,
        algorithm,
        nxProof,
        dnsKeyTtl,
        zskRolloverDays: pemZsk ? 0 : zskRolloverDays,
      };
      if (algorithm === 'RSA') {
        params.hashAlgorithm = hashAlgorithm;
        if (pemKsk) params.pemKskPrivateKey = pemKsk;
        else params.kskKeySize = kskKeySize;
        if (pemZsk) params.pemZskPrivateKey = pemZsk;
        else params.zskKeySize = zskKeySize;
      } else {
        params.curve = curve;
        if (pemKsk) params.pemKskPrivateKey = pemKsk;
        if (pemZsk) params.pemZskPrivateKey = pemZsk;
      }
      if (nxProof === 'NSEC3') {
        params.iterations = iterations;
        params.saltLength = saltLength;
      }
      await apiClient.post('/zones/dnssec/sign', params);
      success(t('common.success'), t('zones.zoneSigned'));
      onClose();
      onSuccess();
    } catch {
      error(t('common.error'), t('zones.signFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${t('zones.signZone')}: ${zone}`} size="lg">
      <Stack>
        <Select
          label={t('zones.algorithm')}
          data={['RSA', 'ECDSA', 'EDDSA']}
          value={algorithm}
          onChange={v => setAlgorithm(v || 'ECDSA')}
        />

        {algorithm === 'RSA' && (
          <>
            <Select
              label={t('zones.hashAlgorithm')}
              data={['SHA1', 'SHA256', 'SHA512']}
              value={hashAlgorithm}
              onChange={v => setHashAlgorithm(v || 'SHA256')}
            />
            <NumberInput
              label={t('zones.kskKeySize')}
              value={kskKeySize}
              onChange={v => setKskKeySize(Number(v))}
              min={1024}
              max={4096}
              disabled={!!pemKsk}
            />
            <NumberInput
              label={t('zones.zskKeySize')}
              value={zskKeySize}
              onChange={v => setZskKeySize(Number(v))}
              min={512}
              max={2048}
              disabled={!!pemZsk}
            />
          </>
        )}

        {algorithm === 'ECDSA' && (
          <Select
            label={t('zones.curve')}
            data={['P256', 'P384']}
            value={curve}
            onChange={v => setCurve(v || 'P256')}
          />
        )}

        {algorithm === 'EDDSA' && (
          <Select
            label={t('zones.curve')}
            data={['ED25519', 'ED448']}
            value={curve}
            onChange={v => setCurve(v || 'ED25519')}
          />
        )}

        <Textarea
          label={t('zones.kskPrivateKey')}
          placeholder={t('zones.pemPlaceholder')}
          value={pemKsk}
          onChange={e => setPemKsk(e.target.value)}
          minRows={3}
          autosize
        />
        <Textarea
          label={t('zones.zskPrivateKey')}
          placeholder={t('zones.pemPlaceholder')}
          value={pemZsk}
          onChange={e => setPemZsk(e.target.value)}
          minRows={3}
          autosize
        />

        <NumberInput
          label={t('zones.zskAutoRollover')}
          value={zskRolloverDays}
          onChange={v => setZskRolloverDays(Number(v))}
          min={0}
          max={365}
          disabled={!!pemZsk}
        />
        <TextInput
          label={t('zones.dnskeyTtl')}
          placeholder="3600"
          value={dnsKeyTtl}
          onChange={e => setDnsKeyTtl(e.target.value)}
        />

        <Group>
          <Radio checked={nxProof === 'NSEC'} onChange={() => setNxProof('NSEC')} label="NSEC" />
          <Radio checked={nxProof === 'NSEC3'} onChange={() => setNxProof('NSEC3')} label="NSEC3" />
        </Group>

        {nxProof === 'NSEC3' && (
          <>
            <NumberInput
              label={t('zones.iterations')}
              value={iterations}
              onChange={v => setIterations(Number(v))}
              min={0}
              max={100}
            />
            <NumberInput
              label={t('zones.saltLength')}
              value={saltLength}
              onChange={v => setSaltLength(Number(v))}
              min={0}
              max={64}
            />
          </>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSign} loading={saving}>
            {t('zones.signZone')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
