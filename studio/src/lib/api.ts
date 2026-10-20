// API client with an offline fallback. If the FastAPI server is unreachable
// (backend stopped, or the static preview build), responses come from
// snapshot.json, which holds precomputed results for the defaults, the presets
// and common settings. Settings that were not precomputed keep the last result
// on screen and raise a small notice.
import { useEffect, useRef, useState } from 'react';

type Mode = 'live' | 'snapshot' | 'unknown';
let mode: Mode = 'unknown';
const listeners = new Set<(m: Mode) => void>();
const setMode = (m: Mode) => {
  if (m !== mode) {
    mode = m;
    listeners.forEach((l) => l(m));
  }
};
export const useApiMode = () => {
  const [m, setM] = useState<Mode>(mode);
  useEffect(() => {
    listeners.add(setM);
    return () => void listeners.delete(setM);
  }, []);
  return m;
};

// notices for settings that need the live backend
const missListeners = new Set<(msg: string) => void>();
export const onSnapshotMiss = (fn: (msg: string) => void) => {
  missListeners.add(fn);
  return () => void missListeners.delete(fn);
};

/** Stable JSON: object keys sorted, so the snapshot key matches Python's. */
export function canonical(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
const keyOf = (path: string, body?: any) => (body === undefined ? path : path + '|' + canonical(body));

let snapshot: Promise<Record<string, any>> | null = null;
const loadSnapshot = () => {
  if (!snapshot) snapshot = fetch('snapshot.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return snapshot;
};
// Fetch the snapshot as soon as the page loads, so the fallback still works
// even if the server dies mid-demo.
loadSnapshot();

async function fromSnapshot(path: string, body?: any) {
  const snap = await loadSnapshot();
  const v = snap[keyOf(path, body)];
  setMode('snapshot');
  if (v === undefined) {
    missListeners.forEach((l) => l('This setting needs the live Python backend. Run start_dashboard.bat to retrain on demand.'));
    throw new Error('not precomputed: ' + path);
  }
  return v;
}

let offlineUntil = 0;

export async function api<T = any>(path: string, body?: any): Promise<T> {
  if (Date.now() < offlineUntil) return fromSnapshot(path, body) as Promise<T>;
  try {
    const res = await fetch(path.replace(/^\//, ''), {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    setMode('live');
    return json as T;
  } catch (e) {
    offlineUntil = Date.now() + 15000; // retry the live API every 15 s
    return fromSnapshot(path, body) as Promise<T>;
  }
}

/** Fetch whenever `deps` change; keeps the previous data visible while loading. */
export function useApi<T = any>(path: string | null, body?: any, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!path) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    api<T>(path, body)
      .then((d) => id === seq.current && setData(d))
      .catch((e) => id === seq.current && setError(String(e.message || e)))
      .finally(() => id === seq.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(body), ...deps]);
  return { data, loading, error };
}

/** Debounce a value (for sliders that trigger server work). */
export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [JSON.stringify(value), ms]);
  return v;
}
