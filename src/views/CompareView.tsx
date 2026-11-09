import { Badge, Box, Group, Paper, SegmentedControl, SimpleGrid, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useExplorer } from '../explorer/ExplorerContext';
import { dashboardScenarios, scenarios, screenWidgets, shellFocus, type ScenarioId } from '../scenarios';
import {
  approaches,
  dataModes,
  resolveScope,
  shellColor,
  type ApproachId,
  type DataModeId,
  type ResolveContext,
} from '../tokens/approaches';
import { auditScenario, shellChanges } from '../tokens/audit';
import { cssVar } from '../tokens/palettes';
import { widgetSpecs } from '../widgets/specs';

type Rating = 'good' | 'partial' | 'poor';
type Criteria<Id extends string> = { label: string; ratings: Record<Id, [Rating, string]> }[];

const uiCriteria: Criteria<ApproachId> = [
  {
    label: 'Atlas feels like one product',
    ratings: {
      scoped: ['good', 'The shell never changes.'],
      shell: ['poor', 'The app changes color as you move between domains.'],
      unified: ['good', 'Everything is Atlas cyan.'],
    },
  },
  {
    label: 'You can tell which domain a widget is from',
    ratings: {
      scoped: ['good', 'Accent, tag and icon carry the domain.'],
      shell: ['partial', 'Only on single-domain screens.'],
      unified: ['poor', 'Only the text label tells you.'],
    },
  },
  {
    label: 'LLM sessions that drift between domains',
    ratings: {
      scoped: ['good', 'Nothing in the shell has to change.'],
      shell: ['poor', 'The shell flips, and cross-domain answers have no right color.'],
      unified: ['good', 'Nothing changes.'],
    },
  },
  {
    label: 'Products inside domains (BasinIQ, Vulcan)',
    ratings: {
      scoped: ['good', 'Products show as a colored tag inside their domain.'],
      shell: ['poor', 'The shell would need a third level of re-theming.'],
      unified: ['poor', 'Products disappear visually.'],
    },
  },
  {
    label: 'Engineering complexity',
    ratings: {
      scoped: ['partial', 'Every widget declares its domain.'],
      shell: ['partial', 'Runtime re-theming of the whole app.'],
      unified: ['good', 'Nothing to scope.'],
    },
  },
];

const dataCriteria: Criteria<DataModeId> = [
  {
    label: 'Map colors match what users already learned',
    ratings: {
      native: ['good', 'Unchanged from each product.'],
      reserved: ['partial', 'Most match. Meanings on reserved hues, like Vulcan flares, shift.'],
      unique: ['partial', 'Some meanings move so every color stays unique.'],
    },
  },
  {
    label: 'Mixed screens read correctly',
    ratings: {
      native: ['poor', 'Red is a dark vessel and a flare at the same time.'],
      reserved: ['partial', 'Alerts are consistent, but series colors still collide with meanings.'],
      unique: ['good', 'No color means two things.'],
    },
  },
  {
    label: 'Scales to new products',
    ratings: {
      native: ['poor', 'Every new palette adds collisions.'],
      reserved: ['partial', 'Each new product needs a collision check.'],
      unique: ['poor', 'The supply of distinct hues runs out fast.'],
    },
  },
  {
    label: 'Governance',
    ratings: {
      native: ['good', 'Nothing to manage.'],
      reserved: ['partial', 'Two reserved colors plus an audit.'],
      unique: ['poor', 'A central registry has to approve every new meaning.'],
    },
  },
];

const ratingColor: Record<Rating, string> = { good: 'green', partial: 'yellow', poor: 'red' };

