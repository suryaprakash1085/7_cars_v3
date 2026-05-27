"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import Cookies from "js-cookie";
import { number } from "prop-types";

export default function ConformationDialogue({
  openConformationModal,
  setOpenConformationModal,
  details,
  selectedRow,
  deleteurl,
  deleteMethod,
  onDeleteSuccess,
}) {
  // console.log({ details });
  const [token, setToken] = useState(null);
  const idKey = selectedRow
    ? Object.keys(selectedRow).find((key) => key.toLowerCase().endsWith("id"))
    : null;
  const idValue = idKey ? selectedRow[idKey] : "";
  // console.log("selectedRow", selectedRow, "id:", idValue);

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
  }, []);

  const handleConfirm = async () => {
    // console.log(details.name)
    if (details.name == "WhatsApp") {
      try {
        const response = await fetch(`${deleteurl}/`, {
          method: deleteMethod,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: Cookies.get("phone")
          })
        });
        if (response.ok) {
          // console.log("Deletion successful");
          setOpenConformationModal(false);
          onDeleteSuccess(idValue);
        } else {
          // console.log("Deletion failed");
        }
      } catch (error) {
        console.log("Error during deletion:", error);
      }
    }
    else {
      try {
        const response = await fetch(`${deleteurl}/${idValue}`, {
          method: deleteMethod,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          console.log("Deletion successful");
          // setOpenConformationModal(false);
          onDeleteSuccess(idValue);
        } else {
          console.log("Deletion failed");
        }
        setOpenConformationModal(false);
      } catch (error) {
        console.log("Error during deletion:", error);
      }
    }
  };

  return (
    <Dialog
      open={openConformationModal}
      onClose={() => setOpenConformationModal(false)}
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
        Confirm Deletion
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
          Are you sure you want to{" "}
          <span style={{ fontWeight: "bold" }}>
            {details.action} this {details.name}{" "}
          </span>
          {selectedRow ? `with ID: ${idValue}` : ""}?<br></br>
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
          onClick={() => setOpenConformationModal(false)}
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
  );
}

//* Old Conformation Design
// import {
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
// } from "@mui/material";

// export default function ConformationDialogue({
//   openConformationModal,
//   setOpenConformationModal,
//   details,
// }) {
//   return (
//     <Dialog
//       open={openConformationModal}
//       onClose={() => setOpenConformationModal(false)}
//     >
//       <DialogTitle>Confirm Deletion</DialogTitle>
//       <DialogContent>
//         Are you sure you want to delete this {details.name}? This action cannot
//         be undone.
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={() => setOpenConformationModal(false)} color="primary">
//           Cancel
//         </Button>
//         <Button onClick={() => {}} color="error">
//           Confirm
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }
