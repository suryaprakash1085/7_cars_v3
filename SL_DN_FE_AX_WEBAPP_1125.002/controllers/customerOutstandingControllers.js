const fetchData = async (
  axios,
  token,
  setData,
  setFilteredData,
  updateStatus,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  startDate,
  endDate
) => {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=customer`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // First, fetch customer details
    const customerResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer?limit=100000`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Fetch appointments to get latest appointment dates
    let appointmentDateMap = {};
    try {
      const appointmentResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Create a map of latest appointment date per customer
      if (Array.isArray(appointmentResponse.data)) {
        appointmentResponse.data.forEach((appointment) => {
          const customerId = appointment.customer_id;
          const appointmentDate = appointment.appointment_date || appointment.invoice_date || appointment.created_at;

          if (customerId && appointmentDate) {
            const date = new Date(appointmentDate);
            if (!appointmentDateMap[customerId] || new Date(appointmentDateMap[customerId]) < date) {
              appointmentDateMap[customerId] = appointmentDate;
            }
          }
        });
      }
      // console.log('Appointments loaded:', appointmentDateMap);
    } catch (appointmentError) {
      console.warn('Error fetching appointments, trying job cards:', appointmentError);
      // Try to fetch from jobCard endpoint as fallback
      try {
        const jobCardResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/jobCard?limit=100000`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (Array.isArray(jobCardResponse.data)) {
          jobCardResponse.data.forEach((jobCard) => {
            const customerId = jobCard.customer_id;
            const jobDate = jobCard.job_date || jobCard.created_at || jobCard.appointment_date;

            if (customerId && jobDate) {
              const date = new Date(jobDate);
              if (!appointmentDateMap[customerId] || new Date(appointmentDateMap[customerId]) < date) {
                appointmentDateMap[customerId] = jobDate;
              }
            }
          });
        }
        // console.log('JobCard data loaded as fallback:', appointmentDateMap);
      } catch (jobCardError) {
        console.warn('Error fetching job cards as fallback:', jobCardError);
      }
    }

    // Create a map of customer details
    const customerMap = {};
    customerResponse.data.forEach(customer => {
      customerMap[customer.customer_id] = {
        customer_name: customer.customer_name,
        phone: customer.contact.phone
      };
    });

    // Transform the data to match the expected format
    const transformedData = response.data.data.map((item) => {
      // Ensure creation_date is properly formatted
      let latestDate = appointmentDateMap[item.customer_id] || item.creation_date;

      // If no date is available, use today's date
      if (!latestDate) {
        latestDate = new Date().toISOString();
      }

      return {
        customer_id: item.customer_id,
        customer: customerMap[item.customer_id]?.customer_name || 'Unknown',
        phone: customerMap[item.customer_id]?.phone || '',
        invoiceDate: item.creation_date,
        status: item.status,
        advance_balance: 0,
        invoiceAmount: parseFloat(item.debit || 0),
        pendingAmount: parseFloat(item.debit || 0),
        paidAmount: parseFloat(item.credit || 0),
        latestAppointmentDate: latestDate
      };
    });

    // Filter by date range BEFORE aggregating to ensure all transactions within range are included
    let filteredByDate = transformedData;
    if (startDate || endDate) {
      filteredByDate = transformedData.filter((item) => {
        let invoiceDate;
        if (item.invoiceDate && typeof item.invoiceDate === 'string') {
          if (item.invoiceDate.includes('-')) {
            const parts = item.invoiceDate.split('-');
            if (parts[0].length === 4) {
              invoiceDate = new Date(item.invoiceDate);
            } else {
              invoiceDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          } else if (item.invoiceDate.includes('/')) {
            const parts = item.invoiceDate.split('/');
            invoiceDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            invoiceDate = new Date(item.invoiceDate);
          }
        } else {
          invoiceDate = new Date(item.invoiceDate);
        }

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

    // Then aggregate the filtered data
    const aggregatedData = aggregateAppointments(filteredByDate);
    const updatedData = updateStatus(aggregatedData);
    setData(updatedData);
    setFilteredData(updatedData); // Show all data initially

  } catch (error) {
    console.error('Error fetching data:', error);
    setOpenSnackbar(true);
    setSnackbarMessage(error.message);
    setSnackbarSeverity("error");
  }
};

function aggregateAppointments(appointments) {
  const result = {};

  appointments.forEach(appointment => {
    const { customer_id } = appointment;
    const key = customer_id;

    if (!result[key]) {
      result[key] = {
        customer_id: customer_id,
        customer: appointment.customer,
        phone: appointment.phone,
        invoiceDate: appointment.invoiceDate,
        advance_balance: 0,
        invoiceAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        status: "pending",
        latestAppointmentDate: appointment.latestAppointmentDate || null
      };
    } else {
      // Update to latest appointment date if this one is newer
      if (appointment.latestAppointmentDate) {
        if (!result[key].latestAppointmentDate) {
          result[key].latestAppointmentDate = appointment.latestAppointmentDate;
        } else {
          const currentDate = new Date(result[key].latestAppointmentDate);
          const newDate = new Date(appointment.latestAppointmentDate);
          if (newDate > currentDate) {
            result[key].latestAppointmentDate = appointment.latestAppointmentDate;
          }
        }
      }
    }

    // Sum up all amounts for this customer
    result[key].invoiceAmount += parseFloat(appointment.invoiceAmount || 0);
    result[key].paidAmount += parseFloat(appointment.paidAmount || 0);
    result[key].pendingAmount = result[key].invoiceAmount - result[key].paidAmount;
  });

  // Calculate status for each customer
  Object.values(result).forEach(entry => {
    if (entry.invoiceAmount === 0) {
      entry.status = "No Transactions";
    } else if (entry.pendingAmount === 0) {
      entry.status = "Fully Paid";
    } else if (entry.paidAmount > 0) {
      entry.status = "Partially Paid";
    } else {
      entry.status = "Pending";
    }
  });

  return Object.values(result);
}

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
      // Handle various date formats (ISO: YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
      let invoiceDate;
      if (item.invoiceDate && typeof item.invoiceDate === 'string') {
        if (item.invoiceDate.includes('-')) {
          const parts = item.invoiceDate.split('-');
          // If first part is 4 digits, it's YYYY-MM-DD format
          if (parts[0].length === 4) {
            invoiceDate = new Date(item.invoiceDate);
          } else {
            // Otherwise it's DD-MM-YYYY format
            invoiceDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else if (item.invoiceDate.includes('/')) {
          const parts = item.invoiceDate.split('/');
          invoiceDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          invoiceDate = new Date(item.invoiceDate);
        }
      } else {
        invoiceDate = new Date(item.invoiceDate);
      }

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
  // const [day, month, year] = invoiceDate.split("/");

  // Ensure that the date is correctly formatted as YYYY-MM-DD
  // const formattedDate = new Date(`${year}-${month}-${day}`);

  // Check if the date is invalid
  // if (isNaN(formattedDate.getTime())) {
  //   return "Invalid Date";
  // }

  // // Get the current date
  // const today = new Date();

  // // Calculate the time difference in milliseconds
  // const timeDiff = today - formattedDate;

  // if (timeDiff < 0) {
  //   return "The given date is in the future";
  // }

  // // Calculate the difference in days
  // const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // // Return the number of days
  // return `${days} days`;
};


// Function to filter by date range
const filterByDateRange = (data, setFilteredData, startDate, endDate) => {
  if (!startDate && !endDate) {
    setFilteredData(data);
    return;
  }

  const filtered = data.filter((item) => {
    // Handle various date formats (ISO: YYYY-MM-DD or DD-MM-YYYY)
    let invoiceDate;
    if (item.invoiceDate && typeof item.invoiceDate === 'string') {
      if (item.invoiceDate.includes('-')) {
        const parts = item.invoiceDate.split('-');
        // If first part is 4 digits, it's YYYY-MM-DD format
        if (parts[0].length === 4) {
          invoiceDate = new Date(item.invoiceDate);
        } else {
          // Otherwise it's DD-MM-YYYY format
          invoiceDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        invoiceDate = new Date(item.invoiceDate);
      }
    } else {
      invoiceDate = new Date(item.invoiceDate);
    }

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
