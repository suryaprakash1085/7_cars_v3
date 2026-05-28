// Edit Table Data
const handleEditClick = (row, setEditRowId, setEditedData) => {
  setEditRowId(row.inventory_id);
  setEditedData(row);
  console.log({ row });
};

// Save Edited Data
const handleSaveClick = (
  id,
  editedData,
  setRows,
  setEditRowId,
  setEditedData,
  setShowError,
  setErrorMessage,
  setErrorSeverity
) => {
  setRows((rows) => rows.map((row) => (row.id === id ? editedData : row)));
  setShowError(true);
  setErrorMessage("Material updated successfully.");
  setErrorSeverity("success");
  setEditRowId(null);
  setEditedData({});

  // setTimeout(() => {
  //   setShowError(false);
  //   window.location.reload();
  // }, 2000);
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
  setShowError,
  setErrorSeverity
) => {
  console.log({ editedData });
  if (!editedData.part_name) {
    setErrorMessage("Material Name is required.");
    setShowError(true);
    setErrorSeverity("error");
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

  if (!response.ok) {
    setShowError(response.statusText);
  } else {
    setShowError(true);
    setErrorSeverity("success");
    setErrorMessage("Material added successfully.");

    // setTimeout(() => {
    //   setShowError(false);
    //   window.location.reload();
    // }, 2000);
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
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    setRows(data);

    // setFilteredEntries(data);
    setLoading(false);
  } catch (err) {
    // setError(err.message);
    // setSnackbarMessage(err.message); // Set error message for Snackbar
    // setOpenSnackbar(true); // Show Snackbar with error message
    // setLoading(false);
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

// const confirmDelete = async (
//   token,
//   setRows,
//   deleteRowId,
//   setOpenDeleteDialog,
//   setShowError,
//   setErrorMessage,
//   setErrorSeverity
// ) => {
//   setRows((prevRows) => prevRows.filter((row) => row.id !== deleteRowId));
//   setOpenDeleteDialog(false);

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}/inventory/${deleteRowId}`,
//     {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   if (!response.ok) {
//     setShowError(response.statusText);
//   } else {
//     setShowError(true);
//     setErrorSeverity("success");
//     setErrorMessage("Material deleted successfully.");

//     setTimeout(() => {
//       setShowError(false);
//     }, 2000);
//   }
// };
const confirmDelete = async (
  token,
  setRows,
  deleteRowId,
  setOpenDeleteDialog,
  setShowError,
  setErrorMessage,
  setErrorSeverity
) => {
  try {
    if (!token) throw new Error("No token found");

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

    const data = await response.json(); // IMPORTANT

    if (!response.ok) {
      // Show backend message
      setShowError(true);
      setErrorSeverity("error");
      setErrorMessage(data.error || "Failed to delete item");
      setOpenDeleteDialog(false);
      return false;
    }

    // Remove from UI
    setRows((prev) =>
      prev.filter((row) => row.inventory_id !== deleteRowId)
    );

    setShowError(true);
    setErrorSeverity("success");
    setErrorMessage("Material deleted successfully.");
    setOpenDeleteDialog(false);

    return true;
  } catch (err) {
    setShowError(true);
    setErrorSeverity("error");
    setErrorMessage(err.message || "Error deleting item");
    setOpenDeleteDialog(false);
    return false;
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

// Filter by name and phone number
const filterRows = (rows, searchQuery, filterType) => {
  if (!filterType && !searchQuery) {
    return rows;
  }

  return rows.filter((row) => {
    const matchesFilter = !filterType || row.category === filterType;

    const matchesSearchQuery =
      row.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.inventory_id.includes(searchQuery);

    return matchesFilter && matchesSearchQuery;
  });
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
  scrollToTopButtonDisplay,
  infiniteScroll,
  debounce,
  handleScrollToTop,
};
