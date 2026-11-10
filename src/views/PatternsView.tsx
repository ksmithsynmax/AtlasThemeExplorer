import { AreaChart, BarChart, LineChart } from '@mantine/charts';
import {
  Badge,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useBrandPalettes } from '../brands/BrandPalettesContext';
import { patternExamples, patterns, type PatternExample, type PatternId } from '../data/reference/patterns';
import { useExplorer } from '../explorer/ExplorerContext';
import { approachById } from '../tokens/approaches';
import { owners, type OwnerId } from '../tokens/domains';
import {
  categoryStyles,
  compareStyles,
  foldCategories,
  levelStyles,
  patternSeriesStyles,
  type CategoryStyleId,
  type CompareStyleId,
  type LevelStyleId,
  type SeriesStyle,
} from '../tokens/patternColors';
import { seriesOrders, type SeriesOrderId } from '../tokens/seriesOrder';

const WORKING_IN: OwnerId[] = ['atlas', 'maritime', 'hyperion', 'basiniq', 'vulcan'];
const CHART_H = 200;
const LABEL_W = 112;
const LABEL_GAP = 12;

function usePatternStyles(example: PatternExample, categoryStyle: CategoryStyleId) {
  const { ctx, compareStyle, levelStyle } = useExplorer();
  const { brands } = useBrandPalettes();
  const mode = useComputedColorScheme('dark');
  return patternSeriesStyles(example, { ctx, compareStyle, levelStyle, categoryStyle, brands, mode });
}

function LegendMark({ style, chart }: { style: SeriesStyle; chart: PatternExample['chart'] }) {
  if (chart === 'line' || (style.dash && !style.outline)) {
    return (
      <svg width={18} height={8} aria-hidden>
        <line x1={1} y1={4} x2={17} y2={4} stroke={style.css} strokeWidth={style.thin ? 1 : 2} strokeDasharray={style.dash} />
      </svg>
    );
  }
  return (
    <svg width={10} height={10} aria-hidden>
      <rect
        x={0.75}
        y={0.75}
        width={8.5}
        height={8.5}
        rx={1.5}
        fill={style.outline ? 'none' : style.css}
        stroke={style.css}
        strokeWidth={1.5}
      />
    </svg>
  );
}

interface LabelPoint {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
  index?: number;
}

/**
 * Names each band of a stacked chart at its right end, instead of a legend.
 * Recharts renders series bottom to top, so the top series draws every label once all positions are known.
 */
function stackLabels(example: PatternExample) {
  const names = example.series.map((s) => s.name);
  const labels = Object.fromEntries(example.series.map((s) => [s.name, s.label]));
  const last = example.data.length - 1;
  const bottom: { v: number; y: number }[] = [];
  const ends: Record<string, { right: number; top: number; mid?: number }> = {};

  return (name: string) => (p: LabelPoint) => {
    const x = Number(p.x);
    const y = Number(p.y);
    if (example.chart === 'area' && name === names[0]) bottom.push({ v: Number(p.value) || 0, y });
    if (p.index !== last) return null;
    ends[name] =
      example.chart === 'bar'
        ? { right: x + Number(p.width), top: y, mid: y + Number(p.height) / 2 }
        : { right: x, top: y };
    if (name !== names[names.length - 1]) return null;

    let base = bottom.length ? bottom[bottom.length - 1].y : y;
    const a = bottom[0];
    const b = bottom.find((q) => q.v !== a?.v);
    if (a && b) base = a.y + ((a.y - b.y) / (b.v - a.v)) * a.v;

    const items = names
      .map((n, i) => {
        const end = ends[n];
        const lower = i === 0 ? base : ends[names[i - 1]].top;
        return { n, right: end.right, mid: end.mid ?? (end.top + lower) / 2, y: 0 };
      })
      .sort((p1, p2) => p1.mid - p2.mid);
    items.forEach((it, i) => (it.y = Math.max(it.mid, i ? items[i - 1].y + LABEL_GAP : -Infinity)));
    const overflow = items.length ? items[items.length - 1].y - base : 0;
    if (overflow > 0) items.forEach((it) => (it.y -= overflow));

    return (
      <g>
        {items.map((it) => (
          <g key={it.n}>
            <line x1={it.right + 2} y1={it.mid} x2={it.right + 6} y2={it.y} stroke="var(--mantine-color-dimmed)" strokeWidth={1} />
            <text x={it.right + 8} y={it.y} fontSize={11} dominantBaseline="middle" fill="var(--mantine-color-dimmed)">
              {labels[it.n]}
            </text>
          </g>
        ))}
      </g>
    );
  };
}

