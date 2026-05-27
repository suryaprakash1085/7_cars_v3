// Edit Table Data
const handleEditClick = (row, setEditRowId, setEditedData) => {
  setEditRowId(row.inventory_id);
  setEditedData(row);
};
const handleOpenTransaction = async (
  inventory_id,
  token,
  setTranscationData,
  setOpenTranscationModalState
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/transaction/inv/${inventory_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log("Transaction response:", response);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const data = await response.json();
    setTranscationData(data);
    setOpenTranscationModalState(true);
    return data;
  } catch (error) {
    // console.error("Error opening transaction:", error);
    setShowError(error.message);
    throw error;
  }
};

// Save Edited Data
const handleSaveClick = (
  id,
  editedData,
  setRows,
  setEditRowId,
  setEditedData
) => {
  setRows((rows) => rows.map((row) => (row.id === id ? editedData : row)));
  setEditRowId(null);
  setEditedData({});
};

// Cancel Edit
const handleCancelClick = (setEditRowId, setEditedData, setIsAdding) => {
  setEditRowId("");
  setEditedData({});
  setIsAdding(false);
};

//
const handleInputChange = (e, setEditedData) => {
  const { name, value } = e.target;
  // console.log("name", name, "value", value);

  setEditedData((prevData) => ({ ...prevData, [name]: value }));
};

const handleAddClick = (setEditRowId, setEditedData, setIsAdding) => {
  const newRow = {
    category: "",
    part_name: "",
    description: "",
    quantity: "",
    price: "",
  };
  setEditedData(newRow);
  setEditRowId(newRow.id);
  setIsAdding(true);
};

const handleSaveNewRow = async (
  token,
  editedData,
  setRows,
  setEditRowId,
  setEditedData,
  setIsAdding,
  setErrorMessage,
  setShowError
) => {
  if (!editedData.part_name) {
    setErrorMessage("Material Name is required.");
    setShowError(true);
    return;
  }

  setRows((rows) => [editedData, ...rows]); // Add new row at the top
  setEditRowId(null);
  setEditedData({});
  setIsAdding(false);
  setShowError(false);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(editedData),
  });
  // console.log("edataRes", response);

  if (!response.ok) {
    setShowError(response.statusText);
  }
};

async function fetchInventory(
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
) {
  try {
    if (!token) {
      throw new Error("No token found. Please log in.");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    // setRows(data);
    setRows((prev) => [...prev, ...data]);

    setOffset((prevOffset) => {
      let newOffset = parseInt(prevOffset) + parseInt(limit);
      // console.log({ newOffset });
      return newOffset;
    });

    // setFilteredEntries(data);
    setIsLoading(false);
  } catch (err) {
    // setError(err.message);
    setSnackbarMessage(err.message); // Set error message for Snackbar
    setOpenSnackbar(true); // Show Snackbar with error message
    setSnackbarSeverity("error");
  }
}

// Validate PhoneNumber
const validatePhoneNumber = (phoneNo) => {
  return /^\d{10}$/.test(phoneNo);
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
  setShowError,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  // Store the deleted row in case we need to restore it
  let deletedRow = null;

  // Optimistically remove the row from UI
  setRows((prevRows) => {
    deletedRow = prevRows.find((row) => row.inventory_id === deleteRowId);
    return prevRows.filter((row) => row.inventory_id !== deleteRowId);
  });

  setOpenDeleteDialog(false);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/${deleteRowId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (response.status === 200) {
      setSnackbarMessage(result.message || "Item deleted successfully");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      return true;
    } else if (response.status === 404) {
      // Item not found, but we already removed it from UI so it's fine
      setSnackbarMessage(result.error || "Item not found");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return true;
    } else {
      // Restore the row if deletion failed
      if (deletedRow) {
        setRows((prevRows) => [...prevRows, deletedRow]);
      }
      setSnackbarMessage(result.message || "Failed to delete item");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return false;
    }
  } catch (error) {
    // Restore the row if an error occurred
    if (deletedRow) {
      setRows((prevRows) => [...prevRows, deletedRow]);
    }
    setSnackbarMessage(error.message || "Error deleting item");
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
    return false;
  }
};

// Filter by name and phone number
// const filterRows = (rows, searchQuery, filterType) => {
//   if (!filterType || !searchQuery) {
//     return rows;
//   }

//   return rows.filter((row) => {
//     const matchesFilter = !filterType || row.category === filterType;

//     const matchesSearchQuery =
//       row.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       row.inventory_id.includes(searchQuery);

//     return matchesFilter && matchesSearchQuery;
//   });
// };

const filterRows = async (token, rows, setRows, searchQuery, filterType) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/searchInventory?search=${
        searchQuery || "All"
      }&filter=${filterType || "All"}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    setRows(data);
  } catch (error) {
    // console.log(error);
    setOpenSnackbar(true);
    setSnackbarMessage("Error fetching search results. Please try again.");
    return rows; // Return existing rows if the fetch fails
  }
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
};
const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};
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

    if (searchQuery) {
      null;
    } else if (scrollHeight - scrollTop <= clientHeight + 50) {
      fetchInventory(
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

export {
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handleInputChange,
  handleAddClick,
  handleSaveNewRow,
  validatePhoneNumber,
  handleDeleteClick,
  confirmDelete,
  filterRows,
  handleOpenTransaction,
  handleScrollToTop,
  infiniteScroll,
  debounce,
  scrollToTopButtonDisplay,
  fetchInventory,
};
