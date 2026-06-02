import Cookies from "js-cookie";
// import * as XLSX from "xlsx";

const getAllLeads = async (
  token,
  setRows,
  showAlert,
  limit,
  isLoading,
  setIsLoading,
  hasMore,
  setHasMore,
  offset,
  setOffset,
  filterType,
  setAllCount
) => {
  // if (filterType == "BlackList" || filterType == "Lead") {
  //   setRows([]);
  // }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/customer/leads?limit=${limit}&offset=${offset}&type=${filterType}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    let newCustomers = await response.json();

    if (response.status === 500) {
      const alertData = {
        openAlert: true,
        message: "Error Fetching Customer Data. Please try again.",
        severity: "error",
        duration: 2000,
      };
      showAlert(alertData);
      setIsLoading(false);
    } else if (response.status === 200 || response.status === 201) {
      // Filter data based on filterType
      if (filterType === "Lead") {
        newCustomers = newCustomers.filter(
          (customer) => customer.type !== "BlackList"
        );
      } else if (filterType === "BlackList") {
        newCustomers = newCustomers.filter(
          (customer) => customer.type === "BlackList"
        );
      }else if (filterType === "All") {
        // No filtering needed for "All"

      }


      // Sort the customers
      newCustomers.sort((a, b) => {
        if (a.type === "BlackList" && b.type !== "BlackList") return 1;
        if (a.type !== "BlackList" && b.type === "BlackList") return -1;
        return 0;
      });

      setAllCount(newCustomers.length);

      setRows((prev) => {
        const combinedRows = [...prev, ...newCustomers];
        return combinedRows.sort((a, b) => {
          if (a.type === "Blocklisted" && b.type !== "Blocklisted") return 1;
          if (a.type !== "Blocklisted" && b.type === "Blocklisted") return -1;
          return 0;
        });
      });

      setHasMore(newCustomers.length > 0);

      setOffset((prevOffset) => {
        const newOffset = parseInt(prevOffset) + parseInt(limit);
        return newOffset;
      });
    }
  } catch (error) {
    console.error("Error in getAllLeads:", error);
    const alertData = {
      openAlert: true,
      message: "Error fetching data. Please try again.",
      severity: "error",
      duration: 2000,
    };
    showAlert(alertData);
  } finally {
    setIsLoading(false);
  }
};

