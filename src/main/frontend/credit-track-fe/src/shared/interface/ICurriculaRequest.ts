export interface ICurriculaRequest {
  programCodes?: string[];
//   isActive?: boolean;
  years?: string[];
  semesters?: string[];
  courseCodes?: string[];
  searchText?: any;
  sortField?: any;
  sortDirection?: any;
  pageSize?: number | null;
  page?: number | null;
}