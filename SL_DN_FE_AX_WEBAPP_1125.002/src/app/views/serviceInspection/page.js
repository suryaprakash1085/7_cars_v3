"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import DynamicListTable from "@/components/DynamicListTable.js";
import {
  fetchEntries,
  handleSearch,
  handleCardClick,
} from "../../../../controllers/ServiceInspectionControllers.js";

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

  useEffect(() => {
    fetchEntries(setEntries, setFilteredEntries, setLoading, setError);
    setPageType(Cookies.get("page_type"));
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

  const filteredInspectionData = filteredEntries.filter(
    (tile) => tile.status === "inspection"
  );

  const handleSearchSubmit = async () => {
    await handleSearch(searchText, selectedOption, entries, setFilteredEntries);
  };

  const handleRowClick = (row) => {
    handleCardClick(router, row.appointment_id);
  };

  return (
    <DynamicListTable
      title="Service Center"
      columns={columns}
      data={entries}
      filteredData={filteredInspectionData}
      loading={loading}
      showNavbar={pageType !== "tab"}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      snackbar={{
        open: false,
      }}
    />
  );
}
