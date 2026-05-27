"use client";
//? React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

//? Function imports
import {
  fetchEntries,
  handleCardClick,
  handleCustomerSuccess,
  handleOpenModal,
  handleSnackbarClose,
  handleCloseModal,
  scrollToTopButtonDisplay,
  handleScrollToTop,
  infiniteScroll,
  searchFunction,
  fetchTotalCustomers,
  fetchCompanyDetails,
} from "../../../../../controllers/customerControllers.js";
import Cookies from "js-cookie";

//? Component imports
import DynamicListTable from "@/components/DynamicListTable.js";
import AddCustomer from "@/components/addcust";
import OldCustomerModal from "@/components/OldCustomerModal";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

//? UI package imports
import {
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";

//? Icon imports
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { Tooltip } from "@mui/material";

export default function UserEntry() {
  const router = useRouter();

  //? FrontEnd extracted data states
  let [token, setToken] = useState(null);

  //? Modal and Alert states
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openOldCustomerModal, setOpenOldCustomerModal] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showFab, setShowFab] = useState(false);
  const [selectedOldCustomer, setSelectedOldCustomer] = useState(null);

  //? FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(0);

  //? Backend Data states
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [CallOwners, setcallowners] = useState([]);

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);

    const initializeData = async () => {
      try {
        // First fetch total customers and call owners
        await fetchTotalCustomers(storedToken, setTotalCustomers, setcallowners);
       
        // Then fetch company details to get the limit
        const fetchLimit = await fetchCompanyDetails(storedToken, setLimit);
       
        // Only proceed with fetchEntries if we have a valid limit
        if (fetchLimit) {
          fetchEntries(
            storedToken,
            setOpenSnackbar,
            setSnackbarMessage,
            setSnackbarSeverity,
            fetchLimit,
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
      } catch (error) {
        console.error("Error initializing data:", error);
        setError(error.message);
      }
    };

    initializeData();
  }, []);

  // Define columns for DynamicListTable
  const columns = [
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "100px",
      truncate: 20,
      format: (value, row) => row.customer_name || "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "100px",
      format: (value, row) => {
        const phone = row.contact?.phone;
        return phone && phone.trim() ? phone : "N/A";
      },
    },
    {
      key: "address",
      label: "Address",
      minWidth: "150px",
      format: (value, row) => {
        const address = row.contact?.address;
        if (address && (address.city || address.state)) {
          const parts = [address.city, address.state].filter(Boolean);
          return parts.length > 0 ? parts.join(", ") : "N/A";
        }
        return "N/A";
      },
    },
    {
      key: "leads_owner",
      label: "Leads Owner",
      minWidth: "120px",
      format: (value, row) => {
        if (!row.leads_owner) return "N/A";
        return CallOwners?.find(
          (owner) => owner.user_id === row.leads_owner
        )?.username || row.leads_owner || "N/A";
      },
    },
    {
      key: "type",
      label: "Type",
      minWidth: "100px",
      format: (value, row) => {
        const type = row.contact?.type || row.type;
        return type && type.trim() ? type : "N/A";
      },
    },
  ];

  const handleSearchSubmit = () => {
    searchFunction(
      token,
      entries,
      setEntries,
      setFilteredEntries,
      searchQuery,
      setOpenSnackbar,
      setSnackbarMessage,
      setcallowners,
      setSnackbarSeverity
    );
  };

  const handleRowClick = (row) => {
    handleCardClick(row.customer_id, router);
  };

  const handleScrollToTopDisplay = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);
  };

  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);
    infiniteScroll(
      event,
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
    );
  };

  const extraControls = [
    // <Tooltip key="old-customer" title="Select Old Customer">
    //   <IconButton
    //     aria-label="oldCustomer"
    //     onClick={() => {
    //       setOpenOldCustomerModal(true);
    //     }}
    //     sx={{
    //       borderRadius: 1,
    //       padding: "9px 10px",
    //       backgroundColor: "white",
    //       "&:hover": {
    //         backgroundColor: "white",
    //       },
    //     }}
    //   >
    //     <PersonAddAlt1Icon fontSize="small" />
    //   </IconButton>
    // </Tooltip>,
    <Tooltip key="add-customer" title="Add Customer">
      <IconButton
        aria-label="addCustomer"
        onClick={() => {
          handleOpenModal(setOpenAddCustomerModal);
          setSelectedOldCustomer(null);
        }}
        sx={{
          borderRadius: 1,
          padding: "9px 10px",
          backgroundColor: "white",
          "&:hover": {
            backgroundColor: "white",
          },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>,
  ];

  return (
    <div>
      <DynamicListTable
        title="Sales Customers"
        columns={columns}
        data={entries}
        filteredData={filteredEntries}
        loading={isLoading}
        searchText={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onRowClick={handleRowClick}
        scrollToTopDisplay={handleScrollToTopDisplay}
        onScrollToTop={() => {
          handleScrollToTop();
          setShowFab(false);
        }}
        showScrollFab={showFab}
        onScroll={handleScroll}
        snackbar={{
          open: openSnackbar,
          message: snackbarMessage,
          severity: snackbarSeverity,
          onClose: () => setOpenSnackbar(false),
        }}
        filterBadge={{
          count: totalCustomers,
          label: "All",
        }}
        extraControls={extraControls}
        scrollableTableId="scrollable-table"
      />

      {/* Modal for OldCustomer Selection */}
      <OldCustomerModal
        open={openOldCustomerModal}
        onClose={() => setOpenOldCustomerModal(false)}
        onSelectCustomer={(customer) => {
          setSelectedOldCustomer(customer);
          setOpenOldCustomerModal(false);
          setOpenAddCustomerModal(true);
        }}
      />

      {/* Modal for AddCustomer */}
      <Dialog
        open={openAddCustomerModal}
        maxWidth="md"
        fullWidth
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            handleCloseModal(setOpenAddCustomerModal);
            setSelectedOldCustomer(null);
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <AddCustomer
            selectedCustomer={selectedOldCustomer}
            salesType="customer"
            source="salescustomers"
            onSuccess={(customerId) => {
              handleCustomerSuccess(
                setIsLoading,
                setSnackbarMessage,
                setOpenSnackbar,
                setSnackbarSeverity
              );
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
              router.push(`/views/customer/Salescustomers/${customerId}`);
            }}
            onClose={() => {
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
