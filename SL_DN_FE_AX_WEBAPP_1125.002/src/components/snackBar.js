"use client";
import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function AppAlert({ alertData }) {
 
  const [openSnackbar, setOpenSnackbar] = React.useState(alertData.openAlert);

  React.useEffect(() => {
    setOpenSnackbar(alertData.openAlert);
  }, [alertData]);

  return (
    <Snackbar
      open={openSnackbar}
      autoHideDuration={alertData.duration ? alertData.duration : 2000}
      onClose={() => setOpenSnackbar(false)}
    >
      {/* { console.log({alertData})} */}
      <Alert
        onClose={() => setOpenSnackbar(false)}
        sx={{ width: "100%" }}
      >
        {alertData.message}
      </Alert>
    </Snackbar>
  );
}

//* Data Send Format
// alertData = {
//     openAlert: true,
//     message: "Error Fetching Customer Data. Please try again.",
//     severity: "error",
//     duration: 2000,
//   };