const fetchLeadsData = async (
  token,
  selectedUserId,
  setRows,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackBarSeverity
) => {
  if (!token) {
    console.error("Error: Token is missing");
    return;
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/customer/leadsowner/search?leads_owner=${selectedUserId}`;

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

    let data = await response.json();

    if (!data || data.length === 0) {
      // Show RED Snackbar when no data is found
      setSnackbarMessage("User Data not found");
      setSnackBarSeverity("error"); // RED color
      setOpenSnackbar(true);
      // throw new Error("Data not found"); // Force error to be thrown
    }

    // setRows({data}); // Update state with new data

    // setSnackbarMessage("user Selete successfully!");
    //     setSnackBarSeverity("success"); // Green color
    //     setOpenSnackbar(true);
  } catch (error) {
    console.log("Error fetching leads:", error.message);
    setSnackbarMessage(error.message || "Failed to fetch data");
    setSnackBarSeverity("error"); // RED color for errors
    setOpenSnackbar(true);
  }
};

// Filter by name and phone number
const filterRows = async (
  token,
  rows,
  setRows,
  searchQuery,
  filterType,
  showAlert,
  hasMore,
  setHasMore,
  limit,
  offset,
  setOffset
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/leads/search?search=${searchQuery}&filter=${filterType || "All"}&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      const sortedData = data.sort((a, b) => {
        if (a.type === "BlackListed" && b.type !== "BlackList") return 1;
        if (a.type !== "BlackList" && b.type === "BlackList") return -1;
        return 0;
      });

      setRows(sortedData);
      setOffset(offset + limit);
      setHasMore(data.length === limit);

      if (sortedData.length === 0) {
        showAlert({
          openAlert: true,
          message: "No data found",
          severity: "warning",
          duration: 2000,
        });
      }
    } else {
      setRows([]);
      showAlert({
        openAlert: true,
        message: "User not found. Please try again or contact support.",
        severity: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    setRows([]);
    showAlert({
      openAlert: true,
      message: "Network error. Please try again.",
      severity: "error",
      duration: 2000,
    });
  }
};


// const filterRows = async (
//   token,
//   rows,
//   setRows,
//   searchQuery,
//   filterType,
//   showAlert,
//   hasMore,
//   setHasMore,
//   limit,
//   offset,
//   setOffset
// ) => {
//   try {
//     const response = await fetch(
//       `${
//         process.env.NEXT_PUBLIC_API_URL
//       }/customer/leads/search?search=${searchQuery}&filter=${
//         filterType || "All"
//       }&limit=${limit}&offset=${offset}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     setHasMore(hasMore);

//     const data = await response.json();

//     if (response.ok) {
//       // Sort the filtered results
//       const sortedData = data.sort((a, b) => {
//         if (a.type === "BlackListed" && b.type !== "BlackList") return 1;
//         if (a.type !== "BlackList" && b.type === "BlackList") return -1;
//         return 0;
//       });
//       setRows(sortedData);
//       setOffset(offset + limit);
//     } else {
//       setRows([]);
//     }
//   } catch (error) {
//     setRows([]);
//     const alertData = {
//       openAlert: true,
//       message: "Error fetching search results. Please try again.",
//       severity: "error",
//       duration: 2000,
//     };


    
//     if (sortedData.length === 0) {
//   const alertData = {
//     openAlert: true,
//     message: "No data found",
//     severity: "warning",
//     duration: 2000,
//   };
//   showAlert(alertData);
// }
//   }
 
// };

// const handleExcelUpload = async (token, event, showAlert, setIsLoading) => {
//   const file = event.target.files[0];

//   const formData = new FormData();
//   formData.append("file", file); // Append the file to the FormData object

//   setIsLoading(true);

//   const addLeadResponse = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}/customer/leads/bulkUpload`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData, // Send the FormData containing the file
//     }
//   );

//   const responseBody = await addLeadResponse.json();
//   console.log({ bulkUpload: responseBody });

//   if (addLeadResponse.status === 400) {
//     let alertData = {
//       openAlert: true,
//       message: "Data Not Properly Sent",
//       severity: "error",
//     };
//     showAlert(alertData);
//   } else if (addLeadResponse.status === 201) {
//     let alertData = {
//       openAlert: true,
//       message: `Total Customers Processed: ${responseBody.success}, Duplicates: ${responseBody.duplicate}, Insufficient Data: ${responseBody.insufficient}`,
//       severity: "success",
//       duration: 2000,
//     };
//     showAlert(alertData);

//     setTimeout(() => {
//       // window.location.reload();
//     }, 2000);
//     setIsLoading(false);
//   } else if (addLeadResponse.status === 500) {
//     let alertData = {
//       openAlert: true,
//       message: "Error creating customers and vehicles",
//       severity: "error",
//     };
//     showAlert(alertData);
//   }
// };

import * as XLSX from "xlsx";

const handleExcelUpload = async (
  token,
  event,
  showAlert,
  setIsLoading,
  setLoadingDialogue
) => {
  const file = event.target.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  // setLoadingDialogue("Uploading Please Wait");
  setIsLoading(true);

  try {
    const addLeadResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/leads/bulkUpload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    // Check if the response is an Excel file (from backend)
    const contentType = addLeadResponse.headers.get("Content-Type");
    if (
      contentType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const blob = await addLeadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "failed_uploads.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // Handle JSON response
      const responseBody = await addLeadResponse.json();
      // console.log({ bulkUpload: responseBody });

      if (addLeadResponse.status === 400) {
        showAlert({
          openAlert: true,
          message: "Data Not Properly Sent",
          severity: "error",
        });
      } else if (addLeadResponse.status === 201) {
        showAlert({
          openAlert: true,
          message: `Total Customers Processed: ${responseBody.success}, Duplicates: ${responseBody.duplicate}, Insufficient Data: ${responseBody.insufficient}`,
          severity: "success",
          duration: 2000,
        });

        // Check if there are failed records and download as Excel
        if (
          responseBody.failedDetails?.failedCustomers?.length > 0 ||
          responseBody.failedDetails?.failedVehicles?.length > 0
        ) {
          downloadFailedDataAsExcel(
            responseBody.failedDetails.failedCustomers,
            responseBody.failedDetails.failedVehicles
          );
        }

        setTimeout(() => {
          // window.location.reload();
        }, 2000);
      } else if (addLeadResponse.status === 500) {
        showAlert({
          openAlert: true,
          message: "Error creating customers and vehicles",
          severity: "error",
        });
      }
    }
  } catch (error) {
    // console.log("Upload Error:", error);
    showAlert({
      openAlert: true,
      message: "An error occurred while uploading",
      severity: "error",
    });
  } finally {
    setIsLoading(false);
  }
};

// Helper function to generate and download an Excel file
const downloadFailedDataAsExcel = (
  failedCustomers = [],
  failedVehicles = []
) => {
  const workbook = XLSX.utils.book_new();

  if (failedCustomers.length > 0) {
    const customerSheet = XLSX.utils.json_to_sheet(failedCustomers);
    XLSX.utils.book_append_sheet(workbook, customerSheet, "Failed Customers");
  }

  if (failedVehicles.length > 0) {
    const vehicleSheet = XLSX.utils.json_to_sheet(failedVehicles);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, "Failed Vehicles");
  }

  // Create and trigger the file download
  XLSX.writeFile(workbook, "failed_uploads.xlsx");
};

const convertToCustomer = async (token, router, row, user) => {
  // Get current user's ID from cookies
  const userId = Cookies.get("userId"); // Add this line to get userId from cookies

  row.type = "Customer Sales";
  row.telecallername = user;
  row.leads_owner = userId; // Set the leads_owner to the current user's ID
  const custid = row.customer_id;
  // current logged in user
  // const current_user = Cookies.get(`userName`);
  // row.telecallername = current_user;

  try {
    const addLeadResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/${custid}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(row),
      }
    );

    if (addLeadResponse.status === 404) {
      showAlert({
        openAlert: true,
        message: "Lead not found",
        severity: "error",
        duration: 2000,
      });
    } else if (addLeadResponse.status === 200) {
      // console.log("Success: Lead converted to customer");
      router.push(`/views/customer/Salescustomers/${custid}`);
    } else if (addLeadResponse.status === 500) {
      // console.log("Error: Internal Server Error");
      showAlert({
        openAlert: true,
        message: "Error converting to customer",
        severity: "error",
        duration: 5000,
      });
    }
    // setOpenSnackbar(false);
  } catch (error) {
    console.error("Fetch request failed:", error);
    showAlert({
      openAlert: true,
      message: "Network error occurred",
      severity: "error",
      duration: 5000,
    });
  }
};

