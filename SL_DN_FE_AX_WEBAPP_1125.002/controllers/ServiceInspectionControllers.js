import serviceInspection from "../src/app/views/serviceInspection/page";
import Cookies from "js-cookie";
// Function to fetch entries from the backend
export async function fetchEntries(
  setEntries,
  setFilteredEntries,
  setLoading,
  setError,
  
  limit,
  offset,
  setHasMore,
  startDate,
  endDate,
  reset=false
){
  try {
    const token = Cookies.get("token");
    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

//     const response = await fetch(
//   `${process.env.NEXT_PUBLIC_API_URL}/appointment?limit=${limit}&offset=${offset}&status=inspection`,
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
// );
const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      status: "inspection",
      limit,
      offset,
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

const list = Array.isArray(data)
  ? data
  : data?.data || data?.result || [];
  if (list.length < limit) {
  setHasMore(false);
}

// setEntries(list);
// setFilteredEntries(list);
// setEntries((prev) => [...prev, ...list]);
// setFilteredEntries((prev) => [...prev, ...list]);
setEntries((prev) => (reset ? list : [...prev, ...list]));
setFilteredEntries((prev) => (reset ? list : [...prev, ...list]));
    setLoading(false);
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
      // Filter for "inspection" status for service inspection page
      const filteredResults = data.filter((sd) => sd.status === "inspection");
      setFilteredEntries(filteredResults);
    } else {
      // Fallback to client-side filtering if API fails
      const results = entries.filter((tile) => {
        const query = searchText.toLowerCase();
        return (
          tile.status === "inspection" &&
          ((tile.plateNumber && tile.plateNumber.toLowerCase().includes(query)) ||
            (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(query)) ||
            (tile.customer_id && tile.customer_id.includes(query)) ||
            (tile.customer_name && tile.customer_name.toLowerCase().includes(query)))
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
        tile.status === "inspection" &&
        ((tile.plateNumber && tile.plateNumber.toLowerCase().includes(query)) ||
          (tile.vehicle_id && tile.vehicle_id.toLowerCase().includes(query)) ||
          (tile.customer_id && tile.customer_id.includes(query)) ||
          (tile.customer_name && tile.customer_name.toLowerCase().includes(query)))
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
  // console.log("Appointment ID:", appointmentId);
  router.push(`/views/serviceInspection/${appointmentId}`);
};
