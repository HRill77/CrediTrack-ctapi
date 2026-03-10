import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import criminology from "../../assets/seals/criminology.png";
import engineering from "../../assets/seals/engineering.png";
import education from "../../assets/seals/education.png";
import medAllied from "../../assets/seals/med-allied.png";
import { College } from "../../interface/CourseInterface";
import { collegesList } from "../programSectionUtil";
  
const ProgramsSection = () => {
  const colleges = collegesList;

  return (
    <Container maxWidth="md">
      {/* Scrollable Container */}
      <Box
        sx={{
          maxHeight: "600px", // Adjust height to fit 3 colleges
          overflowY: "auto",
          pr: 1, // Add right padding for scrollbar
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#064F1E",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#043d16",
          },
        }}
      >
        {/* Cards */}
        <Stack spacing={3}>
          {colleges.map((college) => (
            <Paper
              key={college.name}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 3,
                }}
              >
                {/* Left: text */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    {college.name}
                  </Typography>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.2rem",
                    }}
                  >
                    {college.programs.map((program) => (
                      <li
                        key={program}
                        style={{
                          marginLeft: "1.2rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <p style={{ fontSize: "14px" }}>{program}</p>
                      </li>
                    ))}
                  </ul>
                </Box>

                {/* Right: seal/logo */}
                <Box
                  component="img"
                  src={college.sealSrc}
                  alt={`${college.name} seal`}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Container>
  );
};

export default ProgramsSection;
