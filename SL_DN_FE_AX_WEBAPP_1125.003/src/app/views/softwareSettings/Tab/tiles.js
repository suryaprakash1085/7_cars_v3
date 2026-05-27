"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";

export default function Tiles() {
  const [tileData, setTileData] = useState([]);
  const [token, setToken] = useState("");
  const [rolename, setRole] = useState("");
  const [editingTileId, seteditingTileId] = useState(null);
  const [editedData, setEditedData] = useState({
    unit_name: "",
    unit_shortcode: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/tiles"; // Adjust API URL

  const fetchTiles = async (token) => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      let tileData = await response.json();
      setTileData(tileData);
      console.log({ tileData });
    } catch (error) {
      console.log("Error fetching Tile Data:", error);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);

    fetchTiles(token);
  }, []);

  const handleSaveTile = async () => {
    let tileId = editedData.tile_id;
    let url = process.env.NEXT_PUBLIC_API_URL + "/tiles" + "/" + tileId;
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save Tile');
      }

      const data = await response.json();
      fetchTiles(token);
      setSnackbar({
        open: true,
        message: "Tile Data updated successfully",
        severity: "success",
      });
      seteditingTileId(null);
      setEditedData({ tile_id: "", tile_name: "", image: "" });
    } catch (error) {
      console.error('Error details:', error);
      setSnackbar({
        open: true,
        message: error.message || "Error saving Tile",
        severity: "error",
      });
    }
  };

  return (
    <div>
      {/* <Box sx={{ display: "flex", justifyContent: "flex-end", p: 0 }}>
        <Tooltip title="Add UOM">
          <IconButton
            variant="contained"
            onClick={() => {
              seteditingTileId(null);
              setEditedData({ unit_name: "", unit_shortcode: "" });
              setIsCreating(true);
            }}
            sx={{ height: "40px", backgroundColor: "pink", marginTop: -3 }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box> */}
      <Box
        sx={{
          height: "60vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: "100%",
            flexGrow: 1,
            overflow: "auto",
            "& .MuiTable-root": {
              tableLayout: "fixed",
              width: "100%",
            },
          }}
        >
          <Table
            stickyHeader
            sx={{ minWidth: { xs: "100%", sm: 650 } }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Tile ID</TableCell>
                <TableCell>Tile Name</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tileData.map((tile) => (
                <TableRow key={tile.tile_id}>
                  <TableCell>
                    {editingTileId === tile.tile_id ? (
                      <TextField
                        name="Tile ID"
                        value={editedData.tile_id}
                        variant="standard"
                        disabled
                      />
                    ) : (
                      tile.tile_id
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTileId === tile.tile_id ? (
                      <TextField
                        name="Tile Name"
                        value={editedData.tile_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            tile_name: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      tile.tile_name
                    )}
                  </TableCell>

                  <TableCell>
                    {editingTileId === tile.tile_id ? (
                      <TextField
                        name="image"
                        value={editedData.image}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            image: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      tile.image
                    )}
                  </TableCell>

                  <TableCell>
                    {editingTileId === tile.tile_id ? (
                      <>
                        <IconButton onClick={handleSaveTile}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => seteditingTileId(null)}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            seteditingTileId(tile.tile_id);
                            setEditedData({
                              tile_id: tile.tile_id,
                              tile_name: tile.tile_name,
                              image: tile.image,
                            });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        {/* <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleDeleteUom(tile.tile_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span> */}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this UOM? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteUom} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog> */}
    </div>
  );
}
