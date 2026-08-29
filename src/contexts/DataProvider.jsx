import { useCallback, useMemo } from 'react';
import { DataContext } from './DataContext';
import {
  fetchAllData,
  editMaster,
  addSalur,
  addMaster,
  editSalur,
  deleteMaster as requestDeleteMaster,
  deleteSalur as requestDeleteSalur
} from '../services/api';
import useCache from '../hooks/useCache';

const EMPTY_LIST = [];
const EMPTY_REF_DATA = { asnaf: EMPTY_LIST, program: EMPTY_LIST, daerah: EMPTY_LIST };

export const DataProvider = ({ children }) => {
  const { data, loading, error, invalidateCache } = useCache('app-data', fetchAllData);

  const refreshData = useCallback(() => invalidateCache(), [invalidateCache]);

  const updateMaster = useCallback(async (idPm, updatedFields) => {
    const result = await editMaster(idPm, updatedFields);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const createSalur = useCallback(async (payload) => {
    const result = await addSalur(payload);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const createMaster = useCallback(async (payload) => {
    const result = await addMaster(payload);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const updateSalur = useCallback(async (payload) => {
    const result = await editSalur(payload);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const deleteMaster = useCallback(async (idPm) => {
    const result = await requestDeleteMaster(idPm);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const deleteSalur = useCallback(async (idSalur) => {
    const result = await requestDeleteSalur(idSalur);
    if (result.success) await refreshData();
    return result;
  }, [refreshData]);

  const masterData = data?.master || EMPTY_LIST;
  const salurData = data?.salur || EMPTY_LIST;
  const refData = data?.ref || EMPTY_REF_DATA;

  const contextValue = useMemo(() => ({
    masterData,
    salurData,
    refData,
    loading,
    error,
    refreshData,
    updateMaster,
    createSalur,
    createMaster,
    updateSalur,
    deleteMaster,
    deleteSalur
  }), [masterData, salurData, refData, loading, error, refreshData, updateMaster, createSalur, createMaster, updateSalur, deleteMaster, deleteSalur]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
