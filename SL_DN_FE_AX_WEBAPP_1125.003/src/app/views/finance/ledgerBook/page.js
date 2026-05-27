"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"; // Import js-cookie for cookie management

// Function imports
import {
  stopEditing,
  handleCallStatusChange,
  handleCallFeedbackChange,
  handleDeleteRow,
  confirmDeleteRow,
  handleInputChange,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  getTomorrowDate,
  getAllExpenses,
  infiniteScroll,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  handleAddClick,
  handleCloseSnackBar,
  handleSaveNewRow,
  handleDeleteClick,
  confirmDelete,
} from "../../../../../controllers/ledgerControllers";

// Component imports
import Navbar from "../../../../components/navbar";
import BackButton from "@/components/backButton";

// Function package imports
import dayjs from "dayjs";
import * as XLSX from "xlsx"; // Import xlsx for Excel export

// UI package imports
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  IconButton,
  Modal,
  Button,
  Alert,
  Fab,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery,
  Typography,
} from "@mui/material";

// Images and icons imports
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function LedgerBook() {
  // FrontEnd extracted data states
  let [token, setToken] = useState(null);
  const [gettedData, setGettedData] = useState("");

  // Modal and Alert states
  const [isAdding, setIsAdding] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showFab, setShowFab] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [changedData, setChangedData] = useState("");
  const [editedData, setEditedData] = useState({});
  const [deleteRowId, setDeleteRowId] = useState(null);

  // Add state variables for date range
 const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

