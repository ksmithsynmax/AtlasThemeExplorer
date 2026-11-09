import { Alert, Grid, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useExplorer } from '../explorer/ExplorerContext';
import { scenarioOwners, scenarios, shellFocus, type ScenarioId } from '../scenarios';
import { identityOf } from '../tokens/approaches';
import { owners, type OwnerId } from '../tokens/domains';
import { widgetSpecs } from '../widgets/specs';
import { Widget } from '../widgets/widgets';

export function DashboardView({ scenario }: { scenario: ScenarioId }) {
  const { approach, mixedFocus, setMixedFocus, groupEnergy } = useExplorer();
  const s = scenarios[scenario];
  const choices = scenarioOwners(scenario).filter((id) => identityOf(id, { groupEnergy }) === id);
  const needsFocus = s.focus === null && approach === 'shell' && choices.length > 1;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{s.label}</Title>
          <Text c="dimmed">{s.description}</Text>
        </div>
        {needsFocus && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Shell follows
            </Text>
            <SegmentedControl
              size="xs"
              value={identityOf(shellFocus(scenario, mixedFocus) ?? choices[0], { groupEnergy })}
              onChange={(v) => setMixedFocus(v as OwnerId)}
              data={choices.map((id) => ({ value: id, label: owners[id].label }))}
            />
          </Stack>
        )}
      </Group>

      {needsFocus && (
        <Alert variant="light" color="orange" title="Approach B has to pick one product">
          This dashboard has no single product, so the shell can only follow one of them. Widgets
          from the other products end up wearing the wrong color.
        </Alert>
      )}

      <Grid>
        {s.widgets.map((id) => (
          <Grid.Col key={id} span={{ base: 12, lg: widgetSpecs[id].span === 2 ? 12 : 6 }}>
            <Widget id={id} />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
