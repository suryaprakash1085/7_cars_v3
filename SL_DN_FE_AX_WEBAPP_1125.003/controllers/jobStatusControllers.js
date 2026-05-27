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
  searchQuery
) => {
  try {
    if (!token) {
      //   setError("No token found. Please log in.");
      setOpenSnackbar(true);
      setSnackbarMessage(
        "Unauthorized. Please log in with appropriate user credentials."
      );
      setSnackBarSeverity("error");
      setLoading(false);
      return;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointment`;

    // Use search endpoint if searchQuery is provided, otherwise use the main endpoint
    if (searchQuery && searchQuery.trim()) {
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointment/search/appointments?q=${encodeURIComponent(searchQuery)}`;
    } else if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`;
    }

    // console.log("Fetching from URL:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setOpenSnackbar(true);
      setSnackbarMessage("Failed to fetch . Please try again.");
      setSnackBarSeverity("error");
    }

    const data = await response.json();

    //customer_id is null or empty or N/A then remove the entry
    const filteredData = data.filter(
      (entry) =>
        entry.customer_id !== null ||
        entry.customer_id !== "" ||
        entry.customer_id !== "N/A"
    );

    // console.log({ filteredData });

    if (showDeleted) {
      setEntries(filteredData);
      setTotalVehicleInService(filteredData.length);
      setFilteredEntries(filteredData);
      return;
    } else {
      let data = filteredData.filter((item) => item.status !== "deleted");
      // console.log(data);
      setEntries(data);
      setTotalVehicleInService(filteredData.length);
      setFilteredEntries(filteredData);
    }

    setLoading(false);
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage("Failed to fetch . Please try again.");
    setSnackBarSeverity("error");
    setLoading(false);
  }
};

export { fetchEntries };