const getTotalLeadsCount = async (
  token,
  setLeadsCount,
  setBlacklistedCount
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/total/count`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
console.log("Total Leads API Response:", data);

    if (response.ok) {
      setLeadsCount(data.leads);
      setBlacklistedCount(data.blacklistedcount);
      
    } else {
      // console.log("Error fetching total leads count:", data.error);
    }
  } catch (error) {
    // console.log("Error fetching total leads count:", error);
  }
  
};

// // Get total count of blacklisted leads
// const getTotalBlacklistedCount = async (token, setBlacklistedCount) => {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/customer/getotal/sum?type=blacklisted`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const data = await response.json();

//     if (response.ok) {
//       setBlacklistedCount(data.total); // Set the blacklisted count in state
//     } else {
//       console.log("Error fetching total blacklisted count:", data.error);
//     }
//   } catch (error) {
//     console.log("Error fetching total blacklisted count:", error);
//   }
// };

// Add this new function
const exchangeLeads = async (
  token,
  fromUserId,
  toUserId,
  customerIds,
  showAlert
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/leads_owner/exchange`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_userid: fromUserId,
          to_userid: toUserId,
          selected_customer_ids: customerIds,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showAlert({
        openAlert: true,
        message: "Leads exchanged successfully",
        severity: "success",
        duration: 2000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return true;
    } else {
      showAlert({
        openAlert: true,
        message: data.message || "Failed to exchange leads",
        severity: "error",
        duration: 2000,
      });
      return false;
    }
  } catch (error) {
    showAlert({
      openAlert: true,
      message: "Error exchanging leads",
      severity: "error",
      duration: 2000,
    });
    return false;
  }
};

// Function to handle Enter key press
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
     setLimit(Number(fetchLimit)); // instead of setLimit(fetchLimit)
      return data.company_details[0]?.fetch_limit;
    } else {
      console.warn("No company details found in API response.");
      setLimit(null);
    }
  } catch (error) {
    console.error("Error fetching company details:", error.message);
  }
};

const handleScrollToEnd = (
  hasMore,
  isLoading,
  token,
  setRows,
  showAlert,
  limit,
  setIsLoading,
  setHasMore,
  offset,
  setOffset,
  filterType,
  setAllCount,
  isFetching,
  setIsFetching
) => {
  if (hasMore && !isLoading && !isFetching) {
    setIsFetching(true);
    getAllLeads(
      token,
      setRows,
      showAlert,
      limit,
      isLoading,
      setIsLoading,
      hasMore,
      setHasMore,
      offset,
      setOffset,
      filterType,
      setAllCount
    ).finally(() => {
      setIsFetching(false);
    });
  }
};

export {
  filterRows,
  handleExcelUpload,
  getAllLeads,
  getTotalLeadsCount,
  // getTotalBlacklistedCount,
  convertToCustomer,
  exchangeLeads,
  fetchLeadsData,
  fetchCompanyDetails,
  handleScrollToEnd,
};
