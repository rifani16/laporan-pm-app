import { useMemo } from 'react';
import { DataContext } from './DataContext';
import * as api from '../services/api';
import useCache from '../hooks/useCache';

const EMPTY_LIST = [];
const EMPTY_REF_DATA = { asnaf: EMPTY_LIST, program: EMPTY_LIST, daerah: EMPTY_LIST };

export const DataProvider = ({ children }) => {
  const { data, loading, error, invalidateCache } = useCache(api.DATA_CACHE_KEY, api.fetchAllData);

  const actions = useMemo(() => {
    // Jalankan mutasi, lalu muat ulang data bila berhasil.
    const withRefresh = (request) => async (...args) => {
      const result = await request(...args);
      if (result.success) await invalidateCache();
      return result;
    };

    return {
      refreshData: invalidateCache,
      updateMaster: withRefresh(api.editMaster),
      createMaster: withRefresh(api.addMaster),
      deleteMaster: withRefresh(api.deleteMaster),
      createSalur: withRefresh(api.addSalur),
      updateSalur: withRefresh(api.editSalur),
      deleteSalur: withRefresh(api.deleteSalur),
      createProgram: withRefresh(api.addProgram),
      updateProgram: withRefresh(api.editProgram),
      deleteProgram: withRefresh(api.deleteProgram)
    };
  }, [invalidateCache]);

  const masterData = data?.master || EMPTY_LIST;
  const salurData = data?.salur || EMPTY_LIST;
  const refData = data?.ref || EMPTY_REF_DATA;

  const contextValue = useMemo(() => ({
    masterData,
    salurData,
    refData,
    loaded: data != null,
    loading,
    error,
    ...actions
  }), [masterData, salurData, refData, data, loading, error, actions]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
