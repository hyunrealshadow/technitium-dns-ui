// Utility functions
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

// Helper function to get color from color map
export function getLabelColor(
  label: string,
  index: number,
  colorMap: Record<string, string> | string[]
) {
  if (Array.isArray(colorMap)) {
    return colorMap[index];
  }
  return colorMap?.[label];
}
