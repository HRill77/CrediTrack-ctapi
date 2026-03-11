import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { collegesList } from "../programSectionUtil";

const ProgramsSection = () => {
  const colleges = collegesList;

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          maxHeight: "600px",
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#064F1E",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": { background: "#043d16" },
        }}
      >
        <Stack spacing={3}>
          {colleges.map((college) => (
            <Paper
              key={college.name}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: { xs: 1.5, md: 3 },
                }}
              >
                {/* Left: text */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      fontSize: "clamp(0.8rem, 2vw, 1rem)",
                    }}
                  >
                    {college.name}
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    {college.programs.map((program) => (
                      <li
                        key={program}
                        style={{
                          marginLeft: "1.2rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "clamp(0.7rem, 1.8vw, 14px)",
                            margin: 0,
                          }}
                        >
                          {program}
                        </p>
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
                    width: { xs: 55, md: 80 },
                    height: { xs: 55, md: 80 },
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
