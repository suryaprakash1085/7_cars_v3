import dayjs from "dayjs";
import { useState } from "react";
import { MenuItem, Select, TableCell, TextField } from "@mui/material";

const handleEditClick = (row, setEditRowId, setEditedData) => {
  setEditRowId(row.id);
  setEditedData(row);
};

// Save Edited Data
const handleSaveClick = async (
  token,
  id,
  editedData,
  setRows,
  setEditRowId,
  setEditedData,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) => {
  // Ensure the date is formatted before sending
  if (editedData.expenseDate) {
    editedData.expenseDate = dayjs(editedData.expenseDate).format("YYYY-MM-DD");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/expense/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editedData),
    }
  );

  if (response.status === 404) {
    setSnackbarMessage("Customer not found");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
    setRows((rows) =>
      rows.map((row) => (row.customer_id === id ? editedData : row))
    );
    setEditRowId(null);
    setEditedData({});
  } else if (response.status === 200) {
    setSnackbarMessage("Customer updated successfully");
    setOpenSnackbar(true);
    setSnackbarSeverity("success");
    setRows((rows) => rows.map((row) => (row.id === id ? editedData : row)));
    setEditRowId(null);
    setEditedData({});
  } else if (response.status === 500) {
    setSnackbarMessage("Error updating customer");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
    setRows((rows) =>
      rows.map((row) => (row.customer_id === id ? editedData : row))
    );
    setEditRowId(null);
    setEditedData({});
  }
};

const handleSaveNewRow = async (
  token,
  editedData,
  setRows,
  setEditRowId,
  setEditedData,
  setIsAdding,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) => {
  // Ensure the date is formatted before sending
  if (editedData.date) {
    editedData.expenseDate = dayjs(editedData.date).format("YYYY-MM-DD");
  } else {
    editedData.date = dayjs().format("YYYY-MM-DD"); // Default to today's date if not provided
  }

  editedData.type = "Operational Expense";

  // // Ensure only one of credit or debit is set
  if (editedData.debit === "") {
    editedData.debit = null; // Clear debit if Credit is selected
  }
  if (editedData.credit === "") {
    editedData.credit = null; // Clear credit if Debit is selected
  }

  let financeRouteData = {
    date: editedData.date,
    credit: editedData.credit,
    debit: editedData.debit,
    description: editedData.description,
    type: editedData.credit ? "Credit" : "Debit",
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/expense/postExpense`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editedData),
    }
  );

  const response2 = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/finance/ledgerBook`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(financeRouteData),
    }
  );

  if (response.status === 500) {
    setSnackbarMessage("Failed to add expense. Please try again");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  } else if (response.status === 201) {
    setSnackbarMessage("Expense added successfully");
    setOpenSnackbar(true);
    setSnackbarSeverity("success");
    setRows((rows) => [editedData, ...rows]); // Add new row at the top
    setEditRowId(null);
    setEditedData({});
    setIsAdding(false);
  } else {
    setSnackbarMessage("Failed to add expense. Please try again");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  }
};

const handleCancelClick = (setEditRowId, setEditedData, setIsAdding) => {
  setEditRowId("");
  setEditedData({});
  setIsAdding(false);
};

const handleInputChange = (e, setEditedData) => {
  const { name, value } = e.target;
  console.log(name, value);

  setEditedData((prevData) => ({
    ...prevData,
    [name === "expenseDate" ? "date" : name]: value,
  }));
};

const handleDeleteRow = (rowId, setDeleteRowId, setOpenDeleteDialog) => {
  setDeleteRowId(rowId);
  setOpenDeleteDialog(true);
};

const confirmDeleteRow = (setRows, deleteRowId, setOpenDeleteDialog) => {
  setRows((prevRows) => prevRows.filter((row) => row.id !== deleteRowId));
  setOpenDeleteDialog(false);
};

const handleDeleteClick = (rowId, setDeleteRowId, setOpenDeleteDialog) => {
  setDeleteRowId(rowId);
  setOpenDeleteDialog(true);
};

