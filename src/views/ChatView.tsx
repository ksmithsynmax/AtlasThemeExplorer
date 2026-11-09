import { Alert, Avatar, Badge, Box, Grid, Group, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useExplorer } from '../explorer/ExplorerContext';
import { chatFocus, chatTurns, scenarios } from '../scenarios';
import { shellOwner } from '../tokens/approaches';
import { owners } from '../tokens/domains';
import { Widget } from '../widgets/widgets';

export function ChatView() {
  const { chatStep, setChatStep, ctx } = useExplorer();
  const s = scenarios.chat;
  const turns = chatTurns.slice(0, chatStep);

  const shellTimeline = chatTurns.map((_, i) => shellOwner({ ...ctx, focus: chatFocus(i + 1) }));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{s.label}</Title>
          <Text c="dimmed">{s.description}</Text>
        </div>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Step through the conversation
          </Text>
          <SegmentedControl
            size="xs"
            value={String(chatStep)}
            onChange={(v) => setChatStep(Number(v))}
            data={chatTurns.map((_, i) => ({ value: String(i + 1), label: `Turn ${i + 1}` }))}
          />
        </Stack>
      </Group>

      <Paper withBorder p="sm">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            Shell color per turn:
          </Text>
          {shellTimeline.map((owner, i) => (
            <Group key={i} gap={6}>
              {i > 0 && <Text c="dimmed">→</Text>}
              <Badge color={owners[owner].color} variant={i < chatStep ? 'filled' : 'outline'}>
                {i + 1}. {owners[owner].label}
              </Badge>
            </Group>
          ))}
        </Group>
      </Paper>

      {turns.map((turn, i) => (
        <Stack key={i} gap="sm">
          <Group justify="flex-end">
            <Paper p="sm" bg="var(--mantine-color-default-hover)" maw="70%">
              <Text size="sm">{turn.question}</Text>
            </Paper>
          </Group>
          <Group align="flex-start" wrap="nowrap" gap="sm">
            <Avatar color="atlas" radius="xl" size="sm">
              A
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Group gap={6} mb={6}>
                {turn.focus ? (
                  <Badge size="xs" variant="default">
                    {owners[turn.focus].label}
                  </Badge>
                ) : (
                  <Badge size="xs" variant="default">
                    Theia + Energy
                  </Badge>
                )}
              </Group>
              <Text size="sm" mb="sm">
                {turn.answer}
              </Text>
              {!turn.focus && ctx.approach === 'shell' && (
                <Alert variant="light" color="orange" mb="sm" p="xs">
                  <Text size="xs">
                    This answer spans several products, so approach B keeps the previous shell color and
                    the Theia widgets below inherit it.
                  </Text>
                </Alert>
              )}
              <Grid>
                {turn.widgets.map((id) => (
                  <Grid.Col key={id} span={{ base: 12, xl: turn.widgets.length > 2 ? 4 : 6 }}>
                    <Widget id={id} />
                  </Grid.Col>
                ))}
              </Grid>
            </Box>
          </Group>
        </Stack>
      ))}
    </Stack>
  );
}
