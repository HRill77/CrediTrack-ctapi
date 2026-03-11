import { Container, Typography } from "@mui/material";
import React from "react";
import "../../shared/css/Developers.css";
import DevelopersSection from "../../shared/utils/featureItems/DevelopersSection";

const Developers = () => {
  return (
    <div className="developers">
      <Container maxWidth="lg">
        <div className="developers-content">
          <div>
            <div className="developers-top-text">
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#064F1E",
                  mb: 5,
                  fontSize: "clamp(1.25rem, 4vw, 2.125rem)",
                }}
              >
                Team Behind CrediTrack
              </Typography>
            </div>
            <DevelopersSection />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Developers;
