import dayjs from "dayjs";
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "@/components/whatsapp";
import Cookies from "js-cookie";
import axios from "axios";
// Filter by name and phone number
// const filterRows = (rows, searchQuery, filterType) => {
//   if (!filterType && !searchQuery) {
//     return rows;
//   }

//   return rows.filter((row) => {
//     const matchesFilter = !filterType || row.type === filterType;
//     const matchesSearchQuery =
//       row.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       String(row.phoneNo).includes(searchQuery);

//     return matchesFilter && matchesSearchQuery;
//   });
// };

const filterRows = async (
  token,
  rows,
  setRows,
  searchQuery,
  filterType,
  userId,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  try {
    // Make the backend API call to search customers
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/telecallerSearch?search=${searchQuery}&filter=${filterType}&userId=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("filterDataaaaa", data);

    let allCustomerData = [];

    data.map((customer) => {
      if (customer.telecall) {
        let td = JSON.parse(customer.telecall);
        let telecallData = td[td.length - 1];
        customer.telecall = telecallData;
        allCustomerData.push(customer);
      } else {
        allCustomerData.push(customer);
      }
    });

    if (response.ok) {
      setRows(allCustomerData);
    } else if (data.error) {
      setOpenSnackbar(true);
      setSnackbarMessage(data.error);
      setSnackbarSeverity("error");
      return rows; // Return existing rows if there's an error
    }
  } catch (error) {
    console.log({ error: error });
    setOpenSnackbar(true);
    setSnackbarMessage("No matching customers found.");
    setSnackbarSeverity("error");
    return rows; // Return existing rows if the fetch fails
  }
};

const handleEditClick = (row, setEditRowId, setEditedData) => {
  console.log("Editrow", row);
  setEditRowId(row.customer_id);
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
  setSnackbarSeverity,
  limit,
  isLoading,
  setIsLoading,
  setHasMore,
  offset,
  setOffset,
  filterType,
  hasMore,
  userId
) => {
  console.log(" handleSaveClick triggered!");
  console.log(" Initial Edited Data:", editedData);

  if (editedData.telecall?.callStatus === "Don't Call") {
    editedData.type = "Blacklist";
    console.log(" After type change (Blacklist):", editedData);
  }

  // Convert date format
  let formattedDate = editedData.telecall.scheduledDate;
  if (formattedDate && formattedDate.includes("-") && formattedDate.length === 10) {
    const [day, month, year] = formattedDate.split("-");
    if (year.length === 4) {
      formattedDate = `${year}-${month}-${day}`;
    }
  }

  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log("⏳ Current Time:", currentTime);

  let telecallData = {
    type: editedData.type,
    callStatus: editedData.telecall.callStatus,
    scheduledDate: formattedDate,
    currentTime: currentTime,
    callFeedback: editedData.telecall.callFeedback,
    comment: editedData.telecall.comment,
  };

  if (editedData.telecall.callStatus === "Don't Call") {
    telecallData.scheduledDate = new Date().toISOString();
    telecallData.callFeedback = "";
    telecallData.type = "Blacklist";
  }

  console.log(" Final Telecall Data (Before API Call):", telecallData);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/telecallUpdate/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telecallData),
      }
    );

    console.log(" API Response Status:", response.status);
    console.log("API Response:", response);

    if (response.status === 404) {
      console.warn(" Customer not found!");
      setSnackbarMessage("Customer not found");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } else if (response.status === 200) {
      console.log("Customer updated successfully!");

      // Update state with the new type
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (row.customer_id === editedData.customer_id) {
            return {
              ...row,
              type: editedData.type, // Update the type in the state
              telecall: {
                ...row.telecall,
                scheduledDate: formatDate(editedData.telecall.scheduledDate),
                callFeedback: editedData.telecall.callFeedback,
                comment: editedData.telecall.comment,
              },
            };
          }
          return row;
        })
      );

      // Refetch data to ensure UI is updated
      await getAllLeads(
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
        0, // Reset offset if needed
        setOffset,
        filterType,
        userId
      );

      setSnackbarMessage("Customer updated successfully");
      setOpenSnackbar(true);
      setSnackbarSeverity("success");
      setEditRowId("");
      setEditedData({});
    } else if (response.status === 500) {
      console.error(" Error updating customer!");
      setSnackbarMessage("Error updating customer");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
      setEditRowId(null);
      setEditedData({});
    }
  } catch (error) {
    console.error("❌ API Error:", error);
  }
};


const handleCancelClick = (setEditRowId, setEditedData) => {
  setEditRowId("");
  setEditedData({});
};

// const handleInputChange = (e, setEditedData) => {
//   const { name, value } = e.target;
//   setEditedData((prevData) => ({
//     ...prevData,
//     telecall: {
//       ...prevData.telecall,
//       [name]: value,
//       // name === "scheduledDate" ? dayjs(value).format("DD-MM-YYYY") : value,
//     },
//   }));
// };

