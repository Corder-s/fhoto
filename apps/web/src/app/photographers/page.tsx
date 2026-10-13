import { redirect } from 'next/navigation';

/**
 * The photographer directory is served by /explore, which lists live, approved
 * photographers from the database. This page previously rendered static sample
 * profiles, so it now forwards to the live catalogue (query string preserved).
 */
export default function PhotographersDirectoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (typeof value === 'string') params.set(key, value);
    else if (Array.isArray(value) && value.length > 0) params.set(key, value[0]);
  }
  const qs = params.toString();
  redirect(qs ? `/explore?${qs}` : '/explore');
}
