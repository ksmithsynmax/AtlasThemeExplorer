import { AreaChart, BarChart, LineChart } from '@mantine/charts';
import { Group, Table, Text } from '@mantine/core';
import type { ComponentType } from 'react';
import {
  detections,
  detectionsByDay,
  events,
  flaring,
  hyperionActivity,
  portCalls,
  production,
  rigs,
  vulcanBuildout,
  wells,
} from '../data/mock';
import { DomainScope, useScope } from '../explorer/DomainScope';
import { meanings } from '../tokens/domains';
import { DetectionIconView, detectionIcons, hyperionIcons, vulcanIcons } from './detectionIcons';
import { PointMap } from './PointMap';
import { basins, ports, type WidgetId } from './specs';
import { MeaningLegend, WidgetFrame } from './WidgetFrame';

const CHART_H = 220;

function useMeaningSeries() {
  const scope = useScope();
  return scope.spec.meanings.map((key) => ({
    name: key,
    label: meanings[key].label,
    color: scope.meaningColor(key),
  }));
}

function useCategoricalSeries(names: string[]) {
  const scope = useScope();
  return names.map((name, i) => ({ name, color: scope.seriesColor(i) }));
}

function MaritimeMap() {
  return (
    <>
      <PointMap points={detections} center={[55.7, 25.85]} zoom={6.9} icons={detectionIcons} />
      <MeaningLegend icons={detectionIcons} />
    </>
  );
}

function MaritimeDetections() {
  return (
    <>
      <BarChart h={CHART_H} data={detectionsByDay} dataKey="day" type="stacked" series={useMeaningSeries()} />
      <MeaningLegend />
    </>
  );
}

function MaritimeEvents() {
  return (
    <Table.ScrollContainer minWidth={420} h={CHART_H + 36}>
      <Table verticalSpacing={6} fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Time</Table.Th>
            <Table.Th>Vessel</Table.Th>
            <Table.Th>Event</Table.Th>
            <Table.Th>Conf.</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {events.map((e) => (
            <Table.Tr key={e.id}>
              <Table.Td c="dimmed">{e.time}</Table.Td>
              <Table.Td>
                <Text size="sm">{e.vessel}</Text>
                <Text size="xs" c="dimmed">
                  {e.location}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={8} wrap="nowrap">
                  <DetectionIconView icon={detectionIcons[e.meaning]} />
                  <Text size="sm">{meanings[e.meaning].label}</Text>
                </Group>
              </Table.Td>
              <Table.Td>{e.confidence}%</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function MaritimePortCalls() {
  return (
    <LineChart
      h={CHART_H}
      data={portCalls}
      dataKey="week"
      series={useCategoricalSeries(ports)}
      curveType="monotone"
      withLegend
    />
  );
}

function EnergyProduction() {
  return (
    <AreaChart
      h={CHART_H}
      data={production}
      dataKey="month"
      type="stacked"
      unit=" Mb/d"
      series={useCategoricalSeries(basins)}
      withLegend
    />
  );
}

function BasinWellsMap() {
  return (
    <>
      <PointMap points={wells} center={[-102.7, 32.1]} zoom={5.9} />
      <MeaningLegend />
    </>
  );
}

function HyperionActivityMap() {
  return (
    <>
      <PointMap points={hyperionActivity} center={[-102.6, 32.15]} zoom={6.3} icons={hyperionIcons} />
      <MeaningLegend icons={hyperionIcons} />
    </>
  );
}

function VulcanBuildoutMap() {
  return (
    <>
      <PointMap points={vulcanBuildout} center={[-97.4, 31.0]} zoom={5.2} icons={vulcanIcons} />
      <MeaningLegend icons={vulcanIcons} />
    </>
  );
}

function BasinRigs() {
  return <BarChart h={CHART_H} data={rigs} dataKey="week" series={useCategoricalSeries(['Rigs'])} yAxisProps={{ domain: [280, 315] }} />;
}

function VulcanFlaring() {
  return (
    <>
      <BarChart h={CHART_H} data={flaring} dataKey="day" type="stacked" series={useMeaningSeries()} />
      <MeaningLegend />
    </>
  );
}

const bodies: Record<WidgetId, ComponentType> = {
  'maritime-map': MaritimeMap,
  'maritime-detections': MaritimeDetections,
  'maritime-events': MaritimeEvents,
  'maritime-port-calls': MaritimePortCalls,
  'energy-production': EnergyProduction,
  'basiniq-wells-map': BasinWellsMap,
  'basiniq-rigs': BasinRigs,
  'vulcan-flaring': VulcanFlaring,
  'hyperion-activity-map': HyperionActivityMap,
  'vulcan-buildout-map': VulcanBuildoutMap,
};

export function Widget({ id }: { id: WidgetId }) {
  const Body = bodies[id];
  return (
    <DomainScope widget={id}>
      <WidgetFrame>
        <Body />
      </WidgetFrame>
    </DomainScope>
  );
}