const confirmDelete = async (
  token,
  setRows,
  deleteRowId,
  setOpenDeleteDialog,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) => {
  setOpenDeleteDialog(false);

  try {
    const deleteLeadResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/expense/${deleteRowId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (deleteLeadResponse.status === 404) {
      setSnackbarMessage("Expense not found");
      setOpenSnackbar(true);
      setSnackbarSeverity("error");
    } else if (deleteLeadResponse.status === 200) {
      setSnackbarMessage("Expense deleted successfully");
      setOpenSnackbar(true);
      setSnackbarSeverity("success");

      // Remove the deleted row from the state
      setRows((prevRows) => prevRows.filter((row) => row.id !== deleteRowId));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setSnackbarMessage("Failed to delete expense. Please try again.");
      setOpenSnackbar(true);
      setSnackbarSeverity("error");
    }
  } catch (error) {
    console.log("Error deleting expense:", error);
    setSnackbarMessage("An error occurred while deleting the expense.");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  } finally {
    setOpenSnackbar(false);
  }
};

// Add this helper function to get tomorrow's date
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const stopEditing = (index, rows, setRows) => {
  // Stop editing and save the changes
  const updatedData = [...rows];
  updatedData[index].isEditing = false;
  setRows(updatedData);
};

const handleCallStatusChange = (index, rows, setRows, newStatus) => {
  const updatedData = [...rows];
  const currentDate = new Date().toISOString().split("T")[0];

  // Update call status
  updatedData[index].callStatus = newStatus;

  // Handle different status cases
  switch (newStatus) {
    case "Attended":
      updatedData[index].scheduledDate = currentDate;
      break;
    case "Not Attended":
      updatedData[index].scheduledDate = getTomorrowDate();
      updatedData[index].callFeedback = ""; // Reset call feedback
      break;
    case "Call Back Later":
      updatedData[index].scheduledDate = ""; // Clear date to allow manual input
      break;
  }

  setRows(updatedData);
};

// Add these new handler functions
const handleCallFeedbackChange = (index, rows, setRows, newFeedback) => {
  const updatedData = [...rows];
  updatedData[index].callFeedback = newFeedback;
  setRows(updatedData);
};

// const getAllExpenses = async (
//   token,
//   setRows,
//   setOpenSnackbar,
//   setSnackbarMessage,
//   setSnackbarSeverity,
//   limit,
//   isLoading,
//   setIsLoading,
//   hasMore,
//   setHasMore,
//   offset,
//   setOffset,
//   filterType
// ) => {
//   try {
//     setIsLoading(true);
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/expense/getAllExpenses`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     let expenses = await response.json();
//     console.log({ expenses });

//     if (response.status === 200 || response.status === 201) {
//       setRows((prev) => [...prev, ...expenses]);

//       setHasMore(expenses.length === limit);
//       setOffset((prevOffset) => prevOffset + limit);
//     }
//   } catch (error) {
//     console.log("Failed to fetch expenses:", error);
//     setSnackbarMessage("Failed to fetch expenses. Please try again.");
//     setOpenSnackbar(true);
//     setSnackbarSeverity("error");
//   } finally {
//     setIsLoading(false);
//   }
// };

const getAllExpenses = async (
  token,
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
) => {
  try {
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?start_date=${startDate}&end_date=${endDate}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let transactions = await response.json();
    console.log({ t: transactions.data });
    if (response.status === 200 || response.status === 201) {
      // setRows((prev) => [...prev, ...transactions.data]);
      setRows((prev) => [...transactions.data]);

      setHasMore(transactions.length === limit);
      setOffset((prevOffset) => prevOffset + limit);
    }
  } catch (error) {
    console.log("Failed to fetch expenses:", error);
    setSnackbarMessage("Failed to fetch expenses. Please try again.");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  } finally {
    setIsLoading(false);
  }
};

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// const infiniteScroll = debounce(
//   (
//     e,
//     token,
//     setRows,
//     searchQuery,
//     setOpenSnackbar,
//     setSnackbarMessage,
//     setSnackbarSeverity,
//     limit,
//     isLoading,
//     setIsLoading,
//     hasMore,
//     setHasMore,
//     offset,
//     setOffset
//   ) => {
//     const { scrollTop, scrollHeight, clientHeight } = e.target;

//     if (searchQuery) {
//       null;
//     } else if (scrollHeight - scrollTop <= clientHeight + 10) {
//       console.log("hi");
//       getAllLeads(
//         token,
//         setRows,
//         setOpenSnackbar,
//         setSnackbarMessage,
//         setSnackbarSeverity,
//         limit,
//         isLoading,
//         setIsLoading,
//         hasMore,
//         setHasMore,
//         offset,
//         setOffset
//       );
//     }
//   },
//   200 // 200ms debounce delay
// );

const infiniteScroll = debounce(
  (
    e,
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
  ) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Prevent infinite scrolling if currently loading or if there are no more leads
    if (isLoading || !hasMore) {
      return;
    }

    // Trigger data fetch only when near the bottom of the container
    if (!searchQuery && scrollHeight - scrollTop <= clientHeight + 10) {
      setIsLoading(true); // Prevent multiple concurrent calls to `getAllLeads`

      getAllLeads(
        token,
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
        setOffset
      );
    }
  },
  200 // 200ms debounce delay
);

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 1000); // Show FAB after scrolling down 200px
};

const handleAddClick = (setEditRowId, setEditedData, setIsAdding) => {
  const newRow = {
    id: Date.now(), // Unique ID for each new row
    type: "",
    expenseDate: "",
    description: "",
    credit: "",
    debit: "",
  };
  setEditedData(newRow);
  setEditRowId(newRow.id);
  setIsAdding(true);
};

const handleCloseSnackBar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

const filterRows = (
  rows,
  searchQuery = "",
  filterType = "",
  startDate = "",
  endDate = ""
) => {
  return rows
    .filter((row) => {
      const rowDate = new Date(row.date); // Convert row date to Date object

      const matchesQuery = searchQuery
        ? row.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesFilterType = filterType ? row.type === filterType : true;

      const matchesDateRange =
        (startDate ? rowDate >= new Date(startDate) : true) &&
        (endDate ? rowDate <= new Date(endDate) : true);

      return matchesQuery && matchesFilterType && matchesDateRange;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date (ascending)
};

export {
  filterRows,
  handleDeleteRow,
  confirmDeleteRow,
  handleInputChange,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  getTomorrowDate,
  stopEditing,
  handleCallStatusChange,
  handleCallFeedbackChange,
  getAllExpenses,
  infiniteScroll,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  handleAddClick,
  handleCloseSnackBar,
  handleSaveNewRow,
  handleDeleteClick,
  confirmDelete,
};
