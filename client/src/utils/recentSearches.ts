const RECENT_SEARCHES_KEY = 'noteeye_recent_searches';

export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (query: string): string[] => {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();
  try {
    const current = getRecentSearches();
    const updated = [
      trimmed,
      ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 10);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const removeRecentSearch = (queryToRemove: string): string[] => {
  try {
    const current = getRecentSearches();
    const updated = current.filter(
      (item) => item.toLowerCase() !== queryToRemove.toLowerCase()
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};
