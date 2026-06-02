"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { Fab } from "@mui/material";  
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DynamicListTable from "@/components/DynamicListTable.js";
import {
  fetchEntries,
  handleSearch,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  companydetails,
} from "../../../../controllers/cancelInvoice";





export default function CancelInvoice() {
  const router = useRouter();

  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  const [searchText, setSearchText] = useState("");
  const [pageType, setPageType] = useState(null);
  const [showFab, setShowFab] = useState(false);

  const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  //   Refs for scroll pagination
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const searchTextRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");

  const [limit, setLimit] = useState(null);

  useEffect(() => {
  const fetchCompanyDetails = async () => {
    try {
      const details = await companydetails();
      if (details?.company_details?.length > 0) {
        const fetchLimit = Number(details.company_details[0].fetch_limit) || 20;
        setLimit(fetchLimit);
      }
    } catch (err) {
      console.log(err);
    }
  };
  fetchCompanyDetails();
}, []);

  useEffect(() => { searchTextRef.current = searchText; }, [searchText]);
  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);

  // const noOp = () => {};

  //   Initial load / date change
  useEffect(() => {
      if (limit === null) return;
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    tokenRef.current = storedToken;
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    setPageType(Cookies.get("page_type"));

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setEntries([]);
    setOriginalEntries([]);

    fetchEntries(
      storedToken,
      (data) => { setEntries(data); setOriginalEntries(data); },
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      startDate,
      endDate,
      "invoiced",
      limit,
      0,
      false
    ).then((result) => {
      if (!result || result.data.length === 0) {
        hasMoreRef.current = false;
      } else {
        totalRef.current = result.total;
        offsetRef.current = limit;
        hasMoreRef.current = result.total > limit;
      }
      loadingRef.current = false;
    });
  }, [startDate, endDate, limit]);

  //   Scroll handler
  // const handleScroll = (event) => {
  //   scrollToTopButtonDisplay(event, setShowFab);

  //   const { scrollTop, scrollHeight, clientHeight } = event.target;

  //   if (searchTextRef.current) return;
  //   if (!hasMoreRef.current) return;
  //   if (loadingRef.current) return;

  //   if (scrollHeight - scrollTop <= clientHeight + 200) {
  //     console.log("  API calling offset:", offsetRef.current);
  //     loadingRef.current = true;

  //     fetchEntries(
  //       tokenRef.current,
  //      (data) => { setEntries(data); setOriginalEntries(data); },
  //      noOp,
  //       setOpenSnackbar,
  //       setSnackbarMessage,
  //       setSnackBarSeverity,
  //       startDateRef.current,
  //       endDateRef.current,
  //       "invoiced",
  //       limit,
  //       offsetRef.current,
  //       true
  //     ).then((result) => {
  //       if (!result || result.data.length === 0) {
  //         hasMoreRef.current = false;
  //         loadingRef.current = false;
  //       } else {
  //         const newOffset = offsetRef.current + result.data.length;
  //         offsetRef.current = newOffset;
  //         if (newOffset >= totalRef.current) {
  //           hasMoreRef.current = false;
  //           loadingRef.current = false;
  //         } else {
  //           hasMoreRef.current = true;
  //           loadingRef.current = false;
  //         }
  //       }
  //     });
  //   }
  // };
