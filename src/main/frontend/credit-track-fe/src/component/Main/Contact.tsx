import { Box, Typography, Stack, IconButton, Container } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import LanguageIcon from "@mui/icons-material/Language";
import EmailIcon from "@mui/icons-material/Email";
import "../../shared/css/Contact.css";

import crediTrackLogo from "../../shared/assets/logo/crediTrackLogo2.png";
import wupLogo from "../../shared/assets/logo/wupLogo.png";

const Contact = () => {
  return (
    <footer className="contact-footer">
      <Container maxWidth="lg">
        <div className="contact-footer-content">
          {/* LEFT */}
          <div className="contact-footer-left">
            <Box
              component="img"
              src={crediTrackLogo}
              alt="CrediTrack Logo"
              sx={{
                height: { xs: 80, md: 120 },
                flexShrink: 0,
                display: { xs: "none", md: "block" },
              }}
            />

            <div>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Poppins",
                  fontSize: "clamp(1.25rem, 4vw, 2.125rem)",
                }}
              >
                CrediTrack
              </Typography>

              <Typography
                variant="body2"
                component="a"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=inquiry.creditrack@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: "underline",
                  color: "white",
                  fontFamily: "Poppins",
                  mt: 0.5,
                  fontSize: "clamp(0.7rem, 1.5vw, 0.875rem)",
                  "&:hover": { color: "primary.main" },
                }}
              >
                inquiry.creditrack@gmail.com
              </Typography>

              <Typography
                variant="caption"
                display="block"
                sx={{
                  fontStyle: "italic",
                  mt: 2,
                  fontFamily: "Poppins",
                  fontSize: "clamp(0.5rem, 1.8vw, 0.65rem)",
                  whiteSpace: "nowrap",
                }}
              >
                College of Engineering and Computer Technology
              </Typography>

              <Typography
                variant="caption"
                display="block"
                sx={{
                  fontStyle: "italic",
                  fontFamily: "Poppins",
                  fontSize: "clamp(0.5rem, 1.8vw, 0.65rem)",
                  whiteSpace: "nowrap",
                }}
              >
                Copyright © 2026 CrediTrack. All rights reserved.
              </Typography>
            </div>
          </div>

          {/* RIGHT */}
          <div className="contact-footer-right">
            <Box
              component="img"
              src={wupLogo}
              alt="Wesleyan University Seal"
              sx={{ height: { xs: 55, md: 70 }, mb: 1 }}
            />

            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: "Poppins",
                mt: 1,
                fontSize: "clamp(0.7rem, 1.5vw, 0.875rem)",
              }}
            >
              Wesleyan University – Philippines
            </Typography>

            <Stack direction="row" justifyContent="center">
              <IconButton
                color="inherit"
                size="small"
                component="a"
                href="https://www.facebook.com/WesleyanOfficial"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              >
                <FacebookIcon />
              </IconButton>

              <IconButton
                color="inherit"
                size="small"
                component="a"
                href="https://www.wesleyan.edu.ph/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              >
                <LanguageIcon />
              </IconButton>

              <IconButton
                color="inherit"
                size="small"
                component="a"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=admin@wesleyan.edu.ph"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              >
                <EmailIcon />
              </IconButton>
            </Stack>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Contact;
