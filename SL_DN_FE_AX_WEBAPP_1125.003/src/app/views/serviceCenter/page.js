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

  useEffect(() => {
    fetchEntries(setEntries, setFilteredEntries, setLoading, setError, () => {});
  }, []);

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
      scrollableTableId="scrollable-table"
    />
  );
}
