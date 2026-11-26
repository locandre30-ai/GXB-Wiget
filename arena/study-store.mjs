export const CATEGORIES = ['Market fundamentals', 'Chart reading', 'Market structure', 'Support and resistance', 'Entries and exits', 'Risk management', 'Gold', 'Stocks and ETFs', 'Cryptocurrency', 'Trading psychology', 'GxB Original Sessions'];
export const VIDEO_MARKETS = ['General', 'Gold', 'Stocks & ETFs', 'Cryptocurrency'];
export const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];
export const LESSONS = ['Meet the market', 'Read the trend', 'Understand pullbacks', 'Define risk', 'Practice entries', 'Manage exits', 'Review a session'];
export const DRILLS = ['Trend Confirmation', 'Continuation Recognition', 'Entries', 'Exits', 'Avoiding Chase Trades'];
const idPattern = /^[a-z0-9-]{1,75}$/i;
const clip = (value, size) => typeof value === 'string' ? value.trim().slice(0, size) : '';

export function youtubeId(value) {
  try {
    const input = value.trim();
    const source = input.startsWith('<') ? input.match(/^<iframe\b[^>]*?\s+src\s*=\s*(["'])([^"'<>]+)\1/i)?.[2] : input;
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let id;
    if (url.hostname === 'youtu.be' && /^\/[^/]+$/.test(url.pathname)) id = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else id = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)$/)?.[1];
    }
    if (url.hostname === 'www.youtube-nocookie.com') id = url.pathname.match(/^\/embed\/([^/]+)$/)?.[1];
    return /^[\w-]{11}$/.test(id ?? '') ? id : null;
  } catch { return null; }
}

export function cleanVideo(raw) {
  const videoId = youtubeId(raw?.url);
  const title = clip(raw?.title, 120), educator = clip(raw?.educator, 100);
  if (!idPattern.test(raw?.id ?? '') || !videoId || !title || !educator || !CATEGORIES.includes(raw.category)) return null;
  return {
    id: raw.id, title, educator, url: 'https://www.youtube.com/watch?v=' + videoId,
    thumbnail: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
    description: clip(raw.description, 800), duration: clip(raw.duration, 24),
    category: raw.category, market: VIDEO_MARKETS.includes(raw.market) ? raw.market : 'General',
    difficulty: LEVELS.includes(raw.difficulty) ? raw.difficulty : 'All levels',
    lesson: LESSONS.includes(raw.lesson) ? raw.lesson : '',
    practice: DRILLS.includes(raw.practice) ? raw.practice : '',
    source: raw.category === 'GxB Original Sessions' ? 'gxb' : 'educator',
    archived: raw.archived === true
  };
}

export function cleanStudy(raw) {
  const videos = [], customReflections = [], entries = {};
  const added = new Set();
  for (const value of Array.isArray(raw?.videos) ? raw.videos.slice(0, 200) : []) {
    const video = cleanVideo(value);
    if (video && !added.has(video.id)) { videos.push(video); added.add(video.id); }
  }
  const reflectionIds = new Set();
  for (const item of Array.isArray(raw?.customReflections) ? raw.customReflections.slice(0, 100) : []) {
    const text = clip(item?.text, 240);
    if (!text || !idPattern.test(item?.id ?? '') || reflectionIds.has(item.id)) continue;
    customReflections.push({ id: item.id, text, audio: null });
    reflectionIds.add(item.id);
  }
  const validKey = key => /^(video|archive|knowledge|reflection):[a-z0-9-]{1,75}$/i.test(key);
  for (const [key, value] of Object.entries(raw?.entries ?? {}).slice(0, 500)) {
    if (!validKey(key) || !value || typeof value !== 'object') continue;
    entries[key] = { saved: value.saved === true, watched: value.watched === true, note: clip(value.note, 2500) };
  }
  const recent = Array.isArray(raw?.recent) ? [...new Set(raw.recent.filter(key => typeof key === 'string' && validKey(key)))].slice(0, 30) : [];
  return { videos, entries, recent, customReflections };
}

export function touchStudy(study, key) {
  study.recent = [key, ...study.recent.filter(item => item !== key)].slice(0, 30);
}