// ========== DIRECT SCROLL LISTENER ==========
useEffect(() => {
  const findAndAttachScroll = setInterval(() => {
    const container = document.getElementById('scrollable-table');
    if (container && !container._scrollAttached) {
      console.log("✅ Found scroll container! Attaching direct scroll listener");
      container._scrollAttached = true;
      
      const handleDirectScroll = (e) => {
        const target = e.currentTarget;
        
        // Show/hide FAB
        if (target.scrollTop > 300) {
          setShowFab(true);
        } else {
          setShowFab(false);
        }

        // Load more data when near bottom
        if (!searchTextRef.current && hasMoreRef.current && !loadingRef.current) {
          const isNearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
          
          if (isNearBottom) {
            console.log("📥 Loading more data at offset:", offsetRef.current);
            loadingRef.current = true;

            fetchEntries(
              tokenRef.current,
              (newData) => {
                // setEntries(prev => [...prev, ...newData]);
                // setOriginalEntries(prev => [...prev, ...newData]);
    //              const newEntries = newData?.data || newData || [];
    // setEntries(prev => [...prev, ...newEntries]);
    // setOriginalEntries(prev => [...prev, ...newEntries]);
             // newData is already an array from fetchEntries
                setEntries(prev => [...prev, ...(Array.isArray(newData) ? newData : [])]);
                setOriginalEntries(prev => [...prev, ...(Array.isArray(newData) ? newData : [])]);
              },
              () => {},
              setOpenSnackbar,
              setSnackbarMessage,
              setSnackBarSeverity,
              startDateRef.current,
              endDateRef.current,
              "invoiced",
              limit,
              offsetRef.current,
              true
            ).then((result) => {
              if (!result || result.data?.length === 0) {
                hasMoreRef.current = false;
              } else {
                offsetRef.current = offsetRef.current + (result.data?.length || 0);
                hasMoreRef.current = offsetRef.current < (result.total || 0);
              }
              loadingRef.current = false;
            }).catch(() => {
              loadingRef.current = false;
            });
          }
        }
      };
      
      container.addEventListener('scroll', handleDirectScroll);
      clearInterval(findAndAttachScroll);
    }
  }, 500);
  
  return () => {
    clearInterval(findAndAttachScroll);
    const container = document.getElementById('scrollable-table');
    if (container && container._scrollAttached) {
      container.removeEventListener('scroll', container._scrollAttached);
      delete container._scrollAttached;
    }
  };
}, [limit]);
// ========== END DIRECT SCROLL LISTENER ==========
  const columns = [
    {
      key: "plateNumber", label: "Plate Number", minWidth: "100px",
      // format: (value, row) => value || row.vehicle_id || "N/A",
     format: (value, row) => {
    // If there's a valid plate number, show it
    if (value && value !== "CounterSales" && value !== "N/A") return value;
    if (row.vehicle_id && row.vehicle_id !== "CounterSales") return row.vehicle_id;
    
    // For counter sales, show the appointment_id (like CTS-800144)
    if (row.appointment_id && row.appointment_id.startsWith('CTS')) {
      return row.appointment_id;
    }
    
    // Check for other ID fields
    if (row.id) return row.id;
    if (row._id) return row._id;
    
    return "N/A";
  },
},
    {
      key: "phone", label: "Phone", minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "appointment_date", label: "Date", minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    { key: "appointment_time", label: "Time", minWidth: "80px" },
    { key: "status", label: "Status", minWidth: "80px" },
  ];

  // const validInvoices = entries.filter(
  //   (entry) => entry.status === "invoiced" && entry.plateNumber !== "CounterSales"
  // );
  const validInvoices = entries;
  const handleSearchSubmit = () => {
    handleSearch(searchText, originalEntries, setEntries, token);
  };

  const handleRowClick = (row) => {
    router.push(`/views/cancelInvoice/${row.appointment_id}`);
  };

  return (
    <>
    <DynamicListTable
      title="Cancel Invoice"
      columns={columns}
      data={entries}
      filteredData={validInvoices}
      loading={loading}
      showNavbar={pageType !== "tab"}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      // onScroll={handleScroll}
      onScroll={() => {}}
      scrollableTableId="scrollable-table"
      onScrollToTop={() => { handleScrollToTop(); setShowFab(false); }}
      showScrollFab={showFab}
      snackbar={{
        open: openSnackbar,
        message: snackbarMessage,
        severity: snackBarSeverity,
        onClose: () => setOpenSnackbar(false),
      }}
      dateFilters={[
        {
          label: "Start Date", value: startDate,
          onChange: (e) => { if (e.target.value !== startDate) setStartDate(e.target.value); },
        },
        {
          label: "End Date", value: endDate,
          onChange: (e) => { if (e.target.value !== endDate) setEndDate(e.target.value); },
        },
      ]}
    />
  {showFab && (
        <Fab
          size="small"
          onClick={() => {
            const container = document.getElementById('scrollable-table');
            if (container) {
              container.scrollTo({ top: 0, behavior: 'smooth' });
            }
            setShowFab(false);
          }}
          style={{
            backgroundColor: "white",
            color: "#1976d2",
            position: "fixed",
            bottom: 40,
            right: 40,
            zIndex: 9999,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}
    </>
  );
}