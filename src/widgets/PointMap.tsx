import { Box, Center, Text, useComputedColorScheme } from '@mantine/core';
import { Map as MapLibre, NavigationControl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapPoint } from '../data/mock';
import { useScope } from '../explorer/DomainScope';
import { hexOf } from '../tokens/palettes';
import { rasterize, type DetectionIcon } from './detectionIcons';

const styles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

interface PointMapProps {
  points: MapPoint[];
  center: [number, number];
  zoom: number;
  height?: number;
  /** Meanings with an icon are drawn as that icon; the rest stay circles. */
  icons?: Record<string, DetectionIcon>;
}

const ICON_PIXEL_RATIO = 3;

export function PointMap({ points, center, zoom, height = 300, icons }: PointMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const [failed, setFailed] = useState(false);
  const scheme = useComputedColorScheme('light');
  const { meaningColors } = useScope();

  const data = useMemo<Parameters<GeoJSONSource['setData']>[0]>(
    () => ({
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: {
          color: hexOf(meaningColors[p.meaning]),
          meaning: p.meaning,
          hasIcon: Boolean(icons?.[p.meaning]),
          rotate: icons?.[p.meaning]?.rotates ? (p.heading ?? 0) : 0,
        },
      })),
    }),
    [points, meaningColors, icons],
  );
  const latestData = useRef(data);
  const latestIcons = useRef(icons);

  useEffect(() => {
    let instance: MapLibre;
    try {
      instance = new MapLibre({
        container: container.current!,
        style: styles[scheme],
        center,
        zoom,
        scrollZoom: false,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    let removed = false;
    instance.on('load', async () => {
      instance.addSource('points', { type: 'geojson', data: latestData.current });
      instance.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        filter: ['!', ['get', 'hasIcon']],
        paint: {
          'circle-radius': 4,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': 1,
          'circle-stroke-color': scheme === 'dark' ? '#131928' : '#FFFFFF',
        },
      });

      const iconSet = Object.entries(latestIcons.current ?? {});
      if (iconSet.length === 0) return;
      const images = await Promise.all(iconSet.map(([, icon]) => rasterize(icon, ICON_PIXEL_RATIO)));
      if (removed) return;
      iconSet.forEach(([key], i) => instance.addImage(key, images[i], { pixelRatio: ICON_PIXEL_RATIO }));
      instance.addLayer({
        id: 'icons',
        type: 'symbol',
        source: 'points',
        filter: ['get', 'hasIcon'],
        layout: {
          'icon-image': ['get', 'meaning'],
          'icon-rotate': ['get', 'rotate'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });
    });
    map.current = instance;
    return () => {
      removed = true;
      instance.remove();
      map.current = null;
    };
  }, [scheme]);

  useEffect(() => {
    latestData.current = data;
    (map.current?.getSource('points') as GeoJSONSource | undefined)?.setData(data);
  }, [data]);

  return (
    <Box ref={container} h={height} bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8, overflow: 'hidden' }}>
      {failed && (
        <Center h="100%">
          <Text size="sm" c="dimmed">
            Map unavailable (WebGL is disabled in this browser)
          </Text>
        </Center>
      )}
    </Box>
  );
}
