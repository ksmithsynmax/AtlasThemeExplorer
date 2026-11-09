import { Badge, ColorSwatch, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useExplorer } from '../explorer/ExplorerContext';
import { screenWidgets, type ScenarioId } from '../scenarios';
import { approachById, dataModeById } from '../tokens/approaches';
import { auditScreen, shellChanges, type ColorUse } from '../tokens/audit';
import { cssVar } from '../tokens/palettes';

const kindLabel: Record<ColorUse['kind'], string> = {
  shell: 'shell',
  identity: 'domain',
  reserved: 'reserved',
  meaning: 'meaning',
  series: 'series',
};

export function Metric({ label, value, tone }: { label: string; value: number; tone: 'bad' | 'warn' }) {
  const color = value === 0 ? 'gray' : tone === 'bad' ? 'red' : 'orange';
  return (
    <Paper withBorder p="xs">
      <Text fz={22} fw={700} c={value === 0 ? 'dimmed' : `${color}.6`} lh={1.1}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
}

function UseRow({ use }: { use: ColorUse }) {
  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <ColorSwatch color={use.hex} size={14} withShadow={false} mt={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" lh={1.3}>
          {use.label}
        </Text>
        {use.widgets.length > 0 && (
          <Text size="xs" c="dimmed" truncate>
            {use.widgets.join(', ')}
          </Text>
        )}
      </div>
      <Badge size="xs" variant="default">
        {kindLabel[use.kind]}
      </Badge>
    </Group>
  );
}

export function AuditPanel() {
  const { view, ctx, chatStep } = useExplorer();
  const approach = approachById[ctx.approach];
  const dataMode = dataModeById[ctx.dataMode];

  const widgetIds = useMemo(() => screenWidgets(view as ScenarioId, chatStep), [view, chatStep]);
  const audit = useMemo(() => auditScreen(widgetIds, ctx), [widgetIds, ctx]);
  const flips = view === 'chat' ? shellChanges(ctx, chatStep) : 0;

  return (
    <Stack gap="md">
      {[
        { label: 'UI approach', option: approach },
        { label: 'Data colors', option: dataMode },
      ].map(({ label, option }) => (
        <div key={label}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            {label}
          </Text>
          <Title order={5}>
            {option.letter} · {option.name}
          </Title>
          <Text size="xs">{option.rule}</Text>
        </div>
      ))}

      <Divider />

      <SimpleGrid cols={2} spacing="xs">
        <Metric label="Color conflicts" value={audit.conflicts} tone="bad" />
        <Metric label="Ambiguous colors" value={audit.ambiguities} tone="warn" />
        <Metric label="Widgets in wrong domain color" value={audit.misattributed.length} tone="bad" />
        <Metric label="Widgets with no domain cue" value={audit.identityLost.length} tone="warn" />
        <Metric label="Meanings recolored vs. source app" value={audit.remapped.length} tone="warn" />
        {view === 'chat' && <Metric label="Shell color changes" value={flips} tone="bad" />}
      </SimpleGrid>

      {audit.collisions.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            One color, several meanings
          </Text>
          {audit.collisions.map((c) => (
            <Paper key={c.hex} withBorder p="xs">
              <Badge size="xs" color={c.severity === 'conflict' ? 'red' : 'orange'} mb={6}>
                {c.severity === 'conflict' ? 'Conflict: two data meanings' : 'Ambiguous: identity vs. data'}
              </Badge>
              <Stack gap={6}>
                {c.uses.map((u) => (
                  <UseRow key={u.key} use={u} />
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {audit.misattributed.length > 0 && (
        <Paper withBorder p="xs">
          <Text size="xs" fw={700} mb={4}>
            Wearing another domain's color
          </Text>
          <Text size="xs" c="dimmed">
            {audit.misattributed.join(', ')}
          </Text>
        </Paper>
      )}

      {audit.remapped.length > 0 && (
        <Paper withBorder p="xs">
          <Text size="xs" fw={700} mb={6}>
            Recolored compared with the standalone app
          </Text>
          <Stack gap={4}>
            {audit.remapped.map(({ meaning, color }) => (
              <Group key={meaning.key} gap={6} wrap="nowrap">
                <ColorSwatch color={cssVar(meaning.native)} size={10} withShadow={false} />
                <Text size="xs">→</Text>
                <ColorSwatch color={cssVar(color)} size={10} withShadow={false} />
                <Text size="xs">{meaning.label}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <Divider />

      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
          Every color on screen
        </Text>
        {audit.uses.map((u) => (
          <UseRow key={u.key} use={u} />
        ))}
        <Text size="xs" c="dimmed">
          Gray and Vulcan's white glyphs (told apart by shape) are treated as neutral and not audited.
        </Text>
      </Stack>
    </Stack>
  );
}