function SmallMultiples({ example, styles }: { example: PatternExample; styles: SeriesStyle[] }) {
  const max = Math.max(...example.data.flatMap((r) => example.series.map((s) => Number(r[s.name]) || 0)));
  return (
    <>
      <SimpleGrid cols={3} spacing="xs" verticalSpacing="sm">
        {example.series.map((s, i) => {
          const props = {
            h: 56,
            data: example.data,
            dataKey: example.x,
            series: [{ name: s.name, label: s.label, color: styles[i].color }],
            unit: example.unit,
            withXAxis: false,
            withYAxis: false,
            gridAxis: 'none' as const,
            yAxisProps: { domain: [0, max] },
          };
          return (
            <div key={s.name} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" truncate>
                {s.label}
              </Text>
              {example.chart === 'bar' ? (
                <BarChart {...props} />
              ) : (
                <LineChart {...props} withDots={false} curveType="monotone" />
              )}
            </div>
          );
        })}
      </SimpleGrid>
      <Text size="xs" c="dimmed" mt="xs">
        Same scale on every chart, 0 to {Math.round(max)} {example.unit.trim()}
      </Text>
    </>
  );
}

function PatternChart({ example, styles, labels }: { example: PatternExample; styles: SeriesStyle[]; labels?: boolean }) {
  const labelFor = labels ? stackLabels(example) : undefined;
  const series = example.series.map((s, i) => ({
    name: s.name,
    label: s.label,
    color: styles[i].color,
    strokeDasharray: styles[i].dash,
  }));
  const byName = Object.fromEntries(example.series.map((s, i) => [s.name, styles[i]]));
  const common = {
    h: CHART_H,
    data: example.data,
    dataKey: example.x,
    series,
    unit: example.unit,
    xAxisProps: { interval: 'preserveStartEnd' as const, minTickGap: 24 },
    tickLine: 'none' as const,
  };

  const chart =
    example.chart === 'bar' ? (
      <BarChart
        {...common}
        type={example.stacked ? 'stacked' : 'default'}
        barChartProps={{ barCategoryGap: '16%', barGap: 2, ...(labelFor ? { margin: { right: LABEL_W } } : {}) }}
        barProps={(s) => {
          const st = byName[s.name];
          return {
            ...(st?.outline ? { fillOpacity: 0, strokeOpacity: 1, stroke: st.css, strokeWidth: 1.5 } : {}),
            ...(labelFor ? { label: labelFor(s.name) } : {}),
          };
        }}
      />
    ) : example.chart === 'area' ? (
      <AreaChart
        {...common}
        type={example.stacked ? 'stacked' : 'default'}
        fillOpacity={1}
        withGradient={false}
        withDots={false}
        areaChartProps={labelFor ? { margin: { right: LABEL_W } } : undefined}
        areaProps={(s) => ({
          ...(byName[s.name]?.outline ? { fillOpacity: 0, strokeWidth: 1.5 } : {}),
          ...(labelFor ? { label: labelFor(s.name) } : {}),
        })}
      />
    ) : (
      <LineChart
        {...common}
        withDots={false}
        curveType="monotone"
        yAxisProps={{ domain: ['auto', 'auto'] }}
        lineProps={(s) => (byName[s.name]?.thin ? { strokeWidth: 1 } : {})}
      />
    );

  if (labelFor) return chart;

  return (
    <>
      {chart}
      <Group gap="sm" mt="xs">
        {example.series.map((s, i) => (
          <Group key={s.name} gap={6} wrap="nowrap">
            <LegendMark style={styles[i]} chart={example.chart} />
            <Text size="xs" c="dimmed">
              {s.label}
            </Text>
          </Group>
        ))}
      </Group>
    </>
  );
}

