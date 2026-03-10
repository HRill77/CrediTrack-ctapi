
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface FeatureItemsProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const FeatureItems = ({ icon, title, description }: FeatureItemsProps) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        maxWidth: 260,
      }}
    >
       <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 2,
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
      >
        {title}
      </Typography>

      <Typography variant="body2">
        {description}
      </Typography>
    </Box>
  );
};
