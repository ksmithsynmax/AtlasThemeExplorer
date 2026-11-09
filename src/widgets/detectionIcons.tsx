import { Box } from '@mantine/core';
import ais from '../assets/maritime/ais.svg';
import dark from '../assets/maritime/dark.svg';
import light from '../assets/maritime/light.svg';
import similarBase from '../assets/maritime/similar-base.svg';
import similarGlyph from '../assets/maritime/similar-glyph.svg';
import spoofedPosition from '../assets/maritime/spoofed-position.svg';
import spoofingShip from '../assets/maritime/spoofing-ship.svg';
import stsArrow from '../assets/maritime/sts-arrow.svg';
import unattributedBase from '../assets/maritime/unattributed-base.svg';
import unattributedGlyph from '../assets/maritime/unattributed-glyph.svg';
import zombie from '../assets/maritime/zombie.svg';
import battery from '../assets/energy/battery.svg';
import compressorStation from '../assets/energy/compressor-station.svg';
import datacenter from '../assets/energy/datacenter.svg';
import fracCrew from '../assets/energy/frac-crew.svg';
import naturalGas from '../assets/energy/gas.svg';
import liquefaction from '../assets/energy/liquefaction.svg';
import lng from '../assets/energy/lng.svg';
import regasification from '../assets/energy/regasification.svg';
import solar from '../assets/energy/solar.svg';
import well from '../assets/energy/well.svg';
import wind from '../assets/energy/wind.svg';
import { detectionHexes } from '../tokens/palettes';

/** An SVG layer at its natural size, positioned relative to the icon box (Figma geometry). */
interface ImageLayer {
  kind: 'image';
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RectLayer {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
}

type Layer = ImageLayer | RectLayer;

export interface DetectionIcon {
  w: number;
  h: number;
  layers: Layer[];
  /** Ship silhouettes point along the vessel's heading; markers stay upright. */
  rotates?: boolean;
}

const OUTLINE = '#111326';

const ship = (src: string, ...extra: Layer[]): DetectionIcon => ({
  w: 11.647,
  h: 20,
  layers: [{ kind: 'image', src, x: -0.75, y: -0.95, w: 13.1472, h: 21.6991 }, ...extra],
  rotates: true,
});

const shipToShip = (fill: string): DetectionIcon => ({
  w: 18,
  h: 18,
  layers: [
    { kind: 'rect', x: 0.47, y: 0.47, w: 8.526, h: 17.053, fill },
    { kind: 'rect', x: 9, y: 0.47, w: 8.526, h: 17.053, fill },
    { kind: 'rect', x: 0, y: 0, w: 18, h: 18, stroke: OUTLINE, strokeWidth: 1.5 },
    { kind: 'image', src: stsArrow, x: 5.85, y: 4.85, w: 6.675, h: 8.30955 },
  ],
});

/** SynMax Detections, Default state (Figma node 107:36). */
export const detectionIcons: Record<string, DetectionIcon> = {
  ais: ship(ais),
  light: ship(light),
  dark: ship(dark),
  unattributed: ship(unattributedBase, {
    kind: 'image',
    src: unattributedGlyph,
    x: 2.55,
    y: 8.25,
    w: 6.96819,
    h: 8.56364,
  }),
  spoofedPosition: {
    w: 18,
    h: 18,
    layers: [{ kind: 'image', src: spoofedPosition, x: -1.06, y: -1.06, w: 20.1218, h: 20.1218 }],
  },
  spoofingShip: ship(spoofingShip),
  stsAis: shipToShip(detectionHexes.detAis),
  sts: shipToShip(detectionHexes.detSts),
  similar: ship(similarBase, { kind: 'image', src: similarGlyph, x: 3.07, y: 7.25, w: 5.5, h: 9.75 }),
  zombie: ship(zombie),
};

const glyph = (src: string): DetectionIcon => ({
  w: 20,
  h: 20,
  layers: [{ kind: 'image', src, x: 0, y: 0, w: 20, h: 20 }],
});

/** Hyperion legend shapes (Figma node 142:77, Data type icons). */
export const hyperionIcons: Record<string, DetectionIcon> = {
  hypWell: glyph(well),
  hypRig: {
    w: 20,
    h: 20,
    layers: [{ kind: 'rect', x: 3.75, y: 3.75, w: 12.5, h: 12.5, radius: 1.25, fill: detectionHexes.hypRig }],
  },
  hypFrac: glyph(fracCrew),
};

/** Vulcan infrastructure glyphs (Figma node 142:77, Data type icons). */
export const vulcanIcons: Record<string, DetectionIcon> = {
  solar: glyph(solar),
  naturalGas: glyph(naturalGas),
  wind: glyph(wind),
  battery: glyph(battery),
  lng: glyph(lng),
  compressor: glyph(compressorStation),
  datacenter: glyph(datacenter),
  regasification: glyph(regasification),
  liquefaction: glyph(liquefaction),
};

/** Renders an icon in the DOM, e.g. for legends. */
export function DetectionIconView({ icon }: { icon: DetectionIcon }) {
  return (
    <Box pos="relative" w={icon.w} h={icon.h} style={{ flexShrink: 0 }}>
      {icon.layers.map((l, i) =>
        l.kind === 'image' ? (
          <img
            key={i}
            src={l.src}
            alt=""
            style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, maxWidth: 'none' }}
          />
        ) : (
          <Box
            key={i}
            pos="absolute"
            left={l.x}
            top={l.y}
            w={l.w}
            h={l.h}
            style={{
              background: l.fill,
              borderRadius: l.radius,
              border: l.stroke ? `${l.strokeWidth}px solid ${l.stroke}` : undefined,
            }}
          />
        ),
      )}
    </Box>
  );
}

const PAD = 2;
const loaded = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string) {
  if (!loaded.has(src)) {
    const img = new Image();
    img.src = src;
    loaded.set(src, img.decode().then(() => img));
  }
  return loaded.get(src)!;
}

/** Rasterizes an icon for MapLibre's `addImage`. */
export async function rasterize(icon: DetectionIcon, pixelRatio: number): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((icon.w + PAD * 2) * pixelRatio);
  canvas.height = Math.ceil((icon.h + PAD * 2) * pixelRatio);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(pixelRatio, pixelRatio);
  ctx.translate(PAD, PAD);
  for (const l of icon.layers) {
    if (l.kind === 'image') {
      ctx.drawImage(await loadImage(l.src), l.x, l.y, l.w, l.h);
    } else {
      if (l.fill) {
        ctx.fillStyle = l.fill;
        ctx.beginPath();
        ctx.roundRect(l.x, l.y, l.w, l.h, l.radius ?? 0);
        ctx.fill();
      }
      if (l.stroke && l.strokeWidth) {
        const inset = l.strokeWidth / 2;
        ctx.strokeStyle = l.stroke;
        ctx.lineWidth = l.strokeWidth;
        ctx.strokeRect(l.x + inset, l.y + inset, l.w - l.strokeWidth, l.h - l.strokeWidth);
      }
    }
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
