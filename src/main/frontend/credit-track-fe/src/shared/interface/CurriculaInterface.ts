export interface CurriculaInterface {
  id: number;
  programTitle: string;
  programCode: string;
  year: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  preRequisite?: string;
  lec: number;
  lab: number;
  units: number;
}