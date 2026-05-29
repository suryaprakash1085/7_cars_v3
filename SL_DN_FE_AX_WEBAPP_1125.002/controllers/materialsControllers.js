const handleEditClick = (row, setEditRowId, setEditedData) => {
  setEditRowId(row.inventory_id);
  setEditedData(row);
};

const handleSaveClick = (
  id, editedData, setRows, setEditRowId, setEditedData,
  setShowError, setErrorMessage, setErrorSeverity
) => {
  setRows((rows) => rows.map((row) => (row.id === id ? editedData : row)));
  setShowError(true);
  setErrorMessage("Material updated successfully.");
  setErrorSeverity("success");
  setEditRowId(null);
  setEditedData({});
};

const handleCancelClick = (setEditRowId, setEditedData, setIsAdding) => {
  setEditRowId("");
  setEditedData({});
  setIsAdding(false);
};

const handleInputChange = (e, setEditedData) => {
  const { name, value } = e.target;
  setEditedData((prevData) => ({ ...prevData, [name]: value }));
};

const handleAddClick = (setEditRowId, setEditedData, setIsAdding) => {
  const newRow = { category: "", part_name: "", description: "", quantity: "", price: "" };
  setEditedData(newRow);
  setEditRowId(newRow.id);
  setIsAdding(true);
};

const handleSaveNewRow = async (
  token, editedData, setRows, setEditRowId, setEditedData,
  setIsAdding, setErrorMessage, setShowError, setErrorSeverity
) => {
  if (!editedData.part_name) {
    setErrorMessage("Material Name is required.");
    setShowError(true);
    setErrorSeverity("error");
    return;
  }

  setRows((rows) => [editedData, ...rows]);
  setEditRowId(null);
  setEditedData({});
  setIsAdding(false);
  setShowError(false);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(editedData),
  });

  if (!response.ok) {
    setShowError(response.statusText);
  } else {
    setShowError(true);
    setErrorSeverity("success");
    setErrorMessage("Material added successfully.");
  }
};

export async function fetchInventory(
  token, setRows, limit, offset,
  append = false, setIsLoading, setHasMore, setOffset, totalRef
) {
  try {
    if (!token) throw new Error("No token found. Please log in.");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const json = await response.json();
    const newData = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    const total = json.total ?? newData.length;

    if (append) {
      setRows((prev) => {
        const existingIds = new Set(prev.map((e) => e.inventory_id));
        const unique = newData.filter((e) => !existingIds.has(e.inventory_id));
        return [...prev, ...unique];
      });
    } else {
      setRows(newData);
    }

    if (totalRef) totalRef.current = total;
    if (setIsLoading) setIsLoading(false);

    return { data: newData, total };

  } catch (err) {
    console.error("Error fetching inventory:", err);
    if (setIsLoading) setIsLoading(false);
    return { data: [], total: 0 };
  }
}

const validatePhoneNumber = (phoneNo) => /^\d{10}$/.test(phoneNo);

const handleDeleteClick = (rowId, setDeleteRowId, setOpenDeleteDialog) => {
  setDeleteRowId(rowId);
  setOpenDeleteDialog(true);
};

const confirmDelete = async (
  token, setRows, deleteRowId, setOpenDeleteDialog,
  setShowError, setErrorMessage, setErrorSeverity
) => {
  try {
    if (!token) throw new Error("No token found");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/${deleteRowId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setShowError(true);
      setErrorSeverity("error");
      setErrorMessage(data.error || "Failed to delete item");
      setOpenDeleteDialog(false);
      return false;
    }

    setRows((prev) => prev.filter((row) => row.inventory_id !== deleteRowId));
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

const filterRows = (rows, searchQuery, filterType) => {
  if (!filterType && !searchQuery) return rows;
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

const infiniteScroll = (
  token, setRows, limit, offset, totalRef,
  setIsLoading, setHasMore, setOffset, loadingRef, hasMoreRef
) => {
  if (!hasMoreRef.current) return;
  if (loadingRef.current) return;
  loadingRef.current = true;

  fetchInventory(token, setRows, limit, offset, true, setIsLoading, setHasMore, setOffset, totalRef)
    .then((result) => {
      const newOffset = offset + result.data.length;
      if (newOffset >= totalRef.current) {
        hasMoreRef.current = false;
      } else {
        hasMoreRef.current = true;
      }
      loadingRef.current = false;
    });
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) container.scrollTo({ top: 0, behavior: "smooth" });
};

export {
  handleEditClick, handleSaveClick, handleCancelClick, handleInputChange,
  handleAddClick, handleSaveNewRow, validatePhoneNumber, handleDeleteClick,
  confirmDelete, filterRows, scrollToTopButtonDisplay, infiniteScroll,
  debounce, handleScrollToTop,
};