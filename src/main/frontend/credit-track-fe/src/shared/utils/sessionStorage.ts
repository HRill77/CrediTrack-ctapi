// use to update saved values in session storage
export const updateStorageValue = (setFilters: any, storage: string) => {
  return (key: string, value: any) =>
    setFilters((prev: any) => {
      const updatedFilters = { ...prev, [key]: value };
      sessionStorage.setItem(storage, JSON.stringify(updatedFilters));
      return updatedFilters;
    });
};