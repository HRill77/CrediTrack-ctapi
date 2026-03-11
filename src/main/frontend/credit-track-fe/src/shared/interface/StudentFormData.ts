import dayjs from "dayjs";

export interface StudentFormData {
  firstname: string;
  middlename: string;
  lastname: string;
  suffix: string;
  email: string;
  // phone: string;
  // address: string;
  yearLevel: string;
  // dob: dayjs.Dayjs | null;
}




export interface StudentFormDataRequest {
  firstname: string;
  middlename: string;
  lastname: string;
  suffix: string;
  email: string;
  // phone: string;
  // address: string;
  yearLevel: string;
  // dob: String| null;
   fromUniversity: string;
  fromCollege: string;
  fromProgram: string;
  toUniversity: string;
  toCollege: string;
  toProgram: string;
}