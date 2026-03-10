import { Avatar, Box, Grid } from "@mui/material";
import { FeatureItems } from "./FeatureItems";
import mary from "../../assets/avatar/Mary.jpg";
import hannah from "../../assets/avatar/Hannah.jpg";
import joyce from "../../assets/avatar/Joyce.jpg";
import jelyn from "../../assets/avatar/Jelyn.jpg";
import harries from "../../assets/avatar/Harries.jpg";

const DevelopersSection = () => {
  const users = [ 
    
    {
      name: "Mary Lovensky",
      description: "Full-Stack Developer",
      image: mary,
    },
    {
      name: "Hannah Lorraine",
      description: "UI/UX Designer, Full-Stack Developer",
      image: hannah,
    },
    {
      name: "Joyce Anne",
      description: "Full-Stack Developer",
      image: joyce,
    },
    {
      name: "Jelyn",
      description: "Full-Stack Developer",
      image: jelyn,
    },
    {
      name: "Harries Rill Macalatan",
      description: "Technical Mentor",
      image: harries
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        mt: 4,
      }}
    >
      {/* TOP ROW – 3 ITEMS */}
      <Grid container spacing={8} justifyContent="center" sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="center">
          <FeatureItems
            icon={
              <Avatar
                alt={users[0].name}
                src={users[0].image}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#064F1E",
                  fontWeight: 700,
                  fontSize: "2rem",
                }}
              >
                {users[0].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            }
            title={users[0].name}
            description={users[0].description}
          />
        </Box>

        <Box display="flex" justifyContent="center">
          <FeatureItems
            icon={
              <Avatar
                alt={users[1].name}
                src={users[1].image}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#064F1E",
                  fontWeight: 700,
                  fontSize: "2rem",
                }}
              >
                {users[1].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            }
            title={users[1].name}
            description={users[1].description}
          />
        </Box>

        <Box display="flex" justifyContent="center">
          <FeatureItems
            icon={
              <Avatar
                alt={users[2].name}
                src={users[2].image}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#064F1E",
                  fontWeight: 700,
                  fontSize: "2rem",
                }}
              >
                {users[2].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            }
            title={users[2].name}
            description={users[2].description}
          />
        </Box>
      </Grid>

      {/* BOTTOM ROW – 2 ITEMS CENTERED */}
      <Grid container spacing={15} justifyContent="center">
        <Box display="flex" justifyContent="center">
          <FeatureItems
            icon={
              <Avatar
                alt={users[3].name}
                src={users[3].image}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#064F1E",
                  fontWeight: 700,
                  fontSize: "2rem",
                }}
              >
                {users[3].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            }
            title={users[3].name}
            description={users[3].description}
          />
        </Box>

        <Box display="flex" justifyContent="center">
          <FeatureItems
            icon={
              <Avatar
                alt={users[4].name}
                src={users[4].image}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#064F1E",
                  fontWeight: 700,
                  fontSize: "2rem",
                }}
              >
                {users[4].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            }
            title={users[4].name}
            description={users[4].description}
          />
        </Box>
      </Grid>
    </Box>
  );
};

export default DevelopersSection;
