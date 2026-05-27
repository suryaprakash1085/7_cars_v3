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

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [rolename, setRole] = useState("");
  const [token, setToken] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editedData, setEditedData] = useState({ expenses_name: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/ss/expenses"; // Adjust API URL

  useEffect(() => {
    fetchExpenses();
    const token = Cookies.get("token");
    setToken(token);
    const role = Cookies.get("role");
    setRole(role);
  }, []);

  const fetchExpenses = () => {
    fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
        } else {
          console.log("Expected an array but got:", data);
        }
      })
      .catch((error) => console.log("Error fetching expenses:", error));
  };

  const handleSaveExpense = async () => {
    const method = editingExpenseId ? "PUT" : "POST";
    const url = editingExpenseId ? `${apiUrl}/${editingExpenseId}` : apiUrl;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Failed to save expense");

      fetchExpenses(); // Refresh expenses
      setSnackbar({
        open: true,
        message: editingExpenseId
          ? "Expense updated successfully"
          : "Expense created successfully",
        severity: "success",
      });
      setEditingExpenseId(null);
      setEditedData({ expenses_name: "" });
      setIsCreating(false);
    } catch (error) {
      console.log("Error saving expense:", error);
      setSnackbar({
        open: true,
        message: "Error saving expense",
        severity: "error",
      });
    }
  };

  const handleDeleteExpense = (id) => {
    setDeleteExpenseId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteExpense = () => {
    fetch(`${apiUrl}/${deleteExpenseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.ok) {
          fetchExpenses(); // Refresh expenses
          setSnackbar({
            open: true,
            message: "Expense deleted successfully",
            severity: "success",
          });
        } else {
          throw new Error("Failed to delete expense");
        }
      })
      .catch((error) => {
        console.log("Error deleting expense:", error);
        setSnackbar({
          open: true,
          message: "Error deleting expense",
          severity: "error",
        });
      })
      .finally(() => {
        setOpenDeleteDialog(false);
        setDeleteExpenseId(null);
      });
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 0 }}>
        <Typography variant="h4">{/* Expense Management */}</Typography>
        {/* <Button
          variant="contained"
          sx={{ mb: 2 }}
          onClick={() => {
            setEditingExpenseId(null);
            setEditedData({ expenses_name: "" });
            setIsCreating(true);
          }}
        >
          Create Expense
        </Button> */}
        <Tooltip title="Add Expense">
          <IconButton
            variant="contained"
            onClick={() => {
              setEditingExpenseId(null);
              setEditedData({ expenses_name: "" });
              setIsCreating(true);
            }}
            sx={{ height: "40px", backgroundColor: "pink", marginTop: -3 }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

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
                <TableCell>Expences Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="expenses_name"
                      value={editedData.expenses_name}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          expenses_name: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter Expense Name"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleSaveExpense}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsCreating(false)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {editingExpenseId === expense.id ? (
                      <TextField
                        name="expenses_name"
                        value={editedData.expenses_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            expenses_name: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      expense.expenses_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingExpenseId === expense.id ? (
                      <>
                        <IconButton onClick={handleSaveExpense}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => setEditingExpenseId(null)}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingExpenseId(expense.id);
                            setEditedData({
                              expenses_name: expense.expenses_name,
                            });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
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

      {/* Deletion Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this expense? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteExpense} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
