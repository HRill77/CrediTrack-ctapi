import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/images/WUP.png";


const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      

      <Box
        sx={{
        position: "relative",
        minHeight: "100vh", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
  }}
>
  
    <Box
      sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: 0.1,
      zIndex: -1, 
    }}
  />

  
    <Container maxWidth="md" sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
      <Typography variant="h1" sx={{ fontWeight: 800, color: "#0B4D1E", mb: 1 }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#0B4D1E", mb: 2 }}>
        Page Not Found
      </Typography>
      <Typography sx={{ color: "#333", maxWidth: 520, mx: "auto", mb: 4 }}>
        The page you’re looking for doesn’t exist or may have been moved.
        Don’t worry—your academic progress is still on track.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => navigate("/")}
        sx={{
          backgroundColor: "#0B4D1E",
          px: 4,
          py: 1.5,
          fontWeight: 600,
          "&:hover": { backgroundColor: "#083A16" },
        }}
      >
        Back to Dashboard
      </Button>
    </Container>
  </Box>
      </>
    );
  };

export default NotFound;
