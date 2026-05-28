export async function fetchEntries(
  token,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  limit,
  hasMore,
  setHasMore,
  offset,
  setOffset,
  setEntries,
  setFilteredEntries,
  setIsLoading,
  setError
) {
  try {
    // Ensure limit and offset are numbers
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer?limit=${numericLimit}&offset=${numericOffset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    // console.log({ data });
    if (data.length > 0) {
      // Transform data to match the expected structure with nested contact object
      const transformedData = data.map((item) => {
        // Check if data already has nested contact structure (from API)
        if (item.contact && typeof item.contact === 'object') {
          // Data already has correct structure, return as-is
          return item;
        }

        // Otherwise, transform from flat structure (for backward compatibility)
        return {
          customer_id: item.customer_id,
          type: item.type,
          leads_owner: item.leads_owner,
          customer_name: item.customer_name,
          contact: {
            phone: item.phone || "",
            email: item.email || "",
            type: item.type || "",
            address: {
              street: item.street || "",
              city: item.city || "",
              state: item.state || "",
            },
          },
        };
      });

      setEntries((prevEntries) => [...prevEntries, ...transformedData]);
      setFilteredEntries((prevFiltered) => [...prevFiltered, ...transformedData]);
      setOffset(numericOffset + numericLimit); // Add numbers, not concatenate strings
    } else {
      setHasMore(false); // No more data to fetch
    }
    setIsLoading(false);
  } catch (error) {
    setError(error.message);
    setOpenSnackbar(true);
    setSnackbarMessage("Error fetching entries");
    setSnackbarSeverity("error");
    setIsLoading(false);
  }
}

export function handleCardClick(customerId, router) {
  router.push(`/views/customer/Salescustomers/${customerId}`);
}

export function handleCustomerSuccess(
  setIsLoading,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) {
  // setIsLoading(true);
  setSnackbarMessage("Customer Added Successfully!");
  setOpenSnackbar(true);
  setSnackbarSeverity("success");
}

export function handleKeyPress(
  event,
  handleSearch,
  searchText,
  selectedOption,
  entries,
  setFilteredEntries
) {
  if (event.key === "Enter") {
    handleSearch(searchText, selectedOption, entries, setFilteredEntries);
  }
}

export function handleOpenModal(setOpenAddCustomerModal) {
  setOpenAddCustomerModal(true);
}

export function handleOptionChange(event, setSelectedOption) {
  setSelectedOption(event.target.value);
}

export async function fetchTotalCustomers(
  token,
  setTotalCustomers,
  setcallowners
) {
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
  // API now returns { total, leads, customer, blacklistedcount }
  setTotalCustomers(
    data && typeof data.total === "number"
      ? data.total
      : data?.customer ?? 0
  );

  try {
    const response1 = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response1.json();
    // console.log({ custDatas: data });
    setcallowners(data);

    // console.log({setLeadsOwnerView})
  } catch (error) {
    console.log(error);
  }
}

export function handleSearch(
  searchText,
  selectedOption,
  entries,
  setFilteredEntries
) {
  if (!searchText) {
    setFilteredEntries(entries);
    return;
  }

  const results = entries.filter((tile) => {
    if (selectedOption === "customerName") {
      return `${tile.customer_name}`
        .toLowerCase()
        .includes(searchText.toLowerCase());
    } else if (selectedOption === "phone") {
      return tile.contact.phone.includes(searchText);
    }
    return false;
  });
  setFilteredEntries(results);
}

export function handleSearchChange(event, setSearchText) {
  setSearchText(event.target.value);
}

export function handleSnackbarClose(setOpenSnackbar) {
  setOpenSnackbar(false);
}

export function handleCloseModal(setOpenAddCustomerModal) {
  setOpenAddCustomerModal(false);
}

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

export const infiniteScroll = debounce(
  (
    e,
    token,
    setEntries,
    setFilteredEntries,
    searchQuery,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    limit,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    offset,
    setOffset,
    setError
  ) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (searchQuery) {
      null;
    } else if (scrollHeight - scrollTop <= clientHeight + 50) {
      // console.log("scroll triggered", limit, offset);
      fetchEntries(
        token,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackbarSeverity,
        limit,
        hasMore,
        setHasMore,
        offset,
        setOffset,
        setEntries,
        setFilteredEntries,
        setIsLoading,
        setError
      );
    }
  },
  200 // 200ms debounce delay
);

export const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

export const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
};

