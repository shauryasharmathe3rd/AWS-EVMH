/**
 * Contrast Ratio Checker for Tript-Dhara UI Spec
 * Verifies WCAG AA (>= 4.5:1) for all allowed text/background combinations.
 */

const PALETTE = {
  Cream: '#F5ECDC',
  Latte: '#D9C3A0',
  Mocha: '#8B5E3C',
  Espresso: '#2E1F14',
};

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const ALLOWED_PAIRS = [
  { text: 'Espresso', bg: 'Cream', name: 'Primary Text in Light Mode' },
  { text: 'Cream', bg: 'Espresso', name: 'Primary Text in Dark Mode' },
  { text: 'Espresso', bg: 'Latte', name: 'Dark text on Latte / Buttons in Dark Mode' },
  { text: 'Cream', bg: 'Mocha', name: 'Light text on Mocha / Buttons in Light Mode' },
];

console.log("=== Checking WCAG AA (4.5:1) Contrast Ratios ===");
let failed = false;

for (const pair of ALLOWED_PAIRS) {
  const ratio = getContrastRatio(PALETTE[pair.text], PALETTE[pair.bg]);
  const status = ratio >= 4.5 ? "PASS" : "FAIL";
  console.log(`[${status}] ${pair.name} (${pair.text} on ${pair.bg}): ${ratio.toFixed(2)}:1 (Min 4.5:1 required)`);
  if (ratio < 4.5) failed = true;
}

if (failed) {
  console.error("\n❌ Contrast check failed: Some pairs violate WCAG AA!");
  process.exit(1);
} else {
  console.log("\n✅ All approved UI color pairs strictly meet or exceed WCAG AA 4.5:1 standards.");
}
