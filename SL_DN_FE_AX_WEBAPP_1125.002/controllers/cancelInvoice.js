import Cookies from "js-cookie";

function getCompanyCode() {
  return Cookies.get("current_company_code") || Cookies.get("companyCode") || "";
}

export async function fetchEntries(
  token,
  setEntries,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackBarSeverity,
  startDate,
  endDate,
  status,
  limit = 20,
  offset = 0,
  append = false
) {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage("Unauthorized. Please log in with appropriate user credentials.");
      setSnackBarSeverity("error");
      setLoading(false);
      return { data: [], total: 0 };
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (status) params.append("status", status);
    params.append("limit", limit);
    params.append("offset", offset);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

const responseJson = await response.json();
const newData = Array.isArray(responseJson.data) 
  ? responseJson.data 
  : Array.isArray(responseJson) 
    ? responseJson 
    : [];
const total = responseJson.total ?? newData.length;

    if (append) {
      setEntries((prev) => [...prev, ...newData]);
    } else {
      setEntries(newData);
    }

    setLoading(false);
    return { data: newData, total };

  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackBarSeverity("error");
    setLoading(false);
    return { data: [], total: 0 };
  }
}

export const handleSearch = async (searchText, originalEntries, setEntries, token) => {
  try {
    const companyCode = getCompanyCode();

    if (!searchText || searchText.trim() === "") {
      setEntries(originalEntries);
      return;
    }

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
    const arr = Array.isArray(results.data) ? results.data : Array.isArray(results) ? results : [];
    setEntries(arr.filter((e) => e.status === "invoiced"));

  } catch (error) {
    console.error("Search error:", error);
    if (!searchText || searchText.trim() === "") {
      setEntries(originalEntries);
      return;
    }
    const lower = searchText.toLowerCase();
    setEntries(
      originalEntries.filter(
        (tile) =>
          tile.status === "invoiced" &&
          (tile.plateNumber?.toLowerCase().includes(lower) ||
            tile.vehicle_id?.toLowerCase().includes(lower) ||
            tile.customer_name?.toLowerCase().includes(lower) ||
            tile.phone?.toLowerCase().includes(lower))
      )
    );
  }
};

export const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

export const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};



export const companydetails = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching company details:", err);
    throw err;
  }
};