const handleInputChange = (e, setEditedData) => {
  const { name, value } = e.target;

  if (name === "scheduledDate") {
    // Convert YYYY-MM-DD to DD-MM-YYYY for storage
    const [year, month, day] = value.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    setEditedData((prevData) => ({
      ...prevData,
      telecall: {
        ...prevData.telecall,
        [name]: formattedDate,
      },
    }));
  } else {
    setEditedData((prevData) => ({
      ...prevData,
      telecall: {
        ...prevData.telecall,
        [name]: value,
      },
    }));
  }
};

const handleDeleteRow = (rowId, setDeleteRowId, setOpenDeleteDialog) => {
  setDeleteRowId(rowId);
  setOpenDeleteDialog(true);
};

const confirmDeleteRow = (setRows, deleteRowId, setOpenDeleteDialog) => {
  setRows((prevRows) => prevRows.filter((row) => row.id !== deleteRowId));
  setOpenDeleteDialog(false);
};

// Function to calculate the number of days between two dates
const calculateDays = (invoiceDate) => {
  const today = new Date();
  const date = new Date(invoiceDate);
  const timeDiff = Math.abs(today - date);
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Function to filter data by status
const filterDataByStatus = (status) => {
  if (status === "All") {
    setFilteredData(data);
  } else {
    setFilteredData(data.filter((item) => item.status === status));
  }
};

// Function to handle status change
const handleStatusChange = (index, newStatus) => {
  // Make a copy of the filteredData array
  const updatedData = [...filteredData];

  // Update the status of the selected item
  updatedData[index].status = newStatus;

  // Update the filteredData state with the modified data
  setFilteredData(updatedData);

  // Optionally, update the original data state to reflect the change globally
  const updatedOriginalData = [...data];
  updatedOriginalData[index].status = newStatus;
  setData(updatedOriginalData);
};

const startEditing = (index) => {
  // Mark the row as being edited
  const updatedData = [...filteredData];
  updatedData[index].isEditing = true;
  setFilteredData(updatedData);
};

const handlePendingAmountChange = (index, rows, setRows, newAmount) => {
  // Create a copy of the filtered data to update the pending amount
  const updatedData = [...rows];
  updatedData[index].pendingAmount = newAmount;
  setRows(updatedData);
};

// Add this helper function to get tomorrow's date
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let tomorrowDate = tomorrow.toISOString().split("T")[0];
  // tomorrowDate = dayjs(tomorrowDate).format("DD-MM-YYYY");

  return tomorrowDate;
};

const postpone2months = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 60);
  return tomorrow.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
};

const stopEditing = (index, rows, setRows) => {
  // Stop editing and save the changes
  const updatedData = [...rows];
  updatedData[index].isEditing = false;
  setRows(updatedData);
};

const handleCallStatusChange = (
  index,
  editedData,
  rows,
  setRows,
  newStatus
) => {
  const updatedData = [...rows];
  const currentDate = new Date().toISOString().split("T")[0];

  // Update call status
  updatedData[index].callStatus = newStatus;

  // Reset editedData.telecall
  editedData.telecall = {
    ...editedData.telecall,
    callStatus: newStatus,
    callFeedback: "", // Reset call feedback when status changes
  };

  // Handle different status cases
  switch (newStatus) {
    case "Attended":
      updatedData[index].telecall.scheduledDate = "";
      editedData.telecall.scheduledDate = "";
      break;
    case "Not Attended":
      updatedData[index].telecall.scheduledDate = getTomorrowDate();
      updatedData[index].callFeedback = "";
      updatedData[index].comment = "";// Reset call feedback
      editedData.telecall.scheduledDate = getTomorrowDate();
      break;
    case "Call Back Later":
      updatedData[index].telecall.scheduledDate = ""; // Clear date to allow manual input
      break;
    case "Don't call":
      updatedData[index].telecall.scheduledDate = currentDate;
      updatedData[index].callFeedback = ""; // Reset call feedback
      editedData.telecall.scheduledDate = currentDate;
      break;
  }

  // Update the row's telecall data
  updatedData[index].telecall = {
    ...updatedData[index].telecall,
    callStatus: newStatus,
    callFeedback: "", // Reset call feedback in the row data
  };

  setRows(updatedData);
};

// Add these new handler functions
const handleCallFeedbackChange = (
  index,
  editedData,
  rows,
  setRows,
  newFeedback
) => {
  const updatedData = [...rows];
  updatedData[index].callFeedback = newFeedback;

  // Handle different status cases
  switch (newFeedback) {
    case "Interested":
      updatedData[index].telecall.scheduledDate = "";
      break;
    case "Not Interested":
      // Get date in YYYY-MM-DD format
      const twoMonthsDate = postpone2months();
      updatedData[index].telecall.scheduledDate = twoMonthsDate;
      editedData.telecall.scheduledDate = twoMonthsDate;
      break;
  }

  setRows(updatedData);
};