export const convertToCustomer = async (
  token,
  router,
  tile,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) => {
  // console.log(tile);
  let data = {
    customer_id: tile.customer_id,
    customer_name: tile.customer_name,
    type: "Customer Sales",
    email: tile.contact.email,
    phone: tile.contact.phone,
    street: tile.contact.address.street,
    city: tile.contact.address.city,
    state: tile.contact.address.state,
  };

  const addLeadResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/customer/${tile.customer_id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (addLeadResponse.status === 404) {
    setSnackbarMessage("Lead not found");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  } else if (addLeadResponse.status === 200) {
    // window.location.reload();
    router.push(`/views/customer/${tile.customer_id}`);
  } else if (addLeadResponse.status === 500) {
    setSnackbarMessage("Error converting to customer");
    setOpenSnackbar(true);
    setSnackbarSeverity("error");
  }
  setOpenSnackbar(false);
};

export const searchFunction = async (
  token,
  entries,
  setEntries,
  setFilteredEntries,
  searchQuery,
  setOpenSnackbar,
  setSnackbarMessage,
  setcallowners,
  setSnackbarSeverity
) => {
  try {
    // Make the backend API call to search customers
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/search?search=${searchQuery}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    // console.log({ custDatas1: data });
    const modifiedData = [];

    data.forEach((item) => {
      // Check if data already has nested contact structure (from API)
      if (item.contact && typeof item.contact === 'object') {
        // Data already has correct structure
        modifiedData.push(item);
      } else {
        // Transform from flat structure (for backward compatibility)
        let newStructure = {
          customer_id: item.customer_id,
          type: item.type,
          leads_owner: item.leads_owner,
          customer_name: item.customer_name,
          contact: {
            phone: item.phone,
            email: item.email,
            type: item.type,
            address: {
              street: item.street,
              city: item.city,
              state: item.state,
            },
          },
        };
        modifiedData.push(newStructure);
      }
    });

    if (response.ok) {
      setEntries(modifiedData);
      setFilteredEntries(modifiedData);

      try {
        const response1 = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response1.json();

        setcallowners(data);

        // console.log({ custDatas: setcallowners });
      } catch (error) {
        setOpenSnackbar(true);
        setSnackbarMessage("Data not Found.");
        setSnackbarSeverity("error");
        setEntries([]);
        setFilteredEntries([]);
        return entries; // Return existing rows if the fetch fails
      }
    } else {
      setOpenSnackbar(true);
      setSnackbarMessage("Data not Found");
      setSnackbarSeverity("error");
      setEntries([]);
      setFilteredEntries([]);
      return entries; // Return existing rows if there's an error
    }
  } catch (error) {
    setOpenSnackbar(true);
    setSnackbarMessage("Data not Found.");
    setSnackbarSeverity("error");
    setEntries([]);
    setFilteredEntries([]);
    return entries; // Return existing rows if the fetch fails
  }
};

export const fetchCompanyDetails = async (token, setLimit) => {
  if (!token) {
    console.error("Error: Token is missing");
    return null;
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/ss`;
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

    if (data?.company_details && Array.isArray(data.company_details) && data.company_details.length > 0) {
      const fetchLimit = data.company_details[0]?.fetch_limit;
      if (fetchLimit) {
        setLimit(fetchLimit);
        return fetchLimit;
      }
    }
    
    console.warn("No valid fetch limit found in API response.");
    setLimit(10); // Set a default limit if none is found
    return 10;
  } catch (error) {
    console.error("Error fetching company details:", error.message);
    setLimit(10); // Set a default limit on error
    return 10;
  }
};

// export const fetchLeadOwner = async function (storedToken,token,setsaved_owners) {

//     }
//   if (response.ok) {
//     // // Sort the filtered results
//     // const sortedData = data.sort((a, b) => {
//     //   if (a.type === "Blocklisted" && b.type !== "Blocklisted") return 1;
//     //   if (a.type !== "Blocklisted" && b.type === "Blocklisted") return -1;
//     //   return 0;
//     // });
//     const LeadArray = [];
//     data.forEach(element => {
//       LeadArray.push({
//         "name": element.username,
//         "userid": element.user_id
//       });
//     });
//     setaddcustomerssOptions(LeadArray)

//   } else {
//     setaddcustomerssOptions([]);
//   }
// } catch (error) {
//   setaddcustomerssOptions([]);

//   };
//   // showAlert(alertData);
// }
