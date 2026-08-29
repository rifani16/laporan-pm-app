import { useReducer, useEffect, useCallback } from 'react';

const CACHE_TTL = 30 * 60 * 1000; // 30 menit (lebih lama)
const initialRequests = new Map();

const initialState = { data: null, loading: true, error: null };

function cacheReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { data: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function fetchInitialData(key, fetcher) {
  if (!initialRequests.has(key)) {
    const request = Promise.resolve()
      .then(fetcher)
      .finally(() => initialRequests.delete(key));
    initialRequests.set(key, request);
  }
  return initialRequests.get(key);
}

export default function useCache(key, fetcher) {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  const { data, loading, error } = state;

  const loadData = useCallback(async (force = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!force) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, value } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              dispatch({ type: 'SET_DATA', payload: value });
              return;
            }
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
      // Deduplikasi request awal yang dijalankan dua kali oleh StrictMode.
      // Refresh paksa tetap selalu mengambil data terbaru.
      const fresh = force ? await fetcher() : await fetchInitialData(key, fetcher);
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value: fresh }));
      dispatch({ type: 'SET_DATA', payload: fresh });
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      dispatch({ type: 'SET_ERROR', payload: err });
    }
  }, [key, fetcher]);

  const invalidateCache = useCallback(() => loadData(true), [loadData]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setData = useCallback((newData) => {
    dispatch({ type: 'SET_DATA', payload: newData });
  }, []);

  return { data, loading, error, setData, invalidateCache };
}
