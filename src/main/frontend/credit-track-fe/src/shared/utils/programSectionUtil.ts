import { College } from "../interface/CourseInterface";
import engineering from "../assets/seals/engineering.png";
import accountancy from "../assets/seals/accountancy.png";
import hospitality from "../assets/seals/hospitality.png";

export const collegesList: College[] = [
  {
    name: "College of Engineering and Computer Technology",
    programs: [
      "Bachelor of Science in Computer Engineering",
      "Bachelor of Science in Electronics Engineering",
      "Bachelor of Science in Information Technology",
    ],
    sealSrc: engineering,
  },
  {
    name: "College of Business and Accountancy",
    programs: [
      "Bachelor of Science in Management Accounting",
      "Bachelor of Science in Business Administration Major in Marketing Management",
    ],
    sealSrc: accountancy,
  },
  {
    name: "College of Hospitality and Tourism Management",
    programs: [
      "Bachelor of Science in Tourism Management Major in Mice Management",
      "Bachelor of Science in Tourism Management Major in Travel Operations",
      "Bachelor of Science in Hospitality Management Major in Hotel and Restaurant Administration",
      "Bachelor of Science in Hospitality Management Major in Cruiseline Operations",
    ],
    sealSrc: hospitality,
  },
];
