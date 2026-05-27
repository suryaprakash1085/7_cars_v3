import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import HourglassDisabledIcon from "@mui/icons-material/HourglassDisabled";

import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DatasetLinkedIcon from "@mui/icons-material/DatasetLinked";

import FindInPageIcon from "@mui/icons-material/FindInPage";
const DataNotFound = ({ type = "data" }) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="65vh">
      <Card
        sx={{
          background: "rgba(12, 12, 12, 0.150)",
          backdropFilter: "blur(50px)",
          borderRadius: "15px",
          padding: { xs: "15px", md: "25px" },
          width: { xs: "90%", sm: "70%", md: "50%" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: 3,
          textAlign: "center",
        }}
      >
         {/* <SearchOffIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} /> */}
         <FindInPageIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} />
        
                {/* <DatasetLinkedIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} /> */}
                {/* <HourglassDisabledIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} /> */}
        {/* <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} /> */}
        <CardContent sx={{ maxWidth: "90%", wordWrap: "break-word" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1, color: "white" }}>
            No content is available at this point
          </Typography>
          <Typography variant="body1" sx={{ color: "white" }}>
            We couldn't find any data to display.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataNotFound;
