"use client";
import React, { useState, useEffect,useRef,useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import DynamicListTable from "@/components/DynamicListTable.js";
import {
  fetchEntries,
  handleSearch,
  handleCardClick,
} from "../../../../controllers/ServiceInspectionControllers.js";
import { fetchCompanyDetails } from "../../../../controllers/LeadsControllers.js";

import { scrollToTopButtonDisplay, handleScrollToTop } from "../../../../controllers/ServiceInspectionControllers.js";
// const LIMIT = 17;

export default function ServiceInspection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("vehicleModel");
  const [searchText, setSearchText] = useState("");
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [pageType, setPageType] = useState(null);
  const [showFab, setShowFab] = useState(false);
  const [limit,setLimit] = useState(null);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const hasMoreRef = useRef(hasMore);
const isFetchingRef = useRef(false);
const isLoadingMoreRef = useRef(isLoadingMore);
const offsetRef = useRef(offset);

hasMoreRef.current = hasMore;
isLoadingMoreRef.current = isLoadingMore;
offsetRef.current = offset;
// const formatDate = (date) => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const [startDate, setStartDate] = useState(() => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatDate(firstDay);
});

const [endDate, setEndDate] = useState(() => {
  const today = new Date();
  return formatDate(today);
});
// const loadMore = () => {
//   if (!hasMore || isLoadingMore) return;

//   setIsLoadingMore(true);

//   const newOffset = offset + limit;
//   setOffset(newOffset);

//   fetchEntries(
//     setEntries,
//     setFilteredEntries,
//     setLoading,
//     setError,
//     limit,
//     newOffset,
//     setHasMore,
//     startDate,
//     endDate,
//     false
//   ).finally(() => {
//     setIsLoadingMore(false);
//   });
// };
const loadMore = useCallback(async () => {
  console.log("loadMore called", {
    hasMore: hasMoreRef.current,
    isLoadingMore: isLoadingMoreRef.current,
    offset: offsetRef.current,
  });

  // if (!hasMoreRef.current || isLoadingMoreRef.current) return;
if (!hasMoreRef.current || isFetchingRef.current) return;
isFetchingRef.current = true;
  setIsLoadingMore(true);
  const newOffset = offsetRef.current + limit;
  setOffset(newOffset);

  await fetchEntries(
    setEntries,
    setFilteredEntries,
    () => {},
    setError,
    limit,
    newOffset,
    setHasMore,
    startDate,
    endDate,
    false
  );
  isFetchingRef.current = false;
  setIsLoadingMore(false);
}, [startDate, endDate]);
//  useEffect(() => {
//   if (!hasMore) return;

//   let timeout;

//   const handleScroll = () => {
//     clearTimeout(timeout);

//     timeout = setTimeout(() => {
//       if (
//         window.innerHeight + document.documentElement.scrollTop + 100 >=
//         document.documentElement.scrollHeight
//       ) {
//         loadMore();
//       }
//     }, 200);
//   };

//   window.addEventListener("scroll", handleScroll);
//   return () => window.removeEventListener("scroll", handleScroll);
// }, [offset, hasMore, isLoadingMore]);

  // useEffect(() => {
  //   fetchEntries(setEntries, setFilteredEntries, setLoading, setError,limit,offset,setHasMore);
  //   setPageType(Cookies.get("page_type"));
  // }, []);
//   useEffect(() => {
//   fetchEntries(
//     setEntries,
//     setFilteredEntries,
//     setLoading,
//     setError,
    

//     limit,
//     0,
//     setHasMore,
//     startDate,
//     endDate,
//     true
//   );

//   setPageType(Cookies.get("page_type"));
// }, [startDate,endDate]);

const token = Cookies.get("token");

  useEffect(() => {
      // const token = Cookies.get("token");
    if (token) {
      fetchCompanyDetails(token, setLimit);
    }
  }, [token]);



useEffect(() => {
  if(token && limit !== null) {
    isFetchingRef.current = false; 
  setOffset(0);
  setHasMore(true);
  setEntries([]);
  setFilteredEntries([]);

  fetchEntries(
    setEntries,
    setFilteredEntries,
    setLoading,
    setError,
    limit,
    0,
    setHasMore,
    startDate,
    endDate,
    true
  );

  setPageType(Cookies.get("page_type"));
}
}, [startDate, endDate, limit]);


  const columns = [
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "150px",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "100px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("MM/DD/YYYY"),
    },
    {
      key: "appointment_time",
      label: "Time",
      minWidth: "80px",
    },
    {
      key: "status",
      label: "Status",
      minWidth: "80px",
    },
  ];
const dateFilters = [
  {
    label: "Start Date",
    value: startDate,
    onChange: (e) => setStartDate(e.target.value),
  },
  {
    label: "End Date",
    value: endDate,
    onChange: (e) => setEndDate(e.target.value),
  },
];
  // const filteredInspectionData = filteredEntries.filter(
  //   (tile) => tile.status === "inspection"
  // );
// const safeEntries = Array.isArray(filteredEntries) ? filteredEntries : [];

// const filteredInspectionData = safeEntries.filter(
//   (tile) => tile.status === "inspection"
// );
// const filteredInspectionData = filteredEntries.filter(
//   (tile) => tile.status === "inspection"
// );


// const filteredInspectionData = safeEntries.filter(
//   (tile) => tile.status === "inspection"
// );
const filteredInspectionData = (filteredEntries || []).filter(
  (tile) => tile.status === "inspection"
);
// const filteredInspectionData = (filteredEntries || []).map((tile) => ({
//   ...tile,
//   status: "inspection",
// }));
  const handleSearchSubmit = async () => {
    await handleSearch(searchText, selectedOption, entries, setFilteredEntries);
  };
//   const handleScroll = (event) => {
//   const { scrollTop, scrollHeight, clientHeight } = event.target;
//   if (scrollTop + clientHeight >= scrollHeight - 150) {
//     loadMore();
//   }
// };
const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target;

  // Show/hide scroll to top FAB
  if (scrollTop > 200) {
    setShowFab(true);
  } else {
    setShowFab(false);
  }

  // Infinite scroll
  if (scrollTop + clientHeight >= scrollHeight - 150) {
    loadMore();
  }
};
  const handleRowClick = (row) => {
    handleCardClick(router, row.appointment_id);
  };

  return (
    <DynamicListTable
      title="Service Inspection"
      columns={columns}
     data={filteredEntries}

      filteredData={filteredEntries}
      dateFilters={dateFilters}
      loading={loading}
      showNavbar={pageType !== "tab"}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      // isLoadingMore={isLoadingMore}
      showLoadingSpinner={isLoadingMore}
      onScroll={handleScroll}
      scrollToTopDisplay={handleScroll}
showScrollFab={showFab}
onScrollToTop={() => {
  const el = document.getElementById("scrollable-table");
  if (el) el.scrollTop = 0;
  setShowFab(false);
}}
scrollableTableId="scrollable-table"
      snackbar={{
        open: false,
      }}
    />
  );
}
