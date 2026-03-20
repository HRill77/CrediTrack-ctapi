import { useState } from 'react';
import { updateStorageValue } from './sessionStorage';

interface EvaluationFilters {
  searchText: string;
  studentName: string;
  fromUniversity: string;
  toProgram: string;
  sortField?: any;
  sortDirection?: any;
  pageSize: number;
  page: number;
}

export const useEvaluationFilters = () => {
  const getFiltersFromLocalStorage = (): EvaluationFilters => {
    const filters = sessionStorage.getItem("evaluationsFilters");
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return {
      searchText: parsedFilters.searchText || "",
      studentName: parsedFilters.studentName || '',
      fromUniversity: parsedFilters.fromUniversity || '',
      toProgram: parsedFilters.toProgram || '',
      sortField: Array.isArray(parsedFilters.sortField) ? parsedFilters.sortField : [],
      sortDirection: Array.isArray(parsedFilters.sortDirection) ? parsedFilters.sortDirection : [],
      pageSize: parsedFilters.pageSize || 10,
      page: parsedFilters.page || 0,
    }
  }
  
  const [filters, setFilters] = useState<EvaluationFilters>(() => getFiltersFromLocalStorage());
  const updateFilters = updateStorageValue(setFilters, "evaluationsFilters");
  
  const batchUpdateFilters = (updates: Partial<EvaluationFilters>) => {
    setFilters((prev: any) => {
      const updatedFilters = { ...prev, ...updates };
      sessionStorage.setItem("evaluations", JSON.stringify(updatedFilters));
      return updatedFilters;
    });
  };
  
  return {
    filters,
    setFilters,
    updateFilters,
    batchUpdateFilters,
    getFiltersFromLocalStorage
  };
};