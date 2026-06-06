import { useReducer, useEffect, useCallback } from 'react';

const CACHE_TTL = 30 * 60 * 1000; // 30 menit (lebih lama)

const initialState = { data: null, loading: true };

function cacheReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { data: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export default function useCache(key, fetcher) {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  const { data, loading } = state;

  const loadData = useCallback(async (force = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!force) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp, value } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            dispatch({ type: 'SET_DATA', payload: value });
            return;
          }
        }
      }
      const fresh = await fetcher();
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value: fresh }));
      dispatch({ type: 'SET_DATA', payload: fresh });
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
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

  return { data, loading, setData, invalidateCache };
}