
import Cookies from "js-cookie";
// import serviceCenter from "../src/app/views/serviceCenter/page";

// Function to fetch entries from the backend
export async function fetchEntries(
  setEntries,
  setFilteredEntries,
  setLoading,
  setError,
  setNotFound,
  startDate,
  endDate,
  status,
  limit,
  offset,
  setHasMore,
  reset = false
) {
  try {
    const token = Cookies.get("token");
    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

 const params = new URLSearchParams({   
      ...(startDate && { startDate: startDate }),
      ...(endDate && { endDate: endDate }),
       ...(status && { status: status }),
     ...(limit && { limit }),
  // ...(offset >= 0 && { offset }),
  ...(offset !== undefined && { offset }),
});

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    // console.log("data", data);
    // const filteredServiceData = data.filter((sd) => {
    //   return sd.status=="released" 
    // }) 
    console.log("filteredServiceData", data);
    // setEntries(data);
    // setFilteredEntries(data);
//     setEntries(Array.isArray(data) ? data : data.data || []);
// setFilteredEntries(Array.isArray(data) ? data : data.data || []);
// const safeData =
//   Array.isArray(data?.data)
//     ? data.data
//     : Array.isArray(data)
//     ? data
//     : [];
const safeData = Array.isArray(data)
  ? data
  : Array.isArray(data?.data)
  ? data.data
  : Array.isArray(data?.data?.list)
  ? data.data.list
  : [];
if (safeData.length < limit) {
  setHasMore(false);
} else {
  setHasMore(true);
}
// setEntries(safeData);
// setFilteredEntries(safeData);
// setEntries((prev) => [...prev, ...safeData]);
// setFilteredEntries((prev) => [...prev, ...safeData]);
// setEntries((prev) => (offset === 0 ? safeData : [...prev, ...safeData]));
setEntries((prev) => {
  return reset ? safeData : [...prev, ...safeData];
});

setFilteredEntries((prev) => {
  return reset ? safeData : [...prev, ...safeData];
});
// setOffset((prev) => prev + limit);
    setLoading(false);
    // if (data.length === 0) {
    //   setNotFound(true);
    // } else {
    //   setNotFound(false);
    // }
    if (safeData.length === 0) {
  setNotFound?.(true);
} else {
  setNotFound?.(false);
}
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
}

// Function to handle option changes
export const handleOptionChange = (event, setSelectedOption) => {
  setSelectedOption(event.target.value);
};

// Function to handle search input changes
export const handleSearchChange = (event, setSearchText) => {
  setSearchText(event.target.value);
};

// Function to handle search logic
export const handleSearch = async (
  searchText,
  selectedOption,
  entries,
  setFilteredEntries
) => {
  if (!searchText) {
    setFilteredEntries(entries);
    return;
  }

  try {
    const token = Cookies.get("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/search/appointments?q=${encodeURIComponent(searchText)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Filter for "released" status since we only show released appointments
      const filteredResults = data.filter((sd) => sd.status === "released");
      setFilteredEntries(filteredResults);
    } else {
      // Fallback to client-side filtering if API fails
      const results = entries.filter((tile) => {
        const query = searchText.toLowerCase();
        return (
          (tile.plateNumber && tile.plateNumber.toLowerCase().includes(query)) ||
          (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(query)) ||
          (tile.customer_id && tile.customer_id.includes(query)) ||
          (tile.customer_name && tile.customer_name.toLowerCase().includes(query))
        );
      });
      setFilteredEntries(results);
    }
  } catch (error) {
    console.error("Error searching appointments:", error);
    // Fallback to client-side filtering
    const results = entries.filter((tile) => {
      const query = searchText.toLowerCase();
      return (
        (tile.plateNumber && tile.plateNumber.toLowerCase().includes(query)) ||
        (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(query)) ||
        (tile.customer_id && tile.customer_id.includes(query)) ||
        (tile.customer_name && tile.customer_name.toLowerCase().includes(query))
      );
    });
    setFilteredEntries(results);
  }
};

// Function to handle "Enter" key press for search
export const handleKeyPress = (event, handleSearch) => {
  if (event.key === "Enter") {
    handleSearch();
  }
};

// Function to handle card click
export const handleCardClick = (router, appointmentId) => {
  console.log("Appointment ID:", appointmentId);
  router.push(`/views/serviceCenter/${appointmentId}`);
};
