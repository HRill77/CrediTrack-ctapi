import { Box, Grid } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SchoolIcon from "@mui/icons-material/School";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { FeatureItems } from "./FeatureItems";
import aiTranscriptImage from "../../assets/images/AITranscriptTools.png";
import uploadFile from "../../assets/images/Uploadfile.png";
import creditMatching from "../../assets/images/creditMatching.png";
import trustedTransparent from "../../assets/images/guardSafe.png";
import userVerified from "../../assets/images/verified.png";



const AboutSection = () => {
  return (
    <Box
      component="section"
      sx={
        {
          mt: 4
        }
      }
    >
      {/* TOP ROW – 3 ITEMS */}
      <Grid
        container
        spacing={8}
        justifyContent="center"
        sx={{ mb: 4 }}
      >
       
          <Box display="flex" justifyContent="center">
            <FeatureItems
              icon={
               <img
                  src={uploadFile}
                  alt="AI Transcript Tools"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />
              }
              title="Easy Transcript Upload"
              description="Just upload your transcript and let the system do the work."
            />
          </Box>
        
          <Box display="flex" justifyContent="center">
            <FeatureItems
              icon={
                <img
                  src={aiTranscriptImage}
                  alt="AI Transcript Tools"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />
              }
              title="Smart Course Reading"
              description="AI reads and understands course titles, units, and grades."
            />
          </Box>
        

        
          <Box display="flex" justifyContent="center">
            <FeatureItems
               icon={
               <img
                  src={creditMatching}
                  alt="AI Transcript Tools"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />}
              title="AI Credit Matching"
              description="Instantly matches your courses with the new university's curriculum."
            />
          </Box>
        
      </Grid>

      {/* BOTTOM ROW – 2 ITEMS CENTERED */}
      <Grid
        container
        spacing={8}
        justifyContent="center"
      >
     
          <Box display="flex" justifyContent="center">
            <FeatureItems
                icon={
               <img
                  src={trustedTransparent}
                  alt="AI Transcript Tools"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />}
              title="Trusted & Transparent"
              description="Built-in checks with clear results and the option to appeal."
            />
          </Box>


     
          <Box display="flex" justifyContent="center">
            <FeatureItems
                icon={
               <img
                  src={userVerified}
                  alt="AI Transcript Tools"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "contain",
                  }}
                />}
              title="Faculty-Backed Decisions"
              description="Final review by admins and faculty for accuracy."
            />
          </Box>
    
      </Grid>
    </Box>
  );
};

export default AboutSection;