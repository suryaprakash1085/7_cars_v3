import Cookies from "js-cookie";
// Function to format a date as DD/MM/YYYY
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Function to calculate the number of days between two dates
const calculateDaysBetween = (invoiceDate) => {
  const today = new Date();
  const date = new Date(invoiceDate);
  const timeDiff = Math.abs(today - date);
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// const filterRows = (rows, searchQuery) => {
//   if (!searchQuery) {
//     return rows;
//   }

//   return rows.filter((row) => {
//     const matchesSearchQuery =
//       row.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       String(row.phoneNo).includes(searchQuery) ||
//       String(row.scheduledDate).includes(searchQuery) ||
//       (row.released_date === "" && searchQuery.toLowerCase() === "no date");

//     return matchesSearchQuery;
//   });
// };
const token = Cookies.get("token");
const filterRows = async (
  token,
  filteredFeedbackData,
  setFilteredFeedbackData,
  searchQuery,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  if (searchQuery === "") {
    window.location.reload();
    return filteredFeedbackData;
  }
  try {
    // Make the backend API call to search customers
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/searchFeedback?search=${searchQuery}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    // console.log({ data });

    setFilteredFeedbackData(data);
  } catch (error) {
    // console.log(error);
    setOpenSnackbar(true);
    setSnackbarMessage("Appointment Not Found");
    setSnackbarSeverity("error");
    setFilteredFeedbackData(filteredFeedbackData); // Return existing rows if the fetch fails
  }
};

const startEditing = (index) => {
  // Mark the row as being edited
  const updatedData = [...filteredData];
  updatedData[index].isEditing = true;
  setFilteredData(updatedData);
};

const stopEditing = (index) => {
  // Stop editing and save the changes
  const updatedData = [...filteredData];
  updatedData[index].isEditing = false;
  setFilteredData(updatedData);
};



const fetchFeedback = async (userId, setFeedbackData) => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const feedbackData = await response.json();
    // console.log({ feedbackData });

    let filteredData;

    // Check if any data has lead_owner === userId
    const hasMatch = feedbackData.some(item => item.leads_owner === userId);

    if (hasMatch) {
      filteredData = feedbackData.filter(item => item.leads_owner === userId);
    } else {
      filteredData = feedbackData; // fallback to all data
    }

    setFeedbackData(filteredData);
  } catch (error) {
    console.log("Error fetching feedback:", error);
  }
};




const getScheduledDateBasedOnStatus = (status) => {
  const today = new Date();

  if (status === "Not Attended") {
    // Set to next day
    today.setDate(today.getDate() + 1);
  }

  return formatDate(today);
};

export {
  filterRows,
  calculateDaysBetween,
  fetchFeedback,
  formatDate,
  getScheduledDateBasedOnStatus,
};
