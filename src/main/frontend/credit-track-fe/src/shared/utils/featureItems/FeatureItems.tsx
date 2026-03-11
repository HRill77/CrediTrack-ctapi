import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface FeatureItemsProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const FeatureItems = ({
  icon,
  title,
  description,
}: FeatureItemsProps) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        maxWidth: 320,
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        {icon}
      </Box>

      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{
          whiteSpace: "nowrap",
          fontSize: "clamp(0.8rem, 2vw, 1rem)",
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ fontSize: "clamp(0.75rem, 1.8vw, 0.875rem)" }}
      >
        {description}
      </Typography>
    </Box>
  );
};
