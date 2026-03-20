export interface IFilterRequest {
  searchText?: string;
//   isActive?: boolean;
  roleId?: number | null;
  programId?: number | null;
  sortField?: any;
  sortDirection?: any;
  pageSize?: number | null;
  page?: number | null;
}