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
      name: "Mary Lovensky Carlos",
      description: "Documentation Specialist, Full-Stack Developer",
      image: mary,
    },
    {
      name: "Hannah Lorraine De Leon",
      description: "UI/UX Designer, Full-Stack Developer",
      image: hannah,
    },
    {
      name: "Joyce Anne Matnao",
      description: "QA Specialist, Full-Stack Developer",
      image: joyce,
    },
    { name: "Jelyn Vidal", description: "Full-Stack Developer", image: jelyn },
    {
      name: "Harries Rill Macalatan",
      description: "Technical Mentor",
      image: harries,
    },
  ];

  return (
    <Box component="section" sx={{ mt: 4 }}>
      {/* TOP ROW – 3 items */}
      <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
        {users.slice(0, 3).map((user) => (
          <Grid key={user.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box display="flex" justifyContent="center">
              <FeatureItems
                icon={
                  <Avatar
                    alt={user.name}
                    src={user.image}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "#064F1E",
                      fontWeight: 700,
                      fontSize: "2rem",
                    }}
                  >
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                }
                title={user.name}
                description={user.description}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* BOTTOM ROW – 2 items centered */}
      <Grid container spacing={4} justifyContent="center">
        {users.slice(3).map((user) => (
          <Grid key={user.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box display="flex" justifyContent="center">
              <FeatureItems
                icon={
                  <Avatar
                    alt={user.name}
                    src={user.image}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "#064F1E",
                      fontWeight: 700,
                      fontSize: "2rem",
                    }}
                  >
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                }
                title={user.name}
                description={user.description}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DevelopersSection;
