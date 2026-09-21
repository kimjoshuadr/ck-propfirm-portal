/*
 * Icon set — the same paths the static shell uses, kept as data so components
 * never repeat SVG markup. Rendered through AppIcon via v-html.
 */

export const PATHS = {
  overview: '<rect x="3" y="3" width="7.5" height="9.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.8"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.8"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.8"/>',
  accounts: '<rect x="2.5" y="5" width="19" height="14" rx="2.4"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
  market: '<path d="M3 17.5l4.6-5.2 3.4 3L21 6"/><path d="M15 6h6v6"/>',
  payouts: '<path d="M3 7.6A2.6 2.6 0 0 1 5.6 5H18a2 2 0 0 1 2 2v1.2"/><rect x="3" y="7.4" width="18" height="11.6" rx="2.6"/><path d="M16 12.6h2.6"/>',
  leaderboard: '<path d="M5 20V11"/><path d="M12 20V4.5"/><path d="M19 20v-6.5"/>',
  trophy: '<path d="M8 4h8v5.2a4 4 0 0 1-8 0z"/><path d="M8 5.2H5.4a2.6 2.6 0 0 0 2.6 5.2"/><path d="M16 5.2h2.6a2.6 2.6 0 0 1-2.6 5.2"/><path d="M12 13.2V16"/><path d="M8.6 20h6.8l-.6-2.6H9.2z"/>',
  sizer: '<path d="M4 20L20 4"/><path d="M4 14.2V20h5.8"/><path d="M14.2 4H20v5.8"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M3 12h2.4M18.6 12H21M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.4"/><circle cx="12" cy="17.3" r=".7" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8L20 20"/>',
  bell: '<path d="M18 9.2a6 6 0 0 0-12 0c0 5-2.1 6.2-2.1 6.2h16.2S18 14.2 18 9.2"/><path d="M10.4 19.4a1.9 1.9 0 0 0 3.2 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronDown: '<path d="M6 9.5l6 6 6-6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9.5 6l6 6-6 6"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><path d="M9.4 12.1l1.9 1.9 3.4-3.6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5"/><circle cx="12" cy="7.9" r=".95" fill="currentColor" stroke="none"/>',
  play: '<circle cx="12" cy="12" r="8.6"/><path d="M10.3 8.5l5.4 3.5-5.4 3.5z"/>',
  eyeOff: '<path d="M4 4l16 16"/><path d="M9.6 9.6a3 3 0 0 0 4.2 4.2"/><path d="M6.3 6.6C4.1 8.2 2.6 12 2.6 12s3.8 6.2 9.4 6.2c1.6 0 3-.4 4.2-1.1"/><path d="M18.6 15.3c1.7-1.5 2.8-3.3 2.8-3.3S17.6 5.8 12 5.8c-.7 0-1.4.1-2 .3"/>',
  coin: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.3"/>',
  headset: '<path d="M4.6 13.4v-1.9a7.4 7.4 0 0 1 14.8 0v1.9"/><rect x="3" y="12.8" width="4.4" height="6.4" rx="2"/><rect x="16.6" y="12.8" width="4.4" height="6.4" rx="2"/><path d="M19 19.2v.4a2.6 2.6 0 0 1-2.6 2.6H13"/>',
  refresh: '<path d="M20 11.5a8 8 0 1 0-2.4 5.8"/><path d="M20 5.5v6h-6"/>',
  eye: '<path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.9"/>',
  lock: '<rect x="4.5" y="10.4" width="15" height="10.1" rx="2.4"/><path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4"/>',
  crown: '<path d="M3.6 17.4h16.8l-1.5-8.6-4.4 3.4L12 5.6 9.5 12.2 5.1 8.8z"/>',
  zoomIn: '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8L20 20"/><path d="M11 8.8v4.4M8.8 11h4.4"/>',
  zoomOut: '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8L20 20"/><path d="M8.8 11h4.4"/>',
  percent: '<path d="M5.5 18.5L18.5 5.5"/><circle cx="7.6" cy="7.6" r="2.1"/><circle cx="16.4" cy="16.4" r="2.1"/>',
  fit: '<path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9"/><path d="M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9"/><path d="M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15"/><path d="M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15"/>',
  candles: '<path d="M7.5 4v16M16.5 4v16"/><rect x="5.3" y="7.5" width="4.4" height="7" rx="1"/><rect x="14.3" y="10.5" width="4.4" height="6" rx="1"/>',
  layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',
  alert: '<path d="M12 4.2l8.6 15.3H3.4z"/><path d="M12 10v4.4"/><circle cx="12" cy="17.2" r=".7" fill="currentColor" stroke="none"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/>',
  link: '<path d="M10.2 13.8a4 4 0 0 1 0-5.6l2.2-2.2a4 4 0 0 1 5.6 5.6l-1 1"/><path d="M13.8 10.2a4 4 0 0 1 0 5.6l-2.2 2.2a4 4 0 0 1-5.6-5.6l1-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 4v10"/><path d="M8 11l4 4 4-4"/><path d="M5 19h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5.5 15V5.5A2.5 2.5 0 0 1 8 3h6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5"/>',
  spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  book: '<path d="M5 4h8.5A2.5 2.5 0 0 1 16 6.5V20H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M19 6.5h-3v13.5h-1"/>',
  arrowUp: '<path d="M12 19.5V5"/><path d="M6.5 10.5L12 5l5.5 5.5"/>',
  arrowDown: '<path d="M12 4.5V19"/><path d="M17.5 13.5L12 19l-5.5-5.5"/>',
  calculator: '<rect x="4.5" y="3" width="15" height="18" rx="2.4"/><path d="M8 7.5h8"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>',
  wallet: '<path d="M3 7.6A2.6 2.6 0 0 1 5.6 5H18a2 2 0 0 1 2 2v1.2"/><rect x="3" y="7.4" width="18" height="11.6" rx="2.6"/><path d="M16 12.6h2.6"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4a13 13 0 0 1 0 17.2 13 13 0 0 1 0-17.2z"/>',
  /* Device glyphs for the downloads rows: plain shapes, not vendor logos, so
     no one else's mark ends up in our interface. */
  monitor: '<rect x="3" y="4.4" width="18" height="12" rx="2.2"/><path d="M9.2 20h5.6"/><path d="M12 16.6V20"/>',
  phone: '<rect x="7.2" y="2.8" width="9.6" height="18.4" rx="2.6"/><path d="M11 5.6h2"/><circle cx="12" cy="18.1" r=".9" fill="currentColor" stroke="none"/>',
  wrench: '<path d="M15.3 4.5a4 4 0 0 0-4.7 5L4 16.1V20h3.9l6.6-6.6a4 4 0 0 0 5-4.7l-2.5 2.5-2.4-.5-.5-2.4z"/>',
  users: '<circle cx="9" cy="9" r="3.2"/><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0"/><path d="M16 6.3a3 3 0 0 1 0 5.5"/><path d="M17.4 14.4A5.2 5.2 0 0 1 20.4 19"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 9.6h17"/><path d="M8 3.4v3.2M16 3.4v3.2"/>',
  star: '<path d="M12 3.6l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8z"/>',
  certificate: '<circle cx="12" cy="9.4" r="5.4"/><path d="M9.3 14.1 8.2 20.9l3.8-2.1 3.8 2.1-1.1-6.8"/>',
  moon: '<path d="M20.2 13.6A8.2 8.2 0 0 1 10.4 3.8 8.3 8.3 0 1 0 20.2 13.6z"/>',
  link2: '<path d="M9.6 14.4 14.4 9.6"/><path d="M11.4 6.2l1.6-1.6a4 4 0 0 1 5.6 5.6l-1.6 1.6"/><path d="M12.6 17.8l-1.6 1.6a4 4 0 0 1-5.6-5.6l1.6-1.6"/>',
  rocket: '<path d="M13.4 3.8c2.7 0 4.5 1.8 4.5 4.5 0 3.3-3.9 7-6.3 8.8l-1.1-3.3-3.3-1.1c1.8-2.4 5.5-6.3 6.2-8.9z"/><circle cx="15" cy="7.7" r="1.15"/><path d="M9.5 14.6 6.7 17.4"/><path d="M6.5 12.6 4.3 13.2l2.5 2.5.6-2.2"/>',
}

export function iconSvg(name, size = 18) {
  const d = PATHS[name] || PATHS.spark
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
}