function CriteriaTable<Id extends string>({
  criteria,
  options,
}: {
  criteria: Criteria<Id>;
  options: { id: Id; letter: string; name: string }[];
}) {
  return (
    <Paper withBorder>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w="25%">Criterion</Table.Th>
            {options.map((o) => (
              <Table.Th key={o.id}>
                {o.letter} · {o.name}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {criteria.map((c) => (
            <Table.Tr key={c.label}>
              <Table.Td fw={600}>{c.label}</Table.Td>
              {options.map((o) => {
                const [rating, note] = c.ratings[o.id];
                return (
                  <Table.Td key={o.id} valign="top">
                    <Badge size="xs" color={ratingColor[rating]} variant="light" mb={4}>
                      {rating}
                    </Badge>
                    <Text size="xs">{note}</Text>
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

function MiniPreview({ ctx, scenario }: { ctx: ResolveContext; scenario: ScenarioId }) {
  return (
    <Paper withBorder style={{ overflow: 'hidden' }}>
      <Box h={12} bg={cssVar(shellColor(ctx))} />
      <SimpleGrid cols={2} spacing={5} p={5}>
        {screenWidgets(scenario).map((id, index) => {
          const spec = widgetSpecs[id];
          const scope = resolveScope(spec.owner, spec.meanings, ctx);
          const dots = spec.meanings.length
            ? spec.meanings.map((k) => scope.meaningColors[k])
            : spec.series.map((_, i) => scope.series[i % scope.series.length]);
          return (
            <Paper key={`${id}-${index}`} withBorder radius="sm" style={{ overflow: 'hidden' }}>
              <Box h={4} bg={cssVar(scope.accent)} />
              <Box p={5}>
                <Text fz={10} truncate>
                  {spec.title}
                </Text>
                <Group gap={3} mt={3}>
                  {dots.map((c, i) => (
                    <Box key={i} w={8} h={8} style={{ borderRadius: 8 }} bg={cssVar(c)} />
                  ))}
                </Group>
              </Box>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}

function Score({ label, value, tone }: { label: string; value: number; tone: 'bad' | 'warn' }) {
  return (
    <Tooltip label={label}>
      <Badge variant="light" color={value === 0 ? 'gray' : tone === 'bad' ? 'red' : 'orange'} size="sm">
        {value} {label.split(' ')[0].toLowerCase()}
      </Badge>
    </Tooltip>
  );
}

type ScenarioChoice = ScenarioId | 'all';

export function CompareView() {
  const { mixedFocus, groupEnergy } = useExplorer();
  const [scenario, setScenario] = useState<ScenarioChoice>('mixed');

  const scores = useMemo(() => {
    const ids = scenario === 'all' ? dashboardScenarios : [scenario];
    const result = {} as Record<string, Record<string, number>>;
    for (const a of approaches) {
      for (const d of dataModes) {
        const base = { approach: a.id, dataMode: d.id, groupEnergy };
        const audits = ids.map((id) => auditScenario(id, base, mixedFocus));
        const sum = (fn: (r: (typeof audits)[number]) => number) => audits.reduce((n, r) => n + fn(r), 0);
        result[`${a.id}:${d.id}`] = {
          conflicts: sum((r) => r.conflicts),
          ambiguous: sum((r) => r.ambiguities),
          wrongDomain: sum((r) => r.misattributed.length),
          noCue: sum((r) => r.identityLost.length),
          recolored: sum((r) => r.remapped.length),
          flips: ids.includes('chat') ? shellChanges(base) : 0,
        };
      }
    }
    return result;
  }, [scenario, mixedFocus, groupEnergy]);

  const previewScenario: ScenarioId = scenario === 'all' ? 'mixed' : scenario;
  const previewFocus = shellFocus(previewScenario, mixedFocus);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Compare approaches</Title>
          <Text c="dimmed">
            Two decisions: where domain color shows up in the UI (rows) and how data colors work
            (columns). Fewer issues is better.
          </Text>
        </div>
        <SegmentedControl
          value={scenario}
          onChange={(v) => setScenario(v as ScenarioChoice)}
          data={[
            ...dashboardScenarios.map((id) => ({ value: id, label: scenarios[id].label.replace(' dashboard', '') })),
            { value: 'all', label: 'All' },
          ]}
        />
      </Group>

      <Box style={{ display: 'grid', gridTemplateColumns: '180px repeat(3, 1fr)', gap: 12 }}>
        <div />
        {dataModes.map((d) => (
          <div key={d.id}>
            <Text fw={700}>
              {d.letter} · {d.name}
            </Text>
            <Text size="xs" c="dimmed">
              {d.tagline}
            </Text>
          </div>
        ))}
        {approaches.map((a) => (
          <Box key={a.id} style={{ display: 'contents' }}>
            <div>
              <Text fw={700}>
                {a.letter} · {a.name}
              </Text>
              <Text size="xs" c="dimmed">
                {a.tagline}
              </Text>
            </div>
            {dataModes.map((d) => {
              const s = scores[`${a.id}:${d.id}`];
              return (
                <Stack key={d.id} gap={6}>
                  <MiniPreview
                    ctx={{ approach: a.id, dataMode: d.id, focus: previewFocus, groupEnergy }}
                    scenario={previewScenario}
                  />
                  <Group gap={4}>
                    <Score label="Conflicts (one color, two data meanings)" value={s.conflicts} tone="bad" />
                    <Score label="Ambiguous (domain color reused as data)" value={s.ambiguous} tone="warn" />
                    <Score label="Wrong-domain widgets" value={s.wrongDomain} tone="bad" />
                    <Score label="No-cue widgets (no domain color)" value={s.noCue} tone="warn" />
                    <Score label="Recolored meanings vs. the standalone app" value={s.recolored} tone="warn" />
                    {(scenario === 'chat' || scenario === 'all') && (
                      <Score label="Shell flips in the LLM session" value={s.flips} tone="bad" />
                    )}
                  </Group>
                </Stack>
              );
            })}
          </Box>
        ))}
      </Box>

      <div>
        <Title order={3}>Judgment calls</Title>
        <Text c="dimmed" size="sm">
          Things the numbers above can’t capture.
        </Text>
      </div>
      <CriteriaTable criteria={uiCriteria} options={approaches} />
      <CriteriaTable criteria={dataCriteria} options={dataModes} />
    </Stack>
  );
}
