// components/backbutton.js
// React and Next imports
import React from "react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

// UI package imports - Alphabetical
import { IconButton } from "@mui/material";

// Icons imports - Alphabetical
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { set } from "date-fns";

const BackButton = ({ hasChanges }) => {
  // Frontend extracted data states
  const router = useRouter();
  const pathname = usePathname();

  const routesWithConfirmation = [
    /^\/app\/shoppingcart\/.+$/,
    /^\/app\/jobAssessment\/.+$/,
    /^\/app\/inventoryActivity\/goodsreceipt\/.+$/,
  ];

  const [openConformaModal, setOpenConformModal] = useState(false);

  // Functions that has to be in the same file
  // const handleBack = () => {
  //   const currentPath = window.location.href;
  //   const basePath = window.location.origin;

  //   if (currentPath.startsWith(basePath)) {
  //     const pathSegments = currentPath.replace(basePath, "").split("/").filter(Boolean);
  //     if (pathSegments.length > 0) {
  //       pathSegments.pop();
  //       const newPath = `${basePath}/${pathSegments.join("/")}`;
  //       window.location.href = newPath;
  //     }
  //   }
  // };

  const handleConfirm = () => {
    const currentPath = pathname; // window.location.href;
    const pathSegments = currentPath.split("/");
    const res = pathSegments.slice(0, -1);
    const res1 = res.join("/");
    router.push(res1);

    localStorage.removeItem("selectedPR");
  };

  const handleBack = () => {
    if (
      // routesWithConfirmation.some((pattern) => pattern.test(pathname))
      hasChanges == true
    ) {
      openConformationModal();
    } else {
      handleConfirm();
    }
  };

  const openConformationModal = () => {
    setOpenConformModal(true);
  };

  // UI Code
  return (
    <>
      <IconButton
        onClick={() => {
          handleBack();
        }}
        disableRipple
        sx={{ backgroundColor: "transparent", padding: 0, color: "white" }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Dialog
        open={openConformaModal}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Unsaved Changes!
        </DialogTitle>

        <DialogContent
          sx={{
            padding: "16px 24px",
            fontSize: "1rem",
            color: "#555",
            lineHeight: "1.5",
          }}
        >
          <Typography>
            Are you sure you want to go back?{" "}
            <span style={{ fontWeight: "bold" }}>
              Any unsaved changes will be deleted.
            </span>{" "}
            <br></br>
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "8px 16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            onClick={() => setOpenConformModal(false)}
            color="primary"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.875rem",
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BackButton;
