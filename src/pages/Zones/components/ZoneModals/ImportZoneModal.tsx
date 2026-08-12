import { useState } from 'react';
import { Button, Checkbox, FileInput, Group, Modal, Radio, Stack, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { success, error } from '../../../../components/notifications';
import { apiClient } from '../../../../api/client';
export function ImportZoneModal({
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
  const [importType, setImportType] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [overwriteZone, setOverwriteZone] = useState(false);
  const [overwriteSoaSerial, setOverwriteSoaSerial] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (importType === 'file' && !file) {
      error(t('common.error'), t('zones.importFileRequired'));
      return;
    }
    if (importType === 'text' && !text.trim()) {
      error(t('common.error'), t('zones.importTextRequired'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (importType === 'file') {
        formData.append('fileImportZone', file!);
      }

      const response = await fetch(
        `/api/zones/import?zone=${encodeURIComponent(zone)}&overwrite=${overwrite}&overwriteZone=${overwriteZone}&overwriteSoaSerial=${overwriteSoaSerial}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiClient.getToken() || ''}`,
            ...(importType === 'text' ? { 'Content-Type': 'text/plain' } : {}),
          },
          body: importType === 'text' ? text : formData,
        }
      );

      const data = await response.json();
      if (data.status === 'ok') {
        success(t('common.success'), t('zones.zoneImportSuccess'));
        onClose();
        onSuccess();
      } else {
        throw new Error(data.errorMessage || 'Import failed');
      }
    } catch {
      error(t('common.error'), t('zones.zoneImportFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('zones.importZoneTitle', { zone })} size="md">
      <Stack>
        <Group>
          <Radio
            checked={importType === 'file'}
            onChange={() => setImportType('file')}
            label={t('zones.importTypeFile')}
          />
          <Radio
            checked={importType === 'text'}
            onChange={() => setImportType('text')}
            label={t('zones.importTypeText')}
          />
        </Group>

        {importType === 'file' ? (
          <FileInput
            label={t('zones.zoneFileLabel')}
            placeholder={t('zones.importFilePlaceholder')}
            value={file}
            onChange={setFile}
            accept=".zone,.txt"
          />
        ) : (
          <Textarea
            label={t('zones.zoneRecordsLabel')}
            placeholder={t('zones.zoneRecordsPlaceholder')}
            value={text}
            onChange={e => setText(e.target.value)}
            minRows={8}
            autosize
          />
        )}

        <Checkbox
          label={t('zones.overwriteRecords')}
          checked={overwrite}
          onChange={e => setOverwrite(e.currentTarget.checked)}
        />
        <Checkbox
          label={t('zones.overwriteZone')}
          description={t('zones.overwriteZoneHelp')}
          checked={overwriteZone}
          onChange={e => setOverwriteZone(e.currentTarget.checked)}
        />
        <Checkbox
          label={t('zones.overwriteSoaSerial')}
          checked={overwriteSoaSerial}
          onChange={e => setOverwriteSoaSerial(e.currentTarget.checked)}
          disabled={!overwrite}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleImport} loading={loading}>
            {t('common.import')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
