import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Title,
  type CSSProperties,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ZoneInfo } from '../../../types';
import {
  canAddRecord,
  canClone,
  canConvert,
  canExport,
  canImport,
  canResync,
  canShowOptions,
  getStatusColor,
} from '../utils';
import { formatDateTime } from '../../../../../utils/dateTime';

// Zone 详情头部卡片：标题、类型/DNSSEC/状态徽章与操作按钮组
export function ZoneInfoHeader({
  zoneInfo,
  isInternal,
  zoneType,
  status,
  dotBadgeStyle,
  dnssecStatus,
  hideDnssecRecords,
  loading,
  onBack,
  onRefresh,
  onEnable,
  onDisable,
  onResync,
  onExport,
  onToggleHideDnssec,
  onAddRecord,
  onImport,
  onConvert,
  onClone,
  onOptions,
  onPermissions,
  onSign,
  onUnsign,
  onViewDs,
  onDnssecProps,
  onDelete,
}: {
  zoneInfo: ZoneInfo & { displayName?: string };
  isInternal: boolean | undefined;
  zoneType: string;
  status: string;
  dotBadgeStyle: CSSProperties;
  dnssecStatus: string | null;
  hideDnssecRecords: boolean;
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onResync: () => void;
  onExport: () => void;
  onToggleHideDnssec: () => void;
  onAddRecord: () => void;
  onImport: () => void;
  onConvert: () => void;
  onClone: () => void;
  onOptions: () => void;
  onPermissions: () => void;
  onSign: () => void;
  onUnsign: () => void;
  onViewDs: () => void;
  onDnssecProps: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
          {t('zones.backToZones')}
        </Button>
      </Group>
      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
          <Stack gap={6}>
            <Group gap="xs">
              <Title order={3} style={{ margin: 0 }}>
                {zoneInfo.nameIdn || zoneInfo.name}
              </Title>
              <ActionIcon variant="subtle" color="gray" onClick={onRefresh} loading={loading}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Group>
            <Group gap="xs">
              <Badge
                color={isInternal ? 'gray' : 'blue'}
                variant="dot"
                size="sm"
                tt="none"
                style={dotBadgeStyle}
              >
                {isInternal ? t('zones.internal') : t(`zones.types.${zoneType}`)}
              </Badge>
              {dnssecStatus && (
                <Badge
                  color={zoneInfo.hasDnssecPrivateKeys ? 'blue' : 'gray'}
                  variant="dot"
                  size="sm"
                  tt="none"
                  style={dotBadgeStyle}
                >
                  {t('zones.dnssec')}
                </Badge>
              )}
              <Badge
                color={getStatusColor(status)}
                variant="dot"
                size="sm"
                tt="none"
                style={dotBadgeStyle}
              >
                {t(`zones.status.${status}`)}
              </Badge>
              {zoneInfo.catalog && (
                <Badge color="gray" variant="dot" size="sm" tt="none" style={dotBadgeStyle}>
                  {zoneInfo.catalog}
                </Badge>
              )}
            </Group>
            {zoneInfo.expiry && (
              <Text size="xs" fw={600}>
                {t('zones.expiry')}: {formatDateTime(zoneInfo.expiry)}
              </Text>
            )}
          </Stack>

          <Group gap="sm" wrap="wrap">
            {canAddRecord(isInternal, zoneType) && (
              <Button leftSection={<IconPlus size={14} />} size="sm" onClick={onAddRecord}>
                {t('zones.add')}
              </Button>
            )}

            {!isInternal && (
              <>
                {zoneInfo.disabled ? (
                  <Button
                    leftSection={<IconCheck size={14} />}
                    size="sm"
                    variant="default"
                    onClick={onEnable}
                  >
                    {t('zones.enable')}
                  </Button>
                ) : (
                  <Button
                    leftSection={<IconX size={14} />}
                    size="sm"
                    color="yellow"
                    onClick={onDisable}
                  >
                    {t('zones.disable')}
                  </Button>
                )}
              </>
            )}

            {canResync(zoneType) && (
              <Button leftSection={<IconRefresh size={14} />} size="sm" onClick={onResync}>
                {t('zones.resync')}
              </Button>
            )}

            <Menu shadow="md">
              <Menu.Target>
                <Button size="sm">{t('zones.options')}</Button>
              </Menu.Target>
              <Menu.Dropdown>
                {canImport(zoneType) && (
                  <Menu.Item onClick={onImport}>{t('common.import')}</Menu.Item>
                )}
                {canExport(zoneType) && (
                  <Menu.Item onClick={onExport}>{t('common.export')}</Menu.Item>
                )}
                {canConvert(zoneType) && (
                  <Menu.Item onClick={onConvert}>{t('zones.convertZone')}</Menu.Item>
                )}
                {canClone(zoneType) && (
                  <Menu.Item onClick={onClone}>{t('zones.cloneZone')}</Menu.Item>
                )}
                {canShowOptions(zoneType) && (
                  <Menu.Item onClick={onOptions}>{t('zones.zoneOptions')}</Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>

            {!isInternal && (
              <Button size="sm" onClick={onPermissions}>
                {t('zones.permissions')}
              </Button>
            )}

            {zoneType === 'Primary' && !dnssecStatus && (
              <Button size="sm" onClick={onSign}>
                {t('zones.signZone')}
              </Button>
            )}

            {(zoneType === 'Primary' || zoneType === 'Secondary') && dnssecStatus && (
              <Menu shadow="md">
                <Menu.Target>
                  <Button size="sm">{t('zones.dnssec')}</Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {hideDnssecRecords ? (
                    <Menu.Item leftSection={<IconEye size={14} />} onClick={onToggleHideDnssec}>
                      {t('zones.showDnssecRecords')}
                    </Menu.Item>
                  ) : (
                    <Menu.Item leftSection={<IconEyeOff size={14} />} onClick={onToggleHideDnssec}>
                      {t('zones.hideDnssecRecords')}
                    </Menu.Item>
                  )}
                  {zoneType === 'Primary' && (
                    <>
                      <Menu.Divider />
                      <Menu.Item onClick={onUnsign}>{t('zones.unsignZone')}</Menu.Item>
                      <Menu.Item onClick={onViewDs}>{t('zones.viewDsInfo')}</Menu.Item>
                      <Menu.Item onClick={onDnssecProps}>{t('zones.dnssecProperties')}</Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}

            {!isInternal && (
              <Button size="sm" color="red" onClick={onDelete}>
                {t('common.delete')}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    </>
  );
}
