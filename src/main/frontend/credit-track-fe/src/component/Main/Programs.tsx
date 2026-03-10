import React from "react";
import "../../shared/css/Programs.css";
import ProgramsSection from "../../shared/utils/featureItems/ProgramSection";
import { Container, Typography } from "@mui/material";

const Programs = () => {
  return (
    <div className="programs">
      <Container maxWidth="lg">
        <div className="programs-content">
          <div>
            <div className="programs-top-text">
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#064F1E " }}
              >
                Programs and Courses
              </Typography>
            </div>
            <ProgramsSection />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Programs;
