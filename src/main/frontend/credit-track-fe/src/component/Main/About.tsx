import React from "react";
import "../../shared/css/About.css";
import AboutSection from "../../shared/utils/featureItems/AboutSection";
import { Container, Typography } from "@mui/material";

const About = () => {
  return (
    <div className="about">
      <Container maxWidth="lg">
        <div className="about-content">
          <div>
            <div className="about-top-text">
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#064F1E",
                  fontSize: "clamp(1.25rem, 4vw, 2.125rem)",
                }}
              >
                Tracking your courses has never been easier
              </Typography>
              <p>
                With intelligent automation, CrediTrack simplifies the way
                universities and students handle credit transfers, ensuring
                smooth and accurate course matching.
              </p>
            </div>
            <AboutSection />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default About;
