const fetchEntries = async (
  token,
  setEntries,
  setFilteredEntries,
  setLoading,
  setTotalVehicleInService,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackBarSeverity,
  showDeleted,
  startDate,
  endDate,
  searchQuery,
  limit = 20,
  offset = 0,
  append = false
) => {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage("Unauthorized. Please log in with appropriate user credentials.");
      setSnackBarSeverity("error");
      setLoading(false);
      return { data: [], total: 0 };
    }

    let apiUrl;

    if (searchQuery && searchQuery.trim()) {
      //   search endpoint — no pagination needed
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointment/search/appointments?q=${encodeURIComponent(searchQuery)}`;
    } else {
      //   all statuses
      const statuses = showDeleted
        ? ["invoiced", "invoice", "deleted", "released", "scheduled"]
        : ["invoiced", "invoice", "released", "scheduled","deleted"];

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      statuses.forEach((s) => params.append("status", s));
      params.append("limit", limit);
      params.append("offset", offset);

      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`;
    }

    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setOpenSnackbar(true);
      setSnackbarMessage("Failed to fetch. Please try again.");
      setSnackBarSeverity("error");
      return { data: [], total: 0 };
    }

    const json = await response.json();

    //   handle both array and paginated response
    const rawData = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    const total = json.total ?? rawData.length;

    //   filter null customer_id
    const filteredData = rawData.filter(
      (entry) =>
        entry.customer_id !== null &&
        entry.customer_id !== "" &&
        entry.customer_id !== "N/A"
    );

    const displayData = showDeleted
      ? filteredData
      : filteredData.filter((item) => item.status !== "deleted");

    if (append) {
      setEntries((prev) => [...prev, ...displayData]);
      setFilteredEntries((prev) => [...prev, ...displayData]);
    } else {
      setEntries(displayData);
      setFilteredEntries(displayData);
      setTotalVehicleInService(displayData.length);
    }

    setLoading(false);
    return { data: displayData, total };

  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage("Failed to fetch. Please try again.");
    setSnackBarSeverity("error");
    setLoading(false);
    return { data: [], total: 0 };
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

export { fetchEntries };