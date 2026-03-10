import { College } from "../interface/CourseInterface";
import criminology from "../assets/seals/criminology.png";
import engineering from "../assets/seals/engineering.png";
import education from "../assets/seals/education.png";
import medAllied from "../assets/seals/med-allied.png";

export const collegesList: College[] = [
    {
      name: "College of Criminal Justice Education",
      programs: ["Bachelor of Science in Criminology"],
      sealSrc: criminology,
    },
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
      name: "College of Education",
      programs: [
        "Bachelor of Early Childhood Education",
        "Bachelor of Elementary Education",
        "Bachelor of Secondary Education (Major in Sciences, Mathematics, English, Filipino, Values Education, and Social Studies)",
        "Bachelor of Physical Education",
        "Bachelor of Culture and Arts Education",
      ],
      sealSrc: education,
    },
    {
      name: "College of Allied  Medical Sciences",
      programs: [
        "Bachelor of Science in Medical Technology",
        "Bachelor of Science in Pharmacy",
        "Bachelor of Science in Physical Therapy",
        "Bachelor of Science in Radiologic Technology",
      ],
      sealSrc: medAllied,
    },
  ];