function hexToRgb(hex) {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned.slice(0, 6), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const R = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const G = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const B = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

const lightSurfaces = {
  background: '#ffffff',
  backgroundElement: '#F0F0F3',
  card: '#FFFFFF',
  cardMuted: '#F7F7F9',
};

const darkSurfaces = {
  background: '#000000',
  backgroundElement: '#212225',
  card: '#1C1D20',
  cardMuted: '#17181A',
};

const lightTokens = {
  text: '#000000',
  textSecondary: '#60646C',
  accent: '#0152F5',
  danger: '#C8252C',
  success: '#0B7252',
  warning: '#96520B',
  info: '#026AA7',
};

const darkTokens = {
  text: '#ffffff',
  textSecondary: '#B0B4BA',
  accent: '#5AB4FF',
  danger: '#FF6B6B',
  success: '#34D399',
  warning: '#F59E0B',
  info: '#38BDF8',
};

const brandDeep = '#00109D';
const brandTokens = {
  onBrand: '#FFFFFF',
  successOnBrand: '#34D399',
  warningOnBrand: '#FBBF24',
  dangerOnBrand: '#F87171',
  infoOnBrand: '#38BDF8',
  accentOnBrand: '#14E7FD',
};

const colorPairs = [];

// Light Mode Surfaces
Object.entries(lightSurfaces).forEach(([surfName, surfHex]) => {
  Object.entries(lightTokens).forEach(([tokName, tokHex]) => {
    colorPairs.push({
      Mode: 'Light',
      Context: `${tokName} on ${surfName}`,
      Text: tokHex,
      Surface: surfHex,
      Min: 4.5,
    });
  });
});

// Dark Mode Surfaces
Object.entries(darkSurfaces).forEach(([surfName, surfHex]) => {
  Object.entries(darkTokens).forEach(([tokName, tokHex]) => {
    colorPairs.push({
      Mode: 'Dark',
      Context: `${tokName} on ${surfName}`,
      Text: tokHex,
      Surface: surfHex,
      Min: 4.5,
    });
  });
});

// On Brand.deep (#00109D) Hero Tokens
Object.entries(brandTokens).forEach(([tokName, tokHex]) => {
  colorPairs.push({
    Mode: 'Both',
    Context: `${tokName} on Brand.deep (#00109D)`,
    Text: tokHex,
    Surface: brandDeep,
    Min: 4.5,
  });
});

let failed = false;
const tableData = colorPairs.map((p) => {
  const ratio = contrastRatio(p.Text, p.Surface);
  const passed = ratio >= p.Min;
  if (!passed) failed = true;
  return {
    Mode: p.Mode,
    Context: p.Context,
    Foreground: p.Text,
    Background: p.Surface,
    Ratio: `${ratio.toFixed(2)}:1`,
    Required: `>= ${p.Min}:1`,
    Status: passed ? 'PASS' : 'FAIL',
  };
});

console.log('=== EXTENDED WCAG 2.1 CONTRAST RATIO CHECK ===\n');
console.table(tableData);

if (failed) {
  console.error('\nContrast check failed! One or more color pairs do not meet WCAG AA requirements.');
  process.exit(1);
} else {
  console.log('\nAll color pairs pass WCAG 2.1 AA requirements!');
}
