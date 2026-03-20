import { useState } from 'react';
import { updateStorageValue } from './sessionStorage';

interface UserFilters {
  searchText: string;
  roleId: string | null;
  programId: string | null;
  sortField: string[];
  sortDirection: string[];
  pageSize: number;
  page: number;
}

export const useUserFilters = () => {
  const getFiltersFromLocalStorage = (): UserFilters => {
    const filters = sessionStorage.getItem("users");
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return {
      searchText: parsedFilters.searchText || "",
      roleId: parsedFilters.roleId || null,
      programId: parsedFilters.programId || null,
      sortField: Array.isArray(parsedFilters.sortField) ? parsedFilters.sortField : [],
      sortDirection: Array.isArray(parsedFilters.sortDirection) ? parsedFilters.sortDirection : [],
      pageSize: parsedFilters.pageSize || 10,
      page: parsedFilters.page || 0,
    }
  }

  const [filters, setFilters] = useState<UserFilters>(() => getFiltersFromLocalStorage());
  const updateFilters = updateStorageValue(setFilters, "users");
  
  const batchUpdateFilters = (updates: Partial<UserFilters>) => {
    setFilters((prev: any) => {
      const updatedFilters = { ...prev, ...updates };
      sessionStorage.setItem("users", JSON.stringify(updatedFilters));
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
