import { Badge, Box, Code, ColorSwatch, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { approaches, dataModes } from '../tokens/approaches';
import { meanings, owners, reserved, type OwnerId } from '../tokens/domains';

function OwnerNode({ id, children }: { id: OwnerId; children?: ReactNode }) {
  const o = owners[id];
  return (
    <Stack gap="xs" align="center">
      <Paper withBorder px="md" py={8} style={{ borderTop: `4px solid var(--mantine-color-${o.color}-6)` }}>
        <Group gap={8}>
          <ColorSwatch color={`var(--mantine-color-${o.color}-6)`} size={14} withShadow={false} />
          <Text fw={600}>{o.label}</Text>
        </Group>
      </Paper>
      {children && (
        <>
          <Box w={2} h={16} bg="var(--mantine-color-default-border)" />
          <Group gap="md" align="flex-start" wrap="nowrap">
            {children}
          </Group>
        </>
      )}
    </Stack>
  );
}

function GroupNode({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Paper p="sm" style={{ border: '1.5px dashed var(--atlas-border)' }}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" ta="center" mb="xs">
        {label}
      </Text>
      <Group gap="md" align="flex-start" wrap="nowrap">
        {children}
      </Group>
    </Paper>
  );
}

function Tier({ n, title, rule, tokens, children }: { n: number; title: string; rule: string; tokens: string[]; children?: ReactNode }) {
  return (
    <Paper withBorder p="md">
      <Group align="flex-start" wrap="nowrap">
        <ThemeIcon size={36} radius="xl" variant="light">
          <Text fw={700}>{n}</Text>
        </ThemeIcon>
        <Stack gap={6} style={{ flex: 1 }}>
          <Group justify="space-between">
            <Text fw={700}>{title}</Text>
            <Text size="sm" c="dimmed">
              {rule}
            </Text>
          </Group>
          <Group gap={6}>
            {tokens.map((t) => (
              <Code key={t}>{t}</Code>
            ))}
          </Group>
          {children}
        </Stack>
      </Group>
    </Paper>
  );
}

const problems = [
  {
    title: 'Two identities compete',
    body: 'Atlas is cyan, but each domain has its own primary. On a Theia-heavy dashboard, which one wins?',
  },
  {
    title: 'Colors on the map carry meaning',
    body: 'Theia users learned that red is a dark vessel. Charts should match the map, but those colors should not leak into Energy.',
  },
  {
    title: 'Dashboards mix domains',
    body: 'A Theia map next to a Vulcan chart puts two different reds on one screen with two meanings.',
  },
  {
    title: 'LLM sessions drift',
    body: 'A conversation can start in Theia, move to Energy, then ask across both. The shell cannot follow that.',
  },
  {
    title: 'Energy is a group, not a brand',
    body: 'Energy is Hyperion, BasinIQ and Vulcan. It has no palette, so an Energy dashboard mixes three product palettes.',
  },
  {
    title: 'Reserved colors',
    body: 'Alert and warning need to mean the same thing everywhere, but Vulcan’s brand red sits right on top of alert red.',
  },
];

const declareExample = `<DomainScope widget="vulcan-flaring">   // owner: vulcan (group: Energy)
  <WidgetFrame>                           // scope.accent, scope.tag
    <BarChart series={useMeaningSeries()} /> // data.vulcan.meaning.*
  </WidgetFrame>
</DomainScope>`;

export function ArchitectureView() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Architecture</Title>
        <Text c="dimmed">
          Four products become one. Here is the structure, the problems it creates, and how each
          approach answers them. Colors are placeholders.
        </Text>
      </div>

      <Paper withBorder p="lg">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="md">
          Brand hierarchy
        </Text>
        <Group justify="center">
          <OwnerNode id="atlas">
            <OwnerNode id="maritime" />
            <GroupNode label="Energy">
              <OwnerNode id="hyperion" />
              <OwnerNode id="basiniq" />
              <OwnerNode id="vulcan" />
            </GroupNode>
          </OwnerNode>
        </Group>
      </Paper>

      <div>
        <Title order={3} mb="sm">
          Problems to solve
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {problems.map((p, i) => (
            <Paper key={p.title} withBorder p="md">
              <Group gap="xs" mb={6} wrap="nowrap">
                <Badge variant="light" color="orange" circle>
                  {i + 1}
                </Badge>
                <Text fw={600}>{p.title}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {p.body}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      </div>

      <div>
        <Title order={3} mb="sm">
          Three token tiers
        </Title>
        <Stack gap="sm">
          <Tier n={1} title="Shell tokens" rule="Global. Never scoped." tokens={['shell.primary', 'shell.nav.active', 'shell.focus-ring']} />
          <Tier
            n={2}
            title="Domain scope tokens"
            rule="Resolved per widget from the domain it belongs to."
            tokens={['scope.accent', 'scope.tag', 'scope.icon']}
          />
          <Tier
            n={3}
            title="Data tokens"
            rule="Reserved semantics are global. Meanings and series are per domain."
            tokens={['data.semantic.alert', 'data.semantic.warning', 'data.<domain>.meaning.<key>', 'data.<domain>.series[n]']}
          >
            <Group gap="lg" mt={4}>
              {Object.entries(reserved).map(([role, color]) => (
                <Group key={role} gap={6}>
                  <ColorSwatch color={`var(--mantine-color-${color}-6)`} size={12} withShadow={false} />
                  <Text size="xs">semantic.{role}</Text>
                </Group>
              ))}
              {['dark', 'sts', 'drilling', 'flare'].map((k) => (
                <Group key={k} gap={6}>
                  <ColorSwatch color={`var(--mantine-color-${meanings[k].native}-6)`} size={12} withShadow={false} />
                  <Text size="xs">
                    {meanings[k].owner}.meaning.{k}
                  </Text>
                </Group>
              ))}
            </Group>
          </Tier>
        </Stack>
      </div>

      <div>
        <Title order={3} mb="sm">
          Two decisions
        </Title>
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {[
            { title: 'Where domain color shows up (tiers 1 and 2)', options: approaches },
            { title: 'How data colors work (tier 3)', options: dataModes },
          ].map(({ title, options }) => (
            <Paper key={title} withBorder p="md">
              <Text fw={700} mb="sm">
                {title}
              </Text>
              <Stack gap="sm">
                {options.map((o) => (
                  <div key={o.id}>
                    <Text fw={600} size="sm">
                      {o.letter} · {o.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {o.rule}
                    </Text>
                  </div>
                ))}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </div>

      <div>
        <Title order={3} mb="sm">
          How a widget declares its domain
        </Title>
        <Code block>{declareExample}</Code>
      </div>
    </Stack>
  );
}
