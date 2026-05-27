async function fetchEntries(
  token,
  setEntries,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackBarSeverity,
  startDate, // new parameter
  endDate  ,  // new parameter
    status,     // new parameter
    include_gst // new parameter
) {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage(
        "Unauthorized. Please log in with appropriate user credentials."
      );
      setSnackBarSeverity("error");
      setLoading(false);
      return;
    }

    // Construct query parameters
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (status) params.append("status", "invoiced");
    if (include_gst) params.append("include_gst", "true");
  

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/gst_allappointments?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    setEntries(data);
    setLoading(false);
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackBarSeverity("error");
    setLoading(false);
  }
}


import Cookies from "js-cookie";

// Helper function to get company_code from cookies
function getCompanyCode() {
  return Cookies.get("current_company_code") || Cookies.get("companyCode") || "";
}

// Function to handle search logic with API call
const handleSearch = async (searchText, originalEntries, setEntries, token) => {
  try {
    const companyCode = getCompanyCode();

    if (!searchText || searchText.trim() === "") {
      // When search is empty, fetch all appointments
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment?`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-company-code": companyCode,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch entries");

      const data = await response.json();
      // Filter to show only invoiced appointments
      const invoicedData = data.filter((entry) => entry.status === "invoiced");
      setEntries(invoicedData);
      return;
    }

    // When search has text, call search API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/search/appointments?q=${encodeURIComponent(searchText)}&company_code=${encodeURIComponent(companyCode)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-company-code": companyCode,
        },
      }
    );

    if (!response.ok) throw new Error("Search failed");

    const results = await response.json();
    // Filter search results to show only invoiced appointments
    const invoicedResults = results.filter((entry) => entry.status === "invoiced");
    setEntries(invoicedResults);
  } catch (error) {
    console.error("Search error:", error);
    // Fallback to client-side search if API fails
    if (!searchText || searchText.trim() === "") {
      setEntries(originalEntries);
      return;
    }

    const lowerSearchText = searchText.toLowerCase();
    const results = originalEntries.filter((tile) => {
      return (
        ((tile.plateNumber && tile.plateNumber.toLowerCase().includes(lowerSearchText)) ||
        (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(lowerSearchText)) ||
        (tile.customer_name && tile.customer_name.toLowerCase().includes(lowerSearchText)) ||
        (tile.phone && tile.phone.toLowerCase().includes(lowerSearchText))) &&
        tile.status === "invoiced"
      );
    });
    setEntries(results);
  }
};

export { fetchEntries, handleSearch };
