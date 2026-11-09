import { Box, ColorSwatch, Group, Paper, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useScope } from '../explorer/DomainScope';
import { useExplorer } from '../explorer/ExplorerContext';
import { meanings, owners } from '../tokens/domains';
import { cssVar } from '../tokens/palettes';
import { DetectionIconView, type DetectionIcon } from './detectionIcons';

export function WidgetFrame({ children }: { children: ReactNode }) {
  const scope = useScope();
  const { scopeOutlines, groupEnergy } = useExplorer();

  const card = (
    <Paper withBorder radius="md" style={{ overflow: 'hidden', height: '100%' }}>
      <Box p="md">
        <Text fw={600} mb="sm">
          {scope.spec.title}
        </Text>
        {children}
      </Box>
    </Paper>
  );

  if (!scopeOutlines) return card;

  const scopeVar = cssVar(owners[scope.identity].color);
  return (
    <Box
      pos="relative"
      h="100%"
      p={6}
      style={{ border: `1.5px dashed ${scopeVar}`, borderRadius: 'var(--mantine-radius-lg)' }}
    >
      <Text
        pos="absolute"
        top={-10}
        right={12}
        px={8}
        size="xs"
        fw={600}
        bg={scopeVar}
        c="var(--atlas-surface)"
        style={{ borderRadius: 'var(--mantine-radius-sm)', lineHeight: '18px', zIndex: 1 }}
      >
        {((groupEnergy && owners[scope.owner].group) || owners[scope.owner].label).toLowerCase()} scope
      </Text>
      {card}
    </Box>
  );
}

export function MeaningLegend({ icons }: { icons?: Record<string, DetectionIcon> }) {
  const scope = useScope();
  return (
    <Group gap="md" mt="sm">
      {scope.spec.meanings.map((key) => (
        <Group key={key} gap={6} wrap="nowrap">
          {icons?.[key] ? (
            <DetectionIconView icon={icons[key]} />
          ) : (
            <ColorSwatch color={cssVar(scope.meaningColors[key])} size={10} withShadow={false} />
          )}
          <Text size="xs" c="dimmed">
            {meanings[key].label}
          </Text>
        </Group>
      ))}
    </Group>
  );
}
