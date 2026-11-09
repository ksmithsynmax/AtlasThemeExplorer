import {
  createTheme,
  NavLink,
  virtualColor,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';
import { onPrimaryColor, type BrandTheme, type PaletteColors } from './brands/brandThemes';
import { blend } from './brands/colorMath';
import { brandColorEntries, detectionPalettes, ramp, type ColorName } from './tokens/palettes';

/** Mantine's dark-mode greys, rebuilt from the palette so borders, inputs and hovers sit on its navy. */
function darkTuple(c: PaletteColors): MantineColorsTuple {
  return [
    c.text,
    blend(c.text, c.textSecondary, 0.5),
    c.textSecondary,
    blend(c.textSecondary, c.surface, 0.55),
    blend(c.text, c.surface, 0.16),
    blend(c.text, c.surface, 0.09),
    blend(c.text, c.surface, 0.04),
    c.background,
    blend('#000000', c.background, 0.25),
    blend('#000000', c.background, 0.5),
  ];
}

function surfaceVars(c: PaletteColors, onPrimary: string) {
  return {
    '--mantine-color-body': c.background,
    '--mantine-color-text': c.text,
    '--mantine-color-dimmed': c.textSecondary,
    '--mantine-color-default-border': 'var(--atlas-border)',
    '--atlas-surface': c.surface,
    '--atlas-on-primary': onPrimary,
  };
}

/** Every brand series token as a virtual color: the light- or dark-mode value per color scheme. */
function brandVirtualColors(brands: BrandTheme[]): Record<string, MantineColorsTuple> {
  const light = new Map(brandColorEntries(brands, 'light'));
  const colors: Record<string, MantineColorsTuple> = {};
  for (const [name, darkHex] of brandColorEntries(brands, 'dark')) {
    colors[`${name}Light`] = ramp(light.get(name)!);
    colors[`${name}Dark`] = ramp(darkHex);
    colors[name] = virtualColor({ name, light: `${name}Light`, dark: `${name}Dark` });
  }
  return colors;
}

export function buildTheme(primaryColor: ColorName, brand: BrandTheme, brands: BrandTheme[]) {
  const light = brand.modes.light;
  const dark = brand.modes.dark;

  const cssVariablesResolver: CSSVariablesResolver = () => ({
    variables: {},
    light: {
      ...surfaceVars(light, onPrimaryColor(brand, 'light')),
      '--mantine-color-default-hover': blend(light.text, light.surface, 0.04),
    },
    dark: surfaceVars(dark, onPrimaryColor(brand, 'dark')),
  });

  return {
    theme: createTheme({
      colors: {
        ...detectionPalettes,
        ...brandVirtualColors(brands),
        dark: darkTuple(dark),
      },
      primaryColor,
      primaryShade: 6,
      autoContrast: true,
      defaultRadius: 'md',
      components: {
        NavLink: NavLink.extend({
          defaultProps: { variant: 'filled' },
          styles: { root: { borderRadius: 'var(--mantine-radius-md)' } },
        }),
      },
    }),
    cssVariablesResolver,
  };
}
