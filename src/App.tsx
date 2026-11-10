import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  MantineProvider,
  NavLink,
  Popover,
  ScrollArea,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from 'react';
import { ExplorerProvider, useExplorer, type ViewId } from './explorer/ExplorerContext';
import { dashboardScenarios, scenarios } from './scenarios';
import { buildTheme } from './theme';
import {
  approaches,
  dataModeById,
  dataModes,
  shellColor,
  type ApproachId,
  type DataModeId,
} from './tokens/approaches';
import { seriesOrders, type SeriesOrderId } from './tokens/seriesOrder';
import { ArchitectureView } from './views/ArchitectureView';
import { AuditPanel } from './views/AuditPanel';
import { ChatView } from './views/ChatView';
import { CompareView } from './views/CompareView';
import { DashboardView } from './views/DashboardView';
import { PalettesView } from './views/PalettesView';
import { PatternsView } from './views/PatternsView';
import { patterns, type PatternId } from './data/reference/patterns';
import {
  compareStyles,
  levelStyles,
  type CompareStyleId,
  type LevelStyleId,
} from './tokens/patternColors';
import { BrandPalettesProvider, useBrandPalettes } from './brands/BrandPalettesContext';

const isPatternView = (view: ViewId): view is `pattern-${PatternId}` => view.startsWith('pattern-');

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');
  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
      onClick={() => setColorScheme(computed === 'light' ? 'dark' : 'light')}
    >
      {computed === 'light' ? '☾' : '☀'}
    </ActionIcon>
  );
}

function Layout() {
  const {
    view,
    setView,
    approach,
    setApproach,
    dataMode,
    setDataMode,
    scopeOutlines,
    setScopeOutlines,
    groupEnergy,
    setGroupEnergy,
    seriesOrder,
    setSeriesOrder,
    compareStyle,
    setCompareStyle,
    levelStyle,
    setLevelStyle,
  } = useExplorer();
  const isScenario = (dashboardScenarios as ViewId[]).includes(view);
  const [auditOpen, { toggle: toggleAudit }] = useDisclosure(false);
  const showAudit = isScenario && auditOpen;

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      aside={{ width: 340, breakpoint: 'md', collapsed: { desktop: !showAudit, mobile: !showAudit } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <div>
              <Text fw={700} lh={1.1}>
                Atlas
              </Text>
              <Text size="xs" c="dimmed" lh={1.1}>
                Theme Explorer
              </Text>
            </div>
          </Group>

          <Group gap="lg" wrap="nowrap">
            <SegmentedControl
              size="xs"
              color="var(--mantine-primary-color-filled)"
              className="atlas-primary-control"
              aria-label="UI approach"
              value={approach}
              onChange={(v) => setApproach(v as ApproachId)}
              data={approaches.map((a) => ({ value: a.id, label: `${a.letter} · ${a.name}` }))}
            />
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Popover position="bottom-end" width={340} shadow="md" withArrow>
              <Popover.Target>
                <Button size="xs" variant="default">
                  View options · {dataModeById[dataMode].name} data
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap="md">
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Data colors
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      color="var(--mantine-primary-color-filled)"
                      className="atlas-primary-control"
                      value={dataMode}
                      onChange={(v) => setDataMode(v as DataModeId)}
                      data={dataModes.map((d) => ({ value: d.id, label: d.name }))}
                    />
                    <Text size="xs" c="dimmed">
                      {dataModeById[dataMode].rule}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Series order
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      value={seriesOrder}
                      onChange={(v) => setSeriesOrder(v as SeriesOrderId)}
                      data={seriesOrders.map((o) => ({ value: o.id, label: o.name }))}
                    />
                    <Text size="xs" c="dimmed">
                      {seriesOrders.find((o) => o.id === seriesOrder)?.rule}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Pairs (last year, their number)
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      value={compareStyle}
                      onChange={(v) => setCompareStyle(v as CompareStyleId)}
                      data={compareStyles.map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Ordered levels
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      value={levelStyle}
                      onChange={(v) => setLevelStyle(v as LevelStyleId)}
                      data={levelStyles.map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </Stack>
                  <Switch
                    size="sm"
                    label="Scope outlines"
                    description="Dashed outline showing which domain each widget belongs to"
                    checked={scopeOutlines}
                    onChange={(e) => setScopeOutlines(e.currentTarget.checked)}
                  />
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Hyperion, BasinIQ & Vulcan
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      value={groupEnergy ? 'energy' : 'product'}
                      onChange={(v) => setGroupEnergy(v === 'energy')}
                      data={[
                        { value: 'product', label: 'Own product' },
                        { value: 'energy', label: 'Grouped as Energy' },
                      ]}
                    />
                    <Text size="xs" c="dimmed">
                      Grouped, all three wear Hyperion's palette. Data meaning colors, like flare red or
                      well status, stay the same.
                    </Text>
                  </Stack>
                </Stack>
              </Popover.Dropdown>
            </Popover>
            {isScenario && (
              <Button
                size="xs"
                variant={auditOpen ? 'filled' : 'default'}
                className={auditOpen ? 'atlas-on-primary' : undefined}
                onClick={toggleAudit}
                aria-expanded={auditOpen}
              >
                {auditOpen ? 'Hide color audit' : 'Color audit'}
              </Button>
            )}
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mb={4}>
          Scenarios
        </Text>
        {dashboardScenarios.map((id) => (
          <NavLink key={id} label={scenarios[id].label} active={view === id} onClick={() => setView(id)} />
        ))}
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="md" mb={4}>
          Patterns
        </Text>
        {patterns.map((p) => (
          <NavLink
            key={p.id}
            label={p.label}
            active={view === `pattern-${p.id}`}
            onClick={() => setView(`pattern-${p.id}`)}
          />
        ))}
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="md" mb={4}>
          Decide
        </Text>
        <NavLink label="Compare approaches" active={view === 'compare'} onClick={() => setView('compare')} />
        <NavLink label="Architecture" active={view === 'architecture'} onClick={() => setView('architecture')} />
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="md" mb={4}>
          Colors
        </Text>
        <NavLink label="Brand palettes" active={view === 'palettes'} onClick={() => setView('palettes')} />
      </AppShell.Navbar>

      <AppShell.Main>
        {isPatternView(view) ? (
          <PatternsView pattern={view.slice('pattern-'.length) as PatternId} />
        ) : view === 'palettes' ? (
          <PalettesView />
        ) : view === 'compare' ? (
          <CompareView />
        ) : view === 'architecture' ? (
          <ArchitectureView />
        ) : view === 'chat' ? (
          <ChatView />
        ) : (
          <DashboardView scenario={view} />
        )}
      </AppShell.Main>

      {showAudit && (
        <AppShell.Aside>
          <ScrollArea p="md">
            <AuditPanel />
          </ScrollArea>
        </AppShell.Aside>
      )}
    </AppShell>
  );
}

function ThemedApp() {
  const { ctx } = useExplorer();
  const { brands } = useBrandPalettes();
  const primary = shellColor(ctx);
  const atlas = brands.find((b) => b.id === 'atlas')!;
  const brand = brands.find((b) => b.id === primary) ?? atlas;
  const { theme, cssVariablesResolver } = useMemo(
    () => buildTheme(primary, brand, brands),
    [primary, brand, brands],
  );
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
      <Layout />
    </MantineProvider>
  );
}

export default function App() {
  return (
    <ExplorerProvider>
      <BrandPalettesProvider>
        <ThemedApp />
      </BrandPalettesProvider>
    </ExplorerProvider>
  );
}
