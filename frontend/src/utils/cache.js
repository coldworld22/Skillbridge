export async function clearCache() {
  try {
    const res = await fetch('/api/admin/cache/clear', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to clear cache');
    return true;
  } catch (err) {
    console.error('Failed to clear cache', err);
    return false;
  }
}
