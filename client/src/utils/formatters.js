/** "Radhika Sharma" → "RS" */
export function getInitials(name = '') {
  return name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
