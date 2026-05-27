const fetchData = async (
  axios,
  token,
  setData,
  setFilteredData,
  updateStatus,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const transformedData = response.data
      .map((item) => ({
        customer: item.customer_name,
        invoiceDate: item.invoice_date,
        status: item.paid_status,
        phone: item.phone,
        advance_balance: item.advance_balance,
        invoiceAmount: item.invoice_amount,
        pendingAmount: item.invoice_amount - item.paid_amount,
      }))
      .filter((item) => item.invoiceDate);

    const updatedData = updateStatus(transformedData);

    // Calculate current week's start and end dates
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Filter data for the current week
    const currentWeekData = updatedData.filter((item) => {
      const [day, month, year] = item.invoiceDate.split("/");
      const invoiceDate = new Date(`${year}-${month}-${day}`);
      invoiceDate.setHours(0, 0, 0, 0);
      return invoiceDate >= startOfWeek && invoiceDate <= endOfWeek;
    });

    setData(updatedData);
    setFilteredData(currentWeekData);
    console.log(currentWeekData);
  } catch (error) {
    setOpenSnackbar(true);
    setSnackbarMessage(error.message);
    setSnackbarSeverity("error");
  }
};

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

// Function to filter data by status and date range
const filterDataByStatus = (status, data, setFilteredData, startDate, endDate) => {
  let filteredData = data;

  if (status !== "All") {
    filteredData = filteredData.filter((item) => item.status === status);
  }

  if (startDate || endDate) {
    filteredData = filteredData.filter((item) => {
      const [day, month, year] = item.invoiceDate.split("/");
      const invoiceDate = new Date(`${year}-${month}-${day}`);
      invoiceDate.setHours(0, 0, 0, 0);

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      if (start && end) {
        return invoiceDate >= start && invoiceDate <= end;
      } else if (start) {
        return invoiceDate >= start;
      } else if (end) {
        return invoiceDate <= end;
      }
      return true;
    });
  }
  setFilteredData(filteredData);
};

const updateCount = (
  data,
  setNumberOfPaid,
  setNumberOfOverdue,
  setNumberOfPending
) => {
  const paidCount = data.filter((item) => item.status === "Paid").length;
  const overdueCount = data.filter((item) => item.status === "Overdue").length;
  const pendingCount = data.filter((item) => item.status === "Pending").length;

  setNumberOfPaid(paidCount);
  setNumberOfOverdue(overdueCount);
  setNumberOfPending(pendingCount);
};

const calculateDays = (invoiceDate) => {
  // Split the input date (day/month/year) into components
  const [day, month, year] = invoiceDate.split("/");

  // Ensure that the date is correctly formatted as YYYY-MM-DD
  const formattedDate = new Date(`${year}-${month}-${day}`);

  // Check if the date is invalid
  if (isNaN(formattedDate.getTime())) {
    return "Invalid Date";
  }

  // Get the current date
  const today = new Date();

  // Calculate the time difference in milliseconds
  const timeDiff = today - formattedDate;

  if (timeDiff < 0) {
    return "The given date is in the future";
  }

  // Calculate the difference in days
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // Return the number of days
  return `${days} days`;
};


// Function to filter by date range
const filterByDateRange = (data, setFilteredData, startDate, endDate) => {
  if (!startDate && !endDate) {
    setFilteredData(data);
    return;
  }

  const filtered = data.filter((item) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for proper date comparison
    const [day, month, year] = item.invoiceDate.split("-");
    const invoiceDate = new Date(`${year}-${month}-${day}`);

    // Remove time portion from dates for accurate comparison
    invoiceDate.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (start && end) {
      return invoiceDate >= start && invoiceDate <= end;
    } else if (start) {
      return invoiceDate >= start;
    } else if (end) {
      return invoiceDate <= end;
    }
    return true;
  });

  setFilteredData(filtered);
};

export {
  fetchData,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  filterDataByStatus,
  updateCount,
  calculateDays,
  filterByDateRange,
};
