import React from "react";
import "../../shared/css/Main.css";
import { Button, Container, Typography } from "@mui/material";

const Main = () => {
  return (
    <div className="hero">
      <Container maxWidth="lg">
        <div className="content">
          <div className="hero-text">
            <Typography
              variant="h1"
              align="center"
              sx={{ fontWeight: "bold", color: "#064F1E " }}
            >
              CrediTrack
            </Typography>
            <p>
              Every course you’ve taken is progress — CrediTrack uses AI to make
              sure your credits move forward with you
            </p>
            <Button className="hero-btn" size="medium">
              Track your course
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Main;
