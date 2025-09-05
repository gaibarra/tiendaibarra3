
export function getContrastColor(hexColor: string): 'black' | 'white' {
  if (hexColor.startsWith('#')) {
    hexColor = hexColor.slice(1);
  }

  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(char => char + char).join('');
  }

  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Formula from W3C
  const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
  
  return (brightness > 125) ? 'black' : 'white';
}