const getAllLeads = async (
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
  userId
) => {
  setIsLoading(true);
  
  // Ensure limit and offset are numbers
  const numericLimit = Number(limit) || 10;
  const numericOffset = Number(offset) || 0;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/telecallerLeads?limit=${numericLimit}&offset=${numericOffset}&filter=${filterType}&userId=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let newCustomers = await response.json();

    if (response.status === 500) {
      setSnackbarMessage("Error Fetching Customer Data. Please try again.");
      setOpenSnackbar(true);
      setSnackbarSeverity("error");
      setIsLoading(false);
      return;
    }

    if (response.status === 200 || response.status === 201) {
      let allCustomerData = newCustomers.map((customer) => {
        if (customer.telecall) {
          try {
            let td = JSON.parse(customer.telecall);
            customer.telecall = td[td.length - 1];
          } catch (error) {
            customer.telecall = { callStatus: "", scheduledDate: "", callFeedback: "", comment: "" };
          }
        } else {
          customer.telecall = { callStatus: "", scheduledDate: "", callFeedback: "", comment: "" };
        }
        return customer;
      });

      // Convert "DD-MM-YYYY" to a Date object for sorting
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };

      // Convert Date object to "DD-MM-YYYY" for UI display
      const formatToDDMMYYYY = (date) => {
        if (!date) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Sort the data based on scheduledDate (earliest first)
      allCustomerData.sort((a, b) => {
        const dateA = parseDate(a.telecall?.scheduledDate);
        const dateB = parseDate(b.telecall?.scheduledDate);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      });

      setRows((prev) => {
        // Create a Map to store unique customers by customer_id
        const uniqueCustomers = new Map();
        
        // First, add all existing customers to the Map
        prev.forEach(customer => {
          uniqueCustomers.set(customer.customer_id, customer);
        });
        
        // Then add new customers, overwriting any duplicates
        allCustomerData.forEach(customer => {
          uniqueCustomers.set(customer.customer_id, {
            ...customer,
            telecall: {
              ...customer.telecall,
              scheduledDate: formatToDDMMYYYY(parseDate(customer.telecall.scheduledDate)),
            },
          });
        });
        
        // Convert Map back to array
        return Array.from(uniqueCustomers.values());
      });

      setHasMore(newCustomers.length === numericLimit);
      setOffset((prevOffset) => Number(prevOffset) + numericLimit);
    }
  } catch (error) {
    console.error("Error fetching leads:", error);
    setSnackbarMessage("Error fetching customer data");
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
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
    setOffset,
    filterType,
    userId
  ) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Prevent infinite scrolling if searching, loading, or no more data
    if (searchQuery || isLoading || !hasMore) {
      return;
    }

    // Only fetch more when very close to the bottom
    if (scrollHeight - scrollTop <= clientHeight + 50) {
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
        setOffset,
        filterType,
        userId
      );
    }
  },
  300 // Increased debounce delay to prevent rapid firing
);

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
};

// Add this helper function
const formatDate = (dateString) => {
  if (!dateString) return ""; // Return empty string if input is falsy

  const date = new Date(dateString); // Create a new Date object from the string

  if (isNaN(date)) {
    // If the date is invalid, return an empty string or handle error
    return "";
  }

  const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed, so we add 1) and pad
  const year = date.getFullYear(); // Get full year

  return `${day}-${month}-${year}`;
};

const fetchCompanyDetails = async (token, setLimit) => {
  if (!token) {
    console.error("Error: Token is missing");
    return;
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/ss`;
    // console.log("Fetching data from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Full API response:", data); // Log full API response

    // Extract company_details array
    if (
      data?.company_details &&
      Array.isArray(data.company_details) &&
      data.company_details.length > 0
    ) {
      const fetchLimit = data.company_details[0]?.fetch_limit;
      // console.log("Extracted fetch_limit:", fetchLimit);
      setLimit(fetchLimit);
      return data.company_details[0]?.fetch_limit;
    } else {
      console.warn("No company details found in API response.");
      setLimit(null);
    }
  } catch (error) {
    console.error("Error fetching company details:", error.message);
  }
};

export {
  filterRows,
  handleDeleteRow,
  confirmDeleteRow,
  handleInputChange,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handlePendingAmountChange,
  getTomorrowDate,
  stopEditing,
  handleCallStatusChange,
  handleCallFeedbackChange,
  getAllLeads,
  infiniteScroll,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  formatDate,
  fetchCompanyDetails
};
