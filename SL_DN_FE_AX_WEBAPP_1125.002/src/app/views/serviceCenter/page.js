"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";

import {
  fetchEntries,
  handleSearch,
} from "../../../../controllers/ServiceCenterControllers.js";

import DynamicListTable from "@/components/DynamicListTable";

export default function ServiceCenter() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [notFound, setNotFound] = useState(false);
const [limit, setLimit] = useState(20);
// const [offset, setOffset] = useState(0);
const offsetRef = React.useRef(0);
const [hasMore, setHasMore] = useState(true);
const isFetching = React.useRef(false);
const handleScroll = async (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;

  if (isFetching.current) return;

if (
  scrollHeight - scrollTop <= clientHeight + 50 &&
  hasMore &&
  !isFetching.current
) {
    isFetching.current = true;

    const nextOffset = offsetRef.current + limit;
    offsetRef.current = nextOffset;

    await fetchEntries(
      setEntries,
      setFilteredEntries,
      setLoading,
      setError,
      setNotFound,
      startDate,
      endDate,
      "released",
      limit,
      nextOffset,
      setHasMore,
      false
    );

    isFetching.current = false;
  }
};
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


  // useEffect(() => {
  //   fetchEntries(setEntries, setFilteredEntries, setLoading, setError,setNotFound, startDate, endDate, "released",limit, 0,  
  
  // setOffset,
  // setHasMore);
  // }, [startDate, endDate]);
useEffect(() => {
  offsetRef.current = 0;// reset pagination state

  fetchEntries(
    setEntries,
    setFilteredEntries,
    setLoading,
    setError,
    setNotFound,
    startDate,
    endDate,
    "released",
    limit,
    0,
    setHasMore,
    true
  );
}, [startDate, endDate]);
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
      minWidth: "120px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "appointment_time",
      label: "Time",
      minWidth: "80px",
    },
    {
      key: "status",
      label: "Status",
      minWidth: "100px",
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

  const handleSearchSubmit = async () => {
    await handleSearch(searchText, "vehicleModel", entries, setFilteredEntries);
  };

  const handleRowClick = (row) => {
    router.push(`/views/serviceCenter/${row.appointment_id}`);
  };

  return (
    <DynamicListTable
      title="Service Center"
      columns={columns}
      data={entries}
      filteredData={filteredEntries}
      loading={loading}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      snackbar={{
        open: false,
        onClose: () => {},
      }}
      dateFilters={dateFilters}
      scrollableTableId="scrollable-table"
       onScroll={handleScroll}
    />
  );
}