const [startDate, setStartDate] = useState(
  firstDay.toISOString().split("T")[0]
);
const [endDate, setEndDate] = useState(
  today.toISOString().split("T")[0]
);

  const [selectedType, setSelectedType] = useState(""); // State to track selected type

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm")); // Check if screen size is small

  // Set initial date range to current month
  

  useEffect(() => {
    // Retrieve login status and phone number from cookies on component mount
    const storedStatus = Cookies.get("connection_status");
    const storedPhone = Cookies.get("phone");

    if (storedStatus === "active" && storedPhone) {
      setIsLoggedIn(true);
      setMobileNumber(storedPhone);
    }
  }, []);

  // Backend rows states
  const [rows, setRows] = useState([]);
  // const [filteredRows, setFilteredRows] = useState(rows);
  // const filteredRows = filterRows(rows, searchQuery, filterType);
  // Function to filter expenses by date range
  // const filterExpensesByDateRange = (expenses, startDate, endDate) => {
  //   if (!startDate && !endDate) {
  //     return expenses;
  //   }

  //   return expenses.filter((expense) => {
  //     const expenseDate = new Date(expense.date);
  //     const start = startDate ? new Date(startDate) : null;
  //     const end = endDate ? new Date(endDate) : null;

  //     if (start) start.setHours(0, 0, 0, 0);
  //     if (end) end.setHours(23, 59, 59, 999);
  //     if (start && end) {
  //       return expenseDate >= start && expenseDate <= end;
  //     } else if (start) {
  //       return expenseDate >= start;
  //     } else if (end) {
  //       return expenseDate <= end;
  //     }
  //     return true;
  //   });
  // };

  // // Filtered rows based on date range
  // const filteredRows = filterExpensesByDateRange(
  //   filterRows(rows, searchQuery, filterType, startDate, endDate),
  //   startDate,
  //   endDate
  // );

  useEffect(() => {
    if (!startDate || !endDate) return;
    
    let storedToken = Cookies.get("token");
    setToken(storedToken);
    getAllExpenses(
      storedToken,
      setRows,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackbarSeverity,
      limit,
      isLoading,
      setIsLoading,
      hasMore,
      setHasMore,
      offset,
      setOffset,
      filterType,
      startDate,
      endDate
    );
  }, [startDate, endDate]);

  const handleExportExcel = () => {
    // Prepare data for export
    const dataToExport = [
      { A: "Expense Report" },
      {
        A: "From:",
        B: dayjs(startDate).format("DD/MM/YYYY"),
        D: "To:",
        E: dayjs(endDate).format("DD/MM/YYYY"),
      },
      {},
      {
        A: "Date",
        B: "Type",
        C: "Description",
        D: "Credit",
        E: "Debit",
        F: "Total",
      },
      {
        A: "Opening Balance",
        D: `₹ ${openingCredit.toFixed(2)}`,
        E: `₹ ${openingDebit.toFixed(2)}`,
        F: `₹ ${openingNetBalance.toFixed(2)}`,
      },
      ...filteredRows.map((row) => ({
        A: dayjs(row.creation_date).format("DD/MM/YYYY"),
        B: row.type,
        C: row.description,
        D: `₹ ${row.credit}`,
        E: `₹ ${row.debit}`,
        F: `₹ ${(row.credit - row.debit).toFixed(2)}`,
      })),
      {
        A: "Closing Balance",
        D: `₹ ${closingCredit.toFixed(2)}`,
        E: `₹ ${closingDebit.toFixed(2)}`,
        F: `₹ ${closingNetBalance.toFixed(2)}`,
      },
    ];

    // Create a new workbook and add the data
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      skipHeader: true,
    });

    // Merge cells A1 to F1 for the "Expense Report" header
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Date
      { wch: 20 }, // Type
      { wch: 30 }, // Description
      { wch: 15 }, // Credit
      { wch: 15 }, // Debit
      { wch: 15 }, // Total
    ];

    // Apply styles
    worksheet["A1"].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" },
    };
    ["A4", "B4", "C4", "D4", "E4", "F4"].forEach((cell) => {
      worksheet[cell].s = { font: { bold: true } };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Export the workbook to an Excel file
    XLSX.writeFile(workbook, "Expenses.xlsx");
  };

  // Calculate Opening and Closing Balances
  const calculateBalances = (expenses) => {
    let openingCredit = 0;
    let openingDebit = 0;
    let closingCredit = 0;
    let closingDebit = 0;
    expenses.forEach((expense) => {
      openingCredit += Number(expense.credit) || 0;
      openingDebit += Number(expense.debit) || 0;

      closingCredit += Number(expense.credit) || 0;
      closingDebit += Number(expense.debit) || 0;
    });

    return { openingCredit, openingDebit, closingCredit, closingDebit };
  };

  const { openingCredit, openingDebit, closingCredit, closingDebit } =
    calculateBalances(rows);

  const openingNetBalance = openingCredit - openingDebit;
  const closingNetBalance = closingCredit - closingDebit;

  const filteredRows = rows.filter((row) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      row.appointment_id,
      row.customer_id,
      row.invoice_no,
      row.description,
      row.status,
      row.expense_type,
      row.type,
      row.payment_method,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  const handleTypeChange = (event) => {
    const value = event.target.value;
    setSelectedType(value);

    if (value === "Credit") {
      setGettedData("Credit");
    } else {
      setGettedData("Debit");
    }
  };


    const pageType = Cookies.get("page_type"); // "tab" or others
  
  return (
    <div>
      {/* <Navbar pageName="Ledger Book" /> */}
       {pageType !== "tab" && <Navbar pageName="Ledger Book" />}
      
      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "89vh",
        }}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap", // Allow the elements to wrap on smaller screens
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Date Filter Controls */}
              <TextField
                type="date"
                size="small"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                  width: "auto", // Allow for flexible width
                  minWidth: "100px", // Add a min width for smaller screens
                  flexGrow: 1, // Allow it to grow on smaller screens
                }}
              />
              <TextField
                type="date"
                size="small"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                  width: "auto", // Allow for flexible width
                  minWidth: "150px", // Add a min width for smaller screens
                  flexGrow: 1, // Allow it to grow on smaller screens
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-end",
                marginLeft: "auto",
                top: "20px",
              }}
            >
              {/* Content here */}
              {/* Search Field */}
              <TextField
                placeholder="Search"
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: "white",
                  flexGrow: 1,
                  minWidth: "267px",
                  marginTop: "5px",
                  width: { xs: "100%", sm: "267px" },
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Add Button */}
              <Tooltip title="Add Expenses">
                <span>
                  <IconButton
                    aria-label=" Add Expenses"
                    disabled={editRowId ? true : false}
                    onClick={() =>
                      handleAddClick(setEditRowId, setEditedData, setIsAdding)
                    }
                    sx={{
                      borderRadius: 1,
                      padding: "10px 10px",
                      marginTop: "5px",
                      backgroundColor: "white",
                      "&:hover": {
                        backgroundColor: "white",
                      },
                      width: { xs: "auto", sm: "auto" },
                      flexGrow: 0,
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Export Excel Button */}
              <Tooltip title="Export Excel">
                <span>
                  <IconButton
                    onClick={handleExportExcel}
                    sx={{
                      borderRadius: 1,
                      padding: "8px 8px",
                      marginTop: "5px",
                      backgroundColor: "white",
                      "&:hover": {
                        backgroundColor: "white",
                      },
                      width: { xs: "auto", sm: "auto" },
                      flexGrow: 0,
                    }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          </div>
          <TableContainer
            id="scrollable-table"
            component={Paper}
            style={{
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
            }}
            onScroll={(event) => {
              scrollToTopButtonDisplay(event, setShowFab);
              infiniteScroll(
                event,
                token,
                setRows,
                searchQuery,
                setOpenSnackbar,
                setSnackbarMessage,
                setSnackbarSeverity,
                limit,
                isLoading,
                setIsLoading,
                hasMore,
                setHasMore,
                offset,
                setOffset
              );
            }}
          >
            <Table stickyHeader sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Date</b>
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Appointment ID</b>
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Customer ID</b>
                  </TableCell>
                  {/* <TableCell sx={{ display: { sm: "table-cell" } }}>
                    <b>Type</b>
                  </TableCell>
                   <TableCell sx={{ display: { sm: "table-cell" } }}>
                    <b>C/D</b>
                  </TableCell>*/}
                  <TableCell
                    sx={{ display: { sm: "table-cell" }, width: "40%" }}
                  >
                    <b>Description</b>
                  </TableCell>

                    {/* <TableCell sx={{ display: { sm: "table-cell" } }}>
                    <b>Payment Method</b>
                  </TableCell> */}
                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Credit</b>
                  </TableCell>

                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Debit</b>
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" }, whiteSpace: "nowrap" }}>
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody style={{ overflowY: "auto" }}>
                {/* Opening Balance Row */}
                {/* <TableRow
                  style={{
                    backgroundColor: "lightgray",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <TableCell
                    colSpan={2}
                    align="right"
                    sx={{ display: { sm: "table-cell" } }}
                  >
                    <b>Opening Balance</b>
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" } }}>
                    ₹ {openingCredit.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" } }}>
                    ₹ {openingDebit.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ display: { sm: "table-cell" } }}>
                    <b>Net: ₹ {openingNetBalance.toFixed(2)}</b>
                  </TableCell>
                </TableRow> */}

                {isAdding && (
                  <TableRow>
                    <TableCell>
                      <TextField
                        fullWidth
                        margin="normal"
                        name="expenseDate"
                        type="date"
                        variant="standard"
                        value={editedData.expenseDate || editedData.date || ""}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        sx={{
                          "& .MuiSelect-icon": {
                            display: "none",
                          },
                          width: "100%",
                          height: "20%",
                        }}
                      />
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>

                    {/* <TableCell>
                      <Select
                        name="type"
                        value={editedData.type || ""}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        variant="standard"
                        disableUnderline
                        sx={{ width: "100%" }}
                      >
                        <MenuItem value="Operational Expense">
                          Operational Expense
                        </MenuItem>
                        <MenuItem value="Non-Operational Expense">
                          Non-Operational Expense
                        </MenuItem>
                        <MenuItem value="Variable Expense">
                          Variable Expense
                        </MenuItem>
                      </Select>
                    </TableCell>

                     <TableCell>
                      <Select
                        name="cd"
                        value={selectedType}
                        onChange={handleTypeChange}
                        variant="standard"
                        disableUnderline
                        sx={{ width: "100%" }}
                      >
                        <MenuItem value="Credit">Credit</MenuItem>
                        <MenuItem value="Debit">Debit</MenuItem>
                      </Select>
                    </TableCell> */}

                    <TableCell>
                      <TextField
                        fullWidth
                        name="description"
                        margin="normal"
                        type="text"
                        variant="standard"
                        value={editedData.description}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        sx={{
                          "& .MuiSelect-icon": {
                            display: "none",
                          },
                          width: "100%",
                        }}
                      />
                    </TableCell>
{/* 
 <TableCell>
                      <TextField
                        fullWidth
                        name="Payment Method"
                        margin="normal"
                        type="text"
                        variant="standard"
                        value={editedData.payment_method}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        sx={{
                          "& .MuiSelect-icon": {
                            display: "none",
                          },
                          width: "100%",
                        }}
                      />
                    </TableCell> */}

                    <TableCell>
                      <TextField
                        fullWidth
                        name="credit"
                        margin="normal"
                        type="number"
                        variant="standard"
                        value={editedData.credit || ""}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        disabled={selectedType === "Debit"}
                        sx={{
                          "& .MuiSelect-icon": {
                            display: "none",
                          },
                          width: "100%",
                        }}
                      />
                    </TableCell>


                    <TableCell>
                      <TextField
                        fullWidth
                        name="debit"
                        margin="normal"
                        type="number"
                        variant="standard"
                        value={editedData.debit || ""}
                        onChange={(e) => {
                          handleInputChange(e, setEditedData);
                        }}
                        disabled={selectedType === "Credit"}
                        sx={{
                          "& .MuiSelect-icon": {
                            display: "none",
                          },
                          width: "100%",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => {
                          handleSaveNewRow(
                            token,
                            editedData,
                            setRows,
                            setEditRowId,
                            setEditedData,
                            setIsAdding,
                            setSnackbarMessage,
                            setOpenSnackbar,
                            setSnackbarSeverity
                          );
                        }}
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          handleCancelClick(
                            setEditRowId,
                            setEditedData,
                            setIsAdding
                          )
                        }
                      >
                        <CancelIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )}
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading Data...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => {
                    return row.type != "Blacklisted" ? (
                      <TableRow key={index}>
                        {console.log({ row })}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {editRowId === row.id ? (
                            <TextField
                              fullWidth
                              margin="normal"
                              name="date"
                              type="date"
                              variant="standard"
                              value={
                                editedData.expenseDate || editedData.date || ""
                              }
                              onChange={(e) => {
                                handleInputChange(e, setEditedData);
                              }}
                              sx={{
                                "& .MuiSelect-icon": {
                                  display: "none",
                                },
                                width: "100%",
                              }}
                            />
                          ) : (
                            dayjs(row.creation_date).format("DD/MM/YYYY")
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.appointment_id || "--"}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.customer_id || "--"}</TableCell>

                        {/* <TableCell>
                          {editRowId === row.id ? (
                            <Select
                              name="type"
                              value={editedData.type || ""}
                              onChange={(e) => {
                                handleCallStatusChange(
                                  index,
                                  rows,
                                  setRows,
                                  e.target.value
                                );
                                handleInputChange(e, setEditedData);
                              }}
                              variant="standard"
                              disableUnderline
                              sx={{ width: "100%" }}
                            >
                              <MenuItem value="Operational Expense">
                                Operational Expense
                              </MenuItem>
                              <MenuItem value="Non-Operational Expense">
                                Non-Operational Expense
                              </MenuItem>
                              <MenuItem value="Variable Expense">
                                Variable Expense
                              </MenuItem>
                            </Select>
                          ) : (
                            row.type
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography>
                            {row?.debit && parseFloat(row.debit) > 0
                              ? "Debit"
                              : row?.credit && parseFloat(row.credit) > 0
                              ? "Credit"
                              : "--"}
                          </Typography>
                        </TableCell> */}

                        <TableCell>
                          {editRowId === row.id ? (
                            <TextField
                              fullWidth
                              name="description"
                              margin="normal"
                              type="text"
                              variant="standard"
                              value={editedData.description}
                              onChange={(e) => {
                                handleInputChange(e, setEditedData);
                              }}
                              sx={{
                                "& .MuiSelect-icon": {
                                  display: "none",
                                },
                                width: "100%",
                              }}
                            />
                          ) : (
                            row.description
                          )}
                        </TableCell>

{/* 
                        <TableCell>
                          {editRowId === row.id ? (
                            <TextField
                              fullWidth
                              name="description"
                              margin="normal"
                              type="text"
                              variant="standard"
                              value={editedData.payment_method}
                              onChange={(e) => {
                                handleInputChange(e, setEditedData);
                              }}
                              sx={{
                                "& .MuiSelect-icon": {
                                  display: "none",
                                },
                                width: "100%",
                              }}
                            />
                          ) : (
                            row.payment_method
                          )}
                        </TableCell> */}

                        <TableCell>
                          {editRowId === row.id ? (
                            <TextField
                              fullWidth
                              name="credit"
                              margin="normal"
                              type="number"
                              variant="standard"
                              value={editedData.credit || ""}
                              onChange={(e) => {
                                handleInputChange(e, setEditedData);
                              }}
                              disabled={selectedType === "Debit"}
                              sx={{
                                "& .MuiSelect-icon": {
                                  display: "none",
                                },
                                width: "100%",
                              }}
                            />
                          ) : (
                            <>{row.credit != null ? `₹ ${row.credit}` : "--"}</>
                          )}
                        </TableCell>

                        <TableCell>
                          {editRowId === row.id ? (
                            <TextField
                              fullWidth
                              name="debit"
                              margin="normal"
                              type="number"
                              variant="standard"
                              value={editedData.debit || ""}
                              onChange={(e) => {
                                handleInputChange(e, setEditedData);
                              }}
                              disabled={selectedType === "Credit"}
                              sx={{
                                "& .MuiSelect-icon": {
                                  display: "none",
                                },
                                width: "100%",
                              }}
                            />
                          ) : (
                            <>{row.debit != null ? `₹ ${row.debit}` : "--"}</>
                          )}
                        </TableCell>

                        <TableCell>
                          {editRowId === row.id ? (
                            <>
                              <IconButton
                                onClick={() =>
                                  handleSaveClick(
                                    token,
                                    row.id,
                                    editedData,
                                    setRows,
                                    setEditRowId,
                                    setEditedData,
                                    setSnackbarMessage,
                                    setOpenSnackbar,
                                    setSnackbarSeverity
                                  )
                                }
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton
                                onClick={() =>
                                  handleCancelClick(
                                    setEditRowId,
                                    setEditedData,
                                    setIsAdding
                                  )
                                }
                              >
                                <CancelIcon />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              {/* <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    disabled={editRowId}
                                    onClick={() =>
                                      handleEditClick(
                                        row,
                                        setEditRowId,
                                        setEditedData
                                      )
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    disabled={editRowId ? true : false}
                                    onClick={() =>
                                      handleDeleteClick(
                                        row.id,
                                        setDeleteRowId,
                                        setOpenDeleteDialog
                                      )
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </span>
                              </Tooltip> */}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      ""
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Data Found
                    </TableCell>
                  </TableRow>
                )}

                {/* Closing Balance Row */}
                <TableRow
                  style={{
                    backgroundColor: "lightgray",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 1,
                  }}
                >
                  <TableCell colSpan={4} align="right" sx={{ whiteSpace: "nowrap" }}>
                    <b>Closing Balance</b>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>+ ₹ {closingCredit.toFixed(2)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>- ₹ {closingDebit.toFixed(2)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <b>Net: ₹ {closingNetBalance.toFixed(2)}</b>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Back to Top FAB */}
            {showFab && (
              <Fab
                size="small"
                onClick={handleScrollToTop}
                style={{
                  backgroundColor: "white",
                  color: "primary",
                  position: "absolute",
                  bottom: 40,
                  right: 40,
                  zIndex: 10,
                }}
              >
                <ArrowUpwardIcon />
              </Fab>
            )}
          </TableContainer>
        </Box>
      </Box>

      {/* Deletion Conformation Dialogue */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lead? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() =>
              confirmDelete(
                token,
                setRows,
                deleteRowId,
                setOpenDeleteDialog,
                setSnackbarMessage,
                setOpenSnackbar,
                setSnackbarSeverity
              )
            }
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => handleCloseSnackBar(setOpenSnackbar)}
      >
        <Alert
          onClose={() => handleCloseSnackBar(setOpenSnackbar)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
