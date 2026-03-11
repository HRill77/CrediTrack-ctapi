import { Box, Grid } from "@mui/material";
import { FeatureItems } from "./FeatureItems";
import aiTranscriptImage from "../../assets/images/AITranscriptTools.png";
import uploadFile from "../../assets/images/Uploadfile.png";
import creditMatching from "../../assets/images/creditMatching.png";
import trustedTransparent from "../../assets/images/guardSafe.png";
import userVerified from "../../assets/images/verified.png";

const features = [
  {
    src: uploadFile,
    title: "Easy Transcript Upload",
    description: "Just upload your transcript and let the system do the work.",
  },
  {
    src: aiTranscriptImage,
    title: "Smart Course Reading",
    description: "AI reads and understands course titles, units, and grades.",
  },
  {
    src: creditMatching,
    title: "AI Credit Matching",
    description:
      "Instantly matches your courses with the new university's curriculum.",
  },
  {
    src: trustedTransparent,
    title: "Trusted & Transparent",
    description: "Built-in checks with clear results and the option to appeal.",
  },
  {
    src: userVerified,
    title: "Faculty-Backed Decisions",
    description: "Final review by admins and faculty for accuracy.",
  },
];

const AboutSection = () => {
  return (
    <Box component="section" sx={{ mt: 4 }}>
      {/* TOP ROW – 3 items */}
      <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
        {features.slice(0, 3).map((feature) => (
          <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box display="flex" justifyContent="center">
              <FeatureItems
                icon={
                  <img
                    src={feature.src}
                    alt={feature.title}
                    style={{ width: 100, height: 100, objectFit: "contain" }}
                  />
                }
                title={feature.title}
                description={feature.description}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* BOTTOM ROW – 2 items */}
      <Grid container spacing={4} justifyContent="center">
        {features.slice(3).map((feature) => (
          <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box display="flex" justifyContent="center">
              <FeatureItems
                icon={
                  <img
                    src={feature.src}
                    alt={feature.title}
                    style={{ width: 100, height: 100, objectFit: "contain" }}
                  />
                }
                title={feature.title}
                description={feature.description}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AboutSection;
