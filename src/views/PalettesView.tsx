import {
  Alert,
  Badge,
  Box,
  Button,
  ColorInput,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  auditAll,
  auditPalette,
  CONFUSABLE,
  DISTINCT,
  GRAPHIC_AA,
  SHADED_NOTE,
  TEXT_AA,
  TEXT_AAA,
  type ContrastCheck,
  type PairCheck,
  type Status,
} from '../brands/audit';
import { useBrandPalettes } from '../brands/BrandPalettesContext';
import { COLOR_TOKENS, MODES, onPrimaryColor, type BrandId, type BrandTheme, type Mode } from '../brands/brandThemes';
import { simulate, VISIONS } from '../brands/colorMath';
import { useExplorer } from '../explorer/ExplorerContext';

const STATUS_LABEL: Record<Status, string> = { pass: 'Pass', warn: 'Hard to tell apart', fail: 'Fail' };
const STATUS_COLOR: Record<Status, string> = { pass: 'green', warn: 'yellow', fail: 'red' };

function ColorSwatchHex({ hex }: { hex: string }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Box w={12} h={12} style={{ background: hex, borderRadius: 3, border: '1px solid var(--atlas-border)' }} />
      <Text size="xs" ff="monospace">
        {hex}
      </Text>
    </Group>
  );
}

function StatusBadge({ status, children }: { status: Status; children?: string }) {
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm" tt="none">
      {children ?? STATUS_LABEL[status]}
    </Badge>
  );
}

function Swatch({ color, label, size = 22 }: { color: string; label: string; size?: number }) {
  return (
    <Box
      w={size}
      h={size}
      bg={color}
      title={`${label} ${color}`}
      style={{ borderRadius: 4, border: '1px solid rgba(128,128,128,0.25)', flexShrink: 0 }}
    />
  );
}

