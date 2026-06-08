import { useState, useEffect } from 'react';
import { DataContext } from './DataContext';
import { fetchAllData, editMaster, addSalur, addMaster } from '../services/api';
import useCache from '../hooks/useCache';
import { editSalur } from '../services/api';

export const DataProvider = ({ children }) => {
  const { data, invalidateCache } = useCache('app-data', fetchAllData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await data;
      setLoading(false);
    };
    load();
  }, [data]);

  const refreshData = async () => {
    setLoading(true);
    await invalidateCache(); // ini akan memanggil loadData(true) di useCache
    setLoading(false);
  };

  const updateMaster = async (idPm, updatedFields) => {
    const result = await editMaster(idPm, updatedFields);
    if (result.success) await refreshData();
    return result;
  };

  const createSalur = async (payload) => {
    const result = await addSalur(payload);
    if (result.success) await refreshData();
    return result;
  };

  const createMaster = async (payload) => {
    const result = await addMaster(payload);
    if (result.success) await refreshData();
    return result;
  };

  const updateSalur = async (payload) => {
    const result = await editSalur(payload);
    if (result.success) await refreshData();
    return result;
  };

  const masterData = data?.master || [];
  const salurData = data?.salur || [];
  const refData = data?.ref || { asnaf: [], program: [], daerah: [] };

  const contextValue = {
    masterData,
    salurData,
    refData,
    loading,
    refreshData,
    updateMaster,
    createSalur,
    createMaster,
    updateSalur
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};