function PatternCard({ example: original, pattern }: { example: PatternExample; pattern: PatternId }) {
  const { categoryStyle: picked } = useExplorer();
  const categoryStyle = pattern === 'categories' ? picked : 'every';
  const example = categoryStyle === 'focus' ? foldCategories(original) : original;
  const { palette, styles } = usePatternStyles(example, categoryStyle);
  const plain = !example.series.some((s) => s.meaning);
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>
            {example.title}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {owners[example.product].label} · {example.source}
          </Text>
        </div>
        <Badge size="sm" variant="outline" color={owners[palette].color} style={{ flexShrink: 0 }}>
          {owners[palette].label} palette
        </Badge>
      </Group>
      {categoryStyle === 'small' ? (
        <SmallMultiples example={example} styles={styles} />
      ) : (
        <PatternChart example={example} styles={styles} labels={categoryStyle === 'focus' && plain && example.stacked} />
      )}
    </Paper>
  );
}

function Option<T extends string>({
  label,
  value,
  onChange,
  options,
  rule,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  rule?: string;
}) {
  return (
    <Stack gap={4} maw={520}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <SegmentedControl size="xs" value={value} onChange={(v) => onChange(v as T)} data={options} />
      {rule && (
        <Text size="xs" c="dimmed">
          {rule}
        </Text>
      )}
    </Stack>
  );
}

function PatternOption({ pattern }: { pattern: PatternId }) {
  const {
    compareStyle,
    setCompareStyle,
    levelStyle,
    setLevelStyle,
    seriesOrder,
    setSeriesOrder,
    categoryStyle,
    setCategoryStyle,
  } = useExplorer();
  const toData = <T extends string>(list: { id: T; name: string }[]) => list.map((o) => ({ value: o.id, label: o.name }));
  if (pattern === 'levels') {
    return (
      <Option<LevelStyleId>
        label="Level colors"
        value={levelStyle}
        onChange={setLevelStyle}
        options={toData(levelStyles)}
        rule={levelStyles.find((o) => o.id === levelStyle)?.rule}
      />
    );
  }
  if (pattern === 'categories') {
    return (
      <>
        <Option<CategoryStyleId>
          label="Groups"
          value={categoryStyle}
          onChange={setCategoryStyle}
          options={toData(categoryStyles)}
          rule={categoryStyles.find((o) => o.id === categoryStyle)?.rule}
        />
        {categoryStyle === 'every' && (
          <Option<SeriesOrderId>
            label="Series order"
            value={seriesOrder}
            onChange={setSeriesOrder}
            options={toData(seriesOrders)}
            rule={seriesOrders.find((o) => o.id === seriesOrder)?.rule}
          />
        )}
      </>
    );
  }
  return (
    <Option<CompareStyleId>
      label="Pairs"
      value={compareStyle}
      onChange={setCompareStyle}
      options={toData(compareStyles)}
      rule={compareStyles.find((o) => o.id === compareStyle)?.rule}
    />
  );
}

const approachNote = {
  scoped: 'Each chart wears the palette of the product its data comes from.',
  shell: 'Every chart wears the palette of the domain you are working in.',
  unified: 'Every chart wears the Atlas palette.',
} as const;

export function PatternsView({ pattern }: { pattern: PatternId }) {
  const { approach, mixedFocus, setMixedFocus } = useExplorer();
  const info = patterns.find((p) => p.id === pattern)!;
  const examples = patternExamples[pattern];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{info.label}</Title>
        <Text c="dimmed" size="sm">
          {info.summary} {info.share}. Every chart below is real data from a SynMax dashboard.
        </Text>
      </div>

      <Group align="flex-start" gap="xl">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {approachById[approach].letter} · {approachById[approach].name}
          </Text>
          <Text size="xs" c="dimmed" maw={320}>
            {approachNote[approach]}
          </Text>
        </Stack>
        {approach === 'shell' && (
          <Option<OwnerId>
            label="Working in"
            value={mixedFocus}
            onChange={setMixedFocus}
            options={WORKING_IN.map((o) => ({ value: o, label: owners[o].label }))}
          />
        )}
        <PatternOption pattern={pattern} />
      </Group>

      <SimpleGrid type="container" cols={{ base: 1, '760px': 2, '1200px': 3 }} spacing="md">
        {examples.map((example) => (
          <PatternCard key={example.id} example={example} pattern={pattern} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