/** The 12 tokens drawn on the palette's own background, like the AtlasCharts swatch sheet. */
function PaletteStrip({ theme, mode }: { theme: BrandTheme; mode: Mode }) {
  const c = theme.modes[mode];
  return (
    <Box p="md" bg={c.background} style={{ borderRadius: 12, border: `1px solid ${c.surface}` }}>
      <SimpleGrid cols={{ base: 3, md: 6 }} spacing="sm" verticalSpacing="md">
        {COLOR_TOKENS.map((t) => (
          <div key={t.key}>
            <Box h={40} bg={c[t.key]} style={{ borderRadius: 6, border: `1px solid ${c.textSecondary}33` }} />
            <Text size="xs" mt={6} c={c.text}>
              {t.label}
            </Text>
            <Text size="xs" c={c.textSecondary} ff="monospace">
              {c[t.key]}
            </Text>
          </div>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function ContrastTable({ checks }: { checks: ContrastCheck[] }) {
  return (
    <Table verticalSpacing={6} fz="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={70}>Preview</Table.Th>
          <Table.Th>Check</Table.Th>
          <Table.Th>Used for</Table.Th>
          <Table.Th ta="right">Contrast</Table.Th>
          <Table.Th ta="right">Needs</Table.Th>
          <Table.Th>Result</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {checks.map((x) => (
          <Table.Tr key={`${x.label}-${x.usage}`}>
            <Table.Td>
              <Box
                w={48}
                h={28}
                bg={x.bg}
                style={{ borderRadius: 6, display: 'grid', placeItems: 'center' }}
              >
                {x.kind === 'text' ? (
                  <Text size="sm" fw={600} c={x.fg}>
                    Aa
                  </Text>
                ) : (
                  <Box w={28} h={4} bg={x.fg} style={{ borderRadius: 2 }} />
                )}
              </Box>
            </Table.Td>
            <Table.Td>{x.label}</Table.Td>
            <Table.Td c="dimmed">{x.usage}</Table.Td>
            <Table.Td ta="right" ff="monospace">
              {x.ratio.toFixed(2)}:1
            </Table.Td>
            <Table.Td ta="right" ff="monospace" c="dimmed">
              {x.required}:1
            </Table.Td>
            <Table.Td>
              <Group gap={6}>
                <StatusBadge status={x.status} />
                {x.kind === 'text' && x.ratio >= TEXT_AAA && (
                  <Text size="xs" c="dimmed">
                    AAA
                  </Text>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function PairList({ pairs, vision }: { pairs: PairCheck[]; vision: (typeof VISIONS)[number]['id'] }) {
  return (
    <Stack gap={4}>
      {pairs.map((p) => (
        <Group key={`${p.a.label}-${p.b.label}`} gap="xs" wrap="nowrap">
          <Swatch color={simulate(p.a.color, vision)} label={p.a.label} size={16} />
          <Swatch color={simulate(p.b.color, vision)} label={p.b.label} size={16} />
          <Text size="sm" style={{ flex: 1 }}>
            {p.a.label} and {p.b.label}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">
            {p.distance.toFixed(3)}
          </Text>
          <StatusBadge status={p.status} />
        </Group>
      ))}
    </Stack>
  );
}

function themeToCode(theme: BrandTheme) {
  const mode = (m: Mode) =>
    COLOR_TOKENS.map((t) => `        ${t.key}: '${theme.modes[m][t.key]}',`).join('\n');
  return `  {
    id: '${theme.id}',
    name: '${theme.name}',
    level: '${theme.level}',
    modes: {
      dark: {
${mode('dark')}
      },
      light: {
${mode('light')}
      },
    },
  },`;
}

export function PalettesView() {
  const { brands, history, isEdited, original, setColor, resetColor, resetBrand, clearHistory } = useBrandPalettes();
  const { approach } = useExplorer();
  const [pickedId, setBrandId] = useState<BrandId>('atlas');
  const [mode, setMode] = useState<Mode>('dark');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const atlasOnly = approach === 'unified';
  const inUse = (id: BrandId) => !atlasOnly || id === 'atlas';
  const brandId: BrandId = inUse(pickedId) ? pickedId : 'atlas';

  const theme = brands.find((b) => b.id === brandId)!;
  const audit = useMemo(() => auditPalette(theme.modes[mode], onPrimaryColor(theme, mode)), [theme, mode]);
  const overview = useMemo(() => auditAll(brands), [brands]);
  const sameLooking = audit.pairs.filter((p) => p.status === 'fail').length;
  const changedTokens = COLOR_TOKENS.filter((t) => theme.modes[mode][t.key] !== original(theme.id, mode, t.key));
  const statusClashes = audit.statusPairs.filter((p) => p.status !== 'pass');

  const copyCode = async () => {
    await navigator.clipboard.writeText(themeToCode(theme));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Brand palettes</Title>
        <Text c="dimmed">
          Every brand gets the same 12 tokens, tuned once for dark and once for light. Text needs{' '}
          {TEXT_AA}:1 contrast and chart marks need {GRAPHIC_AA}:1 (WCAG 2.1 AA). Series colors should
          differ by at least {DISTINCT} in perceived color (OKLab); under {CONFUSABLE} they look the same.
          Atlas is the real palette. The other four are first drafts that pass every check.
        </Text>
      </div>

      <Group justify="space-between">
        <Group>
          <SegmentedControl
            value={brandId}
            onChange={(v) => setBrandId(v as BrandId)}
            data={brands.map((b) => ({
              value: b.id,
              label: isEdited(b.id) ? `${b.name} •` : b.name,
              disabled: !inUse(b.id),
            }))}
          />
          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            data={MODES.map((m) => ({ value: m.id, label: m.label }))}
          />
        </Group>
        <Group gap="xs">
          <Button variant="default" size="xs" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy as code'}
          </Button>
          <Button variant="default" size="xs" disabled={!isEdited(brandId)} onClick={() => resetBrand(brandId)}>
            Reset {theme.name}
          </Button>
        </Group>
      </Group>

      {atlasOnly && (
        <Alert variant="light" color="gray" title="C · One Atlas look uses only the Atlas palette">
          Every widget, button and chart series is Atlas, whatever product it belongs to. Theia,
          Hyperion, BasinIQ and Vulcan show up only as text labels, so their palettes aren't used. Data
          meaning colors (like map detections) still follow the Data colors switch. Pick A or B to
          see the other brands.
        </Alert>
      )}

      <Stack gap="sm">
        <Group gap="xs">
          <Title order={3}>
            {theme.name}, {mode === 'dark' ? 'Dark' : 'Light'}
          </Title>
          <Badge variant="default" size="sm">
            {theme.level}
          </Badge>
          <StatusBadge status={audit.wcagPassed === audit.wcagTotal ? 'pass' : 'fail'}>
            {`${audit.wcagPassed} of ${audit.wcagTotal} WCAG checks`}
          </StatusBadge>
          <StatusBadge status={sameLooking === 0 ? 'pass' : 'fail'}>
            {sameLooking === 0 ? 'No series look the same' : `${sameLooking} series pairs look the same`}
          </StatusBadge>
        </Group>
        <PaletteStrip theme={theme} mode={mode} />
      </Stack>

      <Paper withBorder p="md">
        <Group justify="space-between" align="flex-start" mb={editing ? 'md' : 0}>
          <div>
            <Text fw={700} mb={4}>
              Edit {theme.name} · {mode === 'dark' ? 'Dark' : 'Light'}
            </Text>
            <Text size="xs" c="dimmed">
              Changes are saved in this browser and every check on this page updates as you type. Use
              “Copy as code” to paste the result into src/brands/brandThemes.ts.
            </Text>
          </div>
          <Switch label="Edit colors" checked={editing} onChange={(e) => setEditing(e.currentTarget.checked)} />
        </Group>
        {!editing && changedTokens.length > 0 && (
          <Stack gap={4} mt="sm">
            {changedTokens.map((t) => (
              <Group key={t.key} gap={8}>
                <Text size="sm">{t.label} changed:</Text>
                <ColorSwatchHex hex={original(theme.id, mode, t.key)} />
                <Text size="xs" c="dimmed">
                  →
                </Text>
                <ColorSwatchHex hex={theme.modes[mode][t.key]} />
                <Button variant="default" size="compact-xs" onClick={() => resetColor(theme.id, mode, t.key)}>
                  Undo
                </Button>
              </Group>
            ))}
          </Stack>
        )}
        {editing && (
          <SimpleGrid cols={{ base: 2, md: 4, xl: 6 }}>
            {COLOR_TOKENS.map((t) => {
              const was = original(theme.id, mode, t.key);
              const changed = theme.modes[mode][t.key] !== was;
              return (
                <Stack key={`${theme.id}-${mode}-${t.key}`} gap={2}>
                  <ColorInput
                    label={t.label}
                    size="xs"
                    format="hex"
                    value={theme.modes[mode][t.key]}
                    onChange={(hex) => {
                      if (/^#[0-9a-f]{6}$/i.test(hex)) setColor(theme.id, mode, t.key, hex.toUpperCase());
                    }}
                  />
                  {changed && (
                    <Text size="xs" c="dimmed">
                      Was {was} ·{' '}
                      <UnstyledButton
                        fz="xs"
                        td="underline"
                        c="var(--mantine-color-text)"
                        onClick={() => resetColor(theme.id, mode, t.key)}
                      >
                        Undo
                      </UnstyledButton>
                    </Text>
                  )}
                </Stack>
              );
            })}
          </SimpleGrid>
        )}
      </Paper>

      {history.length > 0 && (
        <Paper withBorder p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={700}>Change history</Text>
            <Button variant="subtle" size="xs" onClick={clearHistory}>
              Clear history
            </Button>
          </Group>
          <Table verticalSpacing={4}>
            <Table.Tbody>
              {history.slice(0, 30).map((c) => {
                const name = brands.find((b) => b.id === c.brand)!.name;
                const label = COLOR_TOKENS.find((t) => t.key === c.token)!.label;
                return (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(c.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {name} · {c.mode === 'dark' ? 'Dark' : 'Light'} · {label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <ColorSwatchHex hex={c.from} />
                        <Text size="xs" c="dimmed">
                          →
                        </Text>
                        <ColorSwatchHex hex={c.to} />
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Button variant="default" size="compact-xs" onClick={() => setColor(c.brand, c.mode, c.token, c.from)}>
                        Restore {c.from}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <div>
        <Title order={3} mb="sm">
          All brands
        </Title>
        <Paper withBorder>
          <Table highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Brand</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>Mode</Table.Th>
                <Table.Th>Primary</Table.Th>
                <Table.Th ta="right">WCAG AA checks</Table.Th>
                <Table.Th ta="right">Series that look the same</Table.Th>
                <Table.Th ta="right">Primary close to a status color</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {overview.map((row) => {
                const current = row.theme.id === brandId && row.mode.id === mode;
                const used = inUse(row.theme.id);
                return (
                  <Table.Tr
                    key={`${row.theme.id}-${row.mode.id}`}
                    bg={current ? 'var(--mantine-color-default-hover)' : undefined}
                    style={{ cursor: used ? 'pointer' : 'not-allowed', opacity: used ? 1 : 0.35 }}
                    onClick={() => {
                      if (!used) return;
                      setBrandId(row.theme.id);
                      setMode(row.mode.id);
                    }}
                  >
                    <Table.Td fw={current ? 700 : 400}>{row.theme.name}</Table.Td>
                    <Table.Td c="dimmed">{used ? row.theme.level : 'Not used under C'}</Table.Td>
                    <Table.Td>{row.mode.label}</Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <Swatch color={row.theme.modes[row.mode.id].primary} label="Primary" size={16} />
                        <Text size="xs" ff="monospace">
                          {row.theme.modes[row.mode.id].primary}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right">
                      <StatusBadge status={row.passed === row.total ? 'pass' : 'fail'}>
                        {`${row.passed} of ${row.total}`}
                      </StatusBadge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <StatusBadge status={row.confusable === 0 ? 'pass' : 'fail'}>{String(row.confusable)}</StatusBadge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <StatusBadge status={row.statusClashes === 0 ? 'pass' : 'warn'}>{String(row.statusClashes)}</StatusBadge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
        <Text size="xs" c="dimmed" mt={6}>
          Click a row to inspect it. “Primary close to a status color” uses typical vision; the
          color-blindness section below covers the rest.
        </Text>
      </div>

      <Stack gap="md">
        <div>
          <Title order={4}>Text</Title>
          <Text size="xs" c="dimmed">
            WCAG 1.4.3: {TEXT_AA}:1 for text. AAA, the stricter level, is {TEXT_AAA}:1.
          </Text>
        </div>
        <Paper withBorder>
          <ContrastTable checks={audit.text} />
        </Paper>

        <div>
          <Title order={4}>Chart marks</Title>
          <Text size="xs" c="dimmed">
            WCAG 1.4.11: {GRAPHIC_AA}:1 for lines, bars and slices against the card.
          </Text>
        </div>
        <Paper withBorder>
          <ContrastTable checks={audit.marks} />
        </Paper>

        <div>
          <Title order={4}>Shaded series</Title>
          <Text size="xs" c="dimmed">
            {SHADED_NOTE}
          </Text>
        </div>
        <Paper withBorder>
          <ContrastTable checks={audit.faded} />
        </Paper>
      </Stack>

      <Stack gap="md">
        <div>
          <Title order={4}>Brand versus status colors</Title>
          <Text size="xs" c="dimmed">
            In one product, the brand color sits next to Success, Warning and Error. If Primary looks like
            one of them, a brand accent reads as a status. This matters most for BasinIQ (green) and
            Vulcan (red).
          </Text>
        </div>
        <Paper withBorder p="md">
          {statusClashes.length === 0 ? (
            <StatusBadge status="pass">Primary is distinct from every status color</StatusBadge>
          ) : (
            <Stack gap="md">
              {VISIONS.map((v) => {
                const list = statusClashes.filter((p) => p.vision === v.id);
                return list.length ? (
                  <div key={v.id}>
                    <Text size="sm" fw={600} mb={4}>
                      {v.label}
                    </Text>
                    <PairList pairs={list} vision={v.id} />
                  </div>
                ) : null;
              })}
            </Stack>
          )}
        </Paper>
      </Stack>

      <Stack gap="md">
        <div>
          <Title order={4}>Color blindness</Title>
          <Text size="xs" c="dimmed">
            The series colors and Error, as people with each type of color blindness see them. Close
            pairs are hardest when both are in the same chart.
          </Text>
        </div>
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {VISIONS.map((v) => {
            const problems = audit.pairs
              .filter((p) => p.vision === v.id && p.status !== 'pass')
              .sort((a, b) => a.distance - b.distance);
            return (
              <Paper key={v.id} withBorder p="md">
                <Group justify="space-between" mb="xs" align="flex-start">
                  <div>
                    <Text fw={600}>{v.label}</Text>
                    {v.note && (
                      <Text size="xs" c="dimmed">
                        {v.note}
                      </Text>
                    )}
                  </div>
                  {problems.length === 0 ? (
                    <StatusBadge status="pass">All distinct</StatusBadge>
                  ) : (
                    <StatusBadge status={problems[0].status}>{`${problems.length} close pairs`}</StatusBadge>
                  )}
                </Group>
                <Group gap={4} mb={problems.length ? 'sm' : 0}>
                  {audit.swatches.map((s) => (
                    <Swatch key={s.label} color={simulate(s.color, v.id)} label={s.label} size={28} />
                  ))}
                </Group>
                {problems.length > 0 && <PairList pairs={problems} vision={v.id} />}
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
