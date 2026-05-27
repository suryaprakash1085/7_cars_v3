"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";

import Navbar from "@/components/navbar";
import LiveChat from "@/components/liveChat";

import AddProduct from "@/components/addProduct";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Autocomplete,
  Grid,
  TextField,
  Select,
  MenuItem,
  Snackbar,
  IconButton,
  Fab,
  Paper,
  Divider,
  InputAdornment,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BackButton from "@/components/backButton";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { generatePDF } from "./statsIdHelper";
import { set } from "date-fns";

const CustomerDetail = () => {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id;
  const [token, setToken] = useState();

  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [km, setKm] = useState(0);
  const [tempKm, setTempKm] = useState(km);
  const [estimateItems, setEstimateItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disableDelete, setDisableDelete] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const lastInputRef = useRef(null);
  const [services, setServices] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "Mechanic", text: "The vehicle inspection is complete." },
    { sender: "Garage Owner", text: "Great! Any issues found?" },
    {
      sender: "Mechanic",
      text: "Yes, there are a few issues with the brakes.",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const [servicesActualExists, setServicesActualExists] = useState(false);
  const [servicesEstimateExists, setServicesEstimateExists] = useState(false);
  const [appointmentDataLog, setAppointmentDataLog] = useState([]);
  const [uomOptions, setUomOptions] = useState([]);
  const [enableRelease, setEnableRelease] = useState(false);

  const [productType, setProductType] = useState("");
  const [prCreated, setPrCreated] = useState(false);
  const [prNo, setPrNo] = useState("");
  const [updateButtonclicked, setUpdateButtonclicked] = useState(false);
  const [openAddProductModal, setOpenAddProductModal] = useState(false);

  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, { sender: "Garage Owner", text: newMessage }]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    if (estimateItems.length === 1) {
      setDisableDelete(true);
    } else {
      setDisableDelete(false);
    }
  }, [estimateItems]);

  //!! Fetching services from the API
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    const fetchServices = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`
        );
        const data = await response.json();
        setServices(data.services);
      } catch (error) {
        console.log("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  //!! Fetching appointment details from the API
  useEffect(() => {
    if (!appointmentId) {
      console.log("Appointment ID is not available");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      const token = Cookies.get("token");
      try {
        const appointmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!appointmentResponse.ok)
          throw new Error("Failed to fetch appointment details");
        const appointmentData = await appointmentResponse.json();
        const customerId = appointmentData.customer_id;
        const vehicleId = appointmentData.vehicle_id;
        if (appointmentData.km != undefined) {
          setKm(appointmentData.km);
        } else {
          setKm(0);
        }

        const [customerResponse, inventoryResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!customerResponse.ok)
          throw new Error("Failed to fetch customer details");
        if (!inventoryResponse.ok)
          throw new Error("Failed to fetch inventory details");

        const customerData = await customerResponse.json();
        const inventoryData = await inventoryResponse.json();

        setCustomer(customerData);
        setVehicleId(vehicleId);
        setInventory(inventoryData);
        setAppointmentDataLog(appointmentData);
        // Pre-fill estimate items if services_actual exists
        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          const preFilledItems = appointmentData.services_actual.map(
            (service) => ({
              service_id: service.service_id || "",
              type: service.service_type || "",
              spareList: service.items_required[0]?.item_name || "",
              reportedIssue: service.service_description || "",
              qty: service.items_required[0]?.qty || 0,
              price: service.price || 0,
              discount: service.items_required[0]?.discount || 0,
              discountType: "percentage",
              estimatedAmount: service.price || 0,
              tax: service.items_required[0]?.tax || 0,
            })
          );
          setEstimateItems(preFilledItems);
          calculateAllEstimatedAmounts(preFilledItems);
          console.log("preFilledItems", preFilledItems);
        } else {
          if (appointmentData.services_actual.length > 0) {
            const preFilledItems = appointmentData.services_actual.map(
              (service) => ({
                service_id: service.service_id || "",
                type: service.service_type || "",
                spareList: service.items_required[0]?.item_name || "",
                reportedIssue: service.service_description || "",
                qty: service.items_required[0]?.qty || 1,
                price: service.price || 0,
                discount: service.items_required[0]?.discount || 0,
                discountType: "percentage",
                estimatedAmount: service.price || 0,
                tax: service.items_required[0]?.tax || 0,
              })
            );
            setEstimateItems(preFilledItems);
            calculateAllEstimatedAmounts(preFilledItems);
          } else {
            setEstimateItems([
              {
                service_id: "",
                type: "Services",
                spareList: "",
                reportedIssue: "",
                qty: 0,
                price: 0,
                discount: 0,
                discountType: "percentage",
                estimatedAmount: 0,
                tax: 0,
              },
            ]);
            calculateAllEstimatedAmounts([
              {
                service_id: "",
                type: "Services",
                spareList: "",
                reportedIssue: "",
                qty: 0,
                price: 0,
                discount: 0,
                discountType: "percentage",
                estimatedAmount: 0,
                tax: 0,
              },
            ]);
          }
        }

        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          setServicesActualExists(true);
        }
        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          setServicesEstimateExists(true);
        }

        console.log(appointmentData);
      } catch (err) {
        console.log("Error fetching details:", err);
        setError(err.message);
        setSnackbarMessage(err.message);
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId]);

  //!! Fetching UOM data from the API
  useEffect(() => {
    const fetchUomData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`);
        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.log("Error fetching UOM data:", error);
      }
    };

    fetchUomData();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  const calculateTotals = () => {
    const grandTotal = estimateItems.reduce(
      (acc, item) => acc + parseFloat(item.price) * parseFloat(item.qty),
      0
    );

    const totalTax = estimateItems.reduce(
      (acc, item) =>
        acc +
        parseFloat(item.price) *
          parseFloat(item.qty) *
          (parseFloat(item.tax) / 100),
      0
    );

    const overallTotal = grandTotal + totalTax;
    return { grandTotal, totalTax, overallTotal };
  };

  const { grandTotal, totalTax, overallTotal } = calculateTotals();

  const addEstimateItem = () => {
    const newItem = {
      type: "",
      spareList: "",
      reportedIssue: "",
      qty: 0,
      price: 0,
      discount: 0,
      discountType: "percentage",
      estimatedAmount: 0,
      tax: 0,
      isNew: true,
    };
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems, newItem];
      calculateEstimatedAmount(updatedItems.length - 1, updatedItems);
      return updatedItems;
    });
    setTimeout(() => {
      if (lastInputRef.current) {
        lastInputRef.current.focus();
      }
    }, 0);
  };

  const removeEstimateItem = async (index) => {
    const token = Cookies.get("token");
    const serviceId = estimateItems[index].service_id;

    if (!serviceId) {
      setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
      setSnackbarMessage("Service deleted successfully");
      setOpenSnackbar(true);
      return;
    }
    // disable delete button if contains only one row

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/delete_service/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setEstimateItems((prevItems) =>
          prevItems.filter((_, i) => i !== index)
        );
        setSnackbarMessage("Service deleted successfully");
      } else if (response.status === 404) {
        setSnackbarMessage("Service not found");
      } else {
        setSnackbarMessage("Failed to delete service");
      }
    } catch (error) {
      console.log("Error deleting service:", error);
      setSnackbarMessage("Error deleting service");
    } finally {
      setOpenSnackbar(true);
    }
  };

  const updateEstimateItem = (index, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      // Recalculate estimated amount if necessary
      if (["qty", "price", "tax"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
  };

  const calculateEstimatedAmount = (index, items) => {
    const item = items[index];
    const price = parseFloat(item.price).toFixed(2) || 0; // Ensure price is a number
    const qty = parseFloat(item.qty).toFixed(1) || 0; // Ensure qty is a number

    // Calculate the estimated amount as quantity multiplied by price (without tax)
    const estimatedAmount = qty * price;

    // Update the estimated amount in the item (without tax)
    items[index].estimatedAmount = estimatedAmount.toFixed(2); // Store the amount without tax
  };

  // Function to calculate estimated amounts for all items
  const calculateAllEstimatedAmounts = (items) => {
    items.forEach((_, index) => {
      calculateEstimatedAmount(index, items);
    });
  };

  useEffect(() => {
    // console.log({ estimateItems: estimateItems });
    if (estimateItems.length > 0 && estimateItems[0]?.type !== "") {
      setEnableRelease(true);
    }
  }, [estimateItems]);

  const handleSpareListChange = (index, value) => {
    const isDuplicate = estimateItems.some(
      (item, i) => item.spareList === value && i !== index
    );

    if (isDuplicate) {
      setSnackbarMessage("Duplicate spare list item selected");
      setOpenSnackbar(true);
      return;
    }

    const selectedItem = inventory.find((item) => item.part_name === value);
    if (selectedItem) {
      updateEstimateItem(index, "spareList", value);

      updateEstimateItem(index, "price", selectedItem.price);

      updateEstimateItem(index, "qty", estimateItems[index].qty || 1);
      updateEstimateItem(
        index,
        "tax",
        selectedItem.tax || estimateItems[index].tax
      );
    } else {
      updateEstimateItem(index, "spareList", value);
      updateEstimateItem(index, "price", 0);
      updateEstimateItem(index, "qty", 0);
    }
  };

  const getFilteredInventory = (type) => {
    return inventory.filter(
      (item) => item.category?.toLowerCase() === type?.toLowerCase()
    );
  };

  const handleTypeChange = (index, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        type: value,
      };
      return updatedItems;
    });
  };

  const handleKeyPress = (event, index) => {
    if (event.key === "Enter" && index === estimateItems.length - 1) {
      addEstimateItem();
    }
  };

  //!! Validating and posting service data to the API
  const validateAndPostService = async (
    serviceType,
    appointmentDataLog,
    type
  ) => {
    const token = Cookies.get("token");
    const validItems = estimateItems.filter(
      (item) =>
        item.spareList && item.reportedIssue && item.qty > 0 && item.price > 0
    );

    if (validItems.length === 0) {
      setEnableRelease(false);
      setSnackbarMessage("Please add Service, Service Cant Blanks");
      setOpenSnackbar(true);
      return;
    }

    const hasPartialRows = estimateItems.some(
      (item) =>
        (item.spareList ||
          item.reportedIssue ||
          item.qty > 0 ||
          item.price > 0) &&
        (!item.spareList ||
          !item.reportedIssue ||
          item.qty <= 0 ||
          item.price <= 0)
    );

    if (hasPartialRows) {
      setSnackbarMessage(
        "Please fill all fields in a row or remove incomplete rows."
      );
      setOpenSnackbar(true);
      return;
    }
    let Status = "approved";
    if (serviceType == "services_actual") {
      if (appointmentDataLog.services_actual.length > 0) {
        Status = "approved";
      } else {
        Status = "released";
      }
    }

    const services = validItems.map((item) => ({
      service_id: Status !== "released" ? item.service_id || "" : "", // item.service_id || "",
      service_description: item.reportedIssue,
      price: item.price,
      uom: item.uom,
      service_type: item.type,
      items_required: [
        {
          item_id: inventory.find(
            (invItem) => invItem.part_name === item.spareList
          )?.inventory_id, // Ensure inventory_id is accessed safely
          item_name: item.spareList,
          qty: item.qty,
          tax: item.tax,
          discount: item.discount,
        },
      ],
      status: Status,
    }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/${serviceType}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(services),
        }
      );
      // console.log(services);
      if (!response.ok) throw new Error(`Failed to post to ${serviceType}`);
      // console.log(`Successfully posted to ${serviceType}`);
      setSnackbarMessage(`Job Card ${appointmentId} updated successfully`);
      setOpenSnackbar(true);
      // reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      // console.log(err);
      // console.log(`Error posting to ${serviceType}:`, err);
      setSnackbarMessage(`Error posting to ${serviceType}`);
      setOpenSnackbar(true);
    }
    // if (serviceType === "services_actual") {
    //   router.push(`/app/`);
    // }
    if (type === "save") {
      // router.push(`/app/`);
    }
  };

  //!! Updating KM in the database
  const updateKm = async (newKm) => {
    const token = Cookies.get("token");
    if (isNaN(newKm)) {
      setSnackbarMessage("KM should be a number");
      setOpenSnackbar(true);
      return;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_km`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ km: newKm }),
      }
    );
    if (!response.ok) throw new Error("Failed to update KM");
    setKm(newKm);

    setSnackbarMessage(`KM updated successfully`);
    setOpenSnackbar(true);
  };
  const handleKmChange = (event) => {
    setKm(event.target.value);
    updateKm(event.target.value);
  };

  useEffect(() => {
    setTempKm(km); // Update tempKm whenever km changes
  }, [km]);

  const handleTempKmChange = (event) => {
    setTempKm(event.target.value);
  };

  const handleUpdateKmClick = () => {
    updateKm(tempKm);
  };
  const handleRelease = async () => {
    // check if km is 0
    if (km === 0) {
      setSnackbarMessage("KM should be greater than 0");
      setOpenSnackbar(true);
      return;
    }

    // use appointment/released/appointmentId
    const token = Cookies.get("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/released/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to release appointment");
    setSnackbarMessage("Appointment released successfully");
    setOpenSnackbar(true);
    // refresh the page only if success
    if (response.ok) {
      // window.location.reload();
      router.push(`/views/`);
    }
  };

  //!! Creating procurement for out-of-stock items
  const createProcurement = async () => {
    const token = Cookies.get("token");

    // Filter items to include only those that are out of stock
    const itemsToProcure = estimateItems
      .map((item) => {
        const stockQuantity =
          inventory.find((invItem) => invItem.part_name === item.spareList)
            ?.quantity || 0;
        const requiredQuantity =
          item.qty > stockQuantity ? item.qty - stockQuantity : 0; // Calculate the difference
        return {
          product: item.spareList, // Ensure product name is used
          qty: requiredQuantity, // Include only the difference in quantity
          service_id: item.service_id, // Include service_id
          item_id: inventory.find(
            (invItem) => invItem.part_name === item.spareList
          )?.inventory_id, // Add item_id
        };
      })
      .filter((item) => item.qty > 0); // Only include items with a positive quantity difference

    if (itemsToProcure.length === 0) {
      setSnackbarMessage("No items require procurement.");
      setOpenSnackbar(true);
      return; // Exit if no items need procurement
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement/srpr`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pr_type: "SRPR",
            items: itemsToProcure, // Send the updated items array
            service_id: itemsToProcure[0]?.service_id, // Use the service_id from the first item
          }),
        }
      );
      // console.log(body)
      if (!response.ok) throw new Error("Failed to create procurement");
      const data = await response.json();
      setPrNo(data.pr_no); // Set the PR number from the response
      setPrCreated(true); // Mark PR as created
      setSnackbarMessage("Procurement created successfully");
      setOpenSnackbar(true);
    } catch (error) {
      // console.error("Error creating procurement:", error);
      setSnackbarMessage("Error creating procurement");
      setOpenSnackbar(true);
    }
  };

  // Calculate itemsToProcure for rendering // include item_id
  const itemsToProcure = estimateItems
    .map((item) => {
      const stockQuantity =
        inventory.find((invItem) => invItem.part_name === item.spareList)
          ?.quantity || 0;
      const requiredQuantity =
        item.qty > stockQuantity ? item.qty - stockQuantity : 0; // Calculate the difference
      return {
        ...item,
        qty: requiredQuantity,
        item_id: inventory.find(
          (invItem) => invItem.part_name === item.spareList
        )?.inventory_id,
      }; // Include only the difference in quantity
    })
    .filter((item) => item.qty > 0); // Only include items with a positive quantity difference

  const isCreatePrEnabled = itemsToProcure.length > 0 && !prCreated; // Enable if there are items to procure and PR not created

  //!! Getting common PR number from services_actual
  const getCommonPrNo = () => {
    if (!appointmentDataLog || !appointmentDataLog.services_actual) {
      return null; // Return null if data is not available
    }

    const prNumbers = appointmentDataLog.services_actual.flatMap((service) =>
      service.items_required.map((item) => item.pr_no)
    );

    // Filter out undefined values and get unique PR numbers
    const uniquePrNumbers = [...new Set(prNumbers.filter((pr) => pr))];

    // Return the common PR number if all are the same
    return uniquePrNumbers.length === 1 ? uniquePrNumbers[0] : null;
  };

  // Get the common PR number
  const commonPrNo = getCommonPrNo();

  //!! Calculating total tax for items
  const calculateTotalTax = (items) => {
    return items.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0; // Ensure price is a number
      const qty = parseFloat(item.qty) || 0; // Ensure qty is a number
      const tax = parseFloat(item.tax) || 0; // Ensure tax is a number

      // Calculate the total amount including GST
      const amountIncludingGST = price * qty;

      // Calculate the GST amount using the provided formula
      const gstAmount =
        amountIncludingGST - amountIncludingGST / (1 + tax / 100);

      return acc + gstAmount; // Accumulate the total GST
    }, 0);
  };

  // Function to handle the confirmation of deletion
  const handleConfirm = async () => {
    if (selectedRow !== null && estimateItems[selectedRow]) {
      await removeEstimateItem(selectedRow);
      setOpenConfirmationModal(false);
    }
  };

  // Modify the removeEstimateItem function to open the dialog
  const handleDeleteClick = (index) => {
    setSelectedRow(index);
    setOpenConfirmationModal(true);
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Job Card Details" /> */}
      {pageType !== "tab" && <Navbar pageName="Job Card Details" /> }
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",
          minHeight: "89vh",
        }}
      >
        <Box>
          {loading && <Typography>Loading details...</Typography>}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <MuiAlert onClose={handleCloseSnackbar} sx={{ width: "100%" }}>
              {snackbarMessage}
            </MuiAlert>
          </Snackbar>
          {customer && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  marginBottom: 3,
                  paddingBottom: 2,
                  width: "%",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  padding: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 16,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {/* <BackButton /> */}
                    <Typography variant="h6" style={{ marginLeft: "8px" }}>
                      Job Card No - {appointmentId}
                    </Typography>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <TextField
                      label="KiloMeters"
                      size="small"
                      variant="outlined"
                      value={tempKm}
                      type="number"
                      onChange={(e) => {
                        if (e.target.value < 0) {
                          e.preventDefault();
                          return;
                        }
                        handleTempKmChange(e);
                      }}
                      sx={{ margin: "10px 0" }}
                      disabled // Disable the input
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateKmClick}
                      style={{ height: "38px" }}
                      disabled // Disable the button
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "220px", marginRight: 16 }}>
                    <Typography variant="h3" sx={{}}>
                      {customer.customer_name}
                    </Typography>
                    {/* {console.log({ customer: customer })} */}
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Phone: </strong>
                      <a href={`tel://${customer.contact.phone}`}>
                        {customer.contact.phone}
                      </a>
                    </Typography>
                  </div>

                  <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${customer.contact.email}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {customer.contact.email}
                      </a>
                    </Typography>
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Address:</strong>{" "}
                      {customer.contact.address.street},{" "}
                      {customer.contact.address.city}
                    </Typography>
                    <Typography variant="body2">
                      {customer.contact.address.state} -{" "}
                      {customer.contact.address.pinCode}
                    </Typography>
                  </div>

                  <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                    {customer.vehicles
                      .filter((vehicle) => vehicle.vehicle_id === vehicleId)
                      .map((vehicle, index) => (
                        <div key={index} style={{ marginBottom: 16 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#333" }}
                          >
                            {`${vehicle.make}`}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#555" }}>
                            <strong>Model:</strong> {vehicle.model}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#888" }}>
                            <strong>Plate Number:</strong>{" "}
                            {vehicle.plateNumber || "N/A"}
                          </Typography>
                        </div>
                      ))}
                  </div>

                  <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                    <Box display="flex" alignItems="center">
                      {Array.isArray(appointmentDataLog.services_actual) &&
                        servicesEstimateExists && (
                          <>
                            <SportsScoreIcon
                              style={{
                                fontSize: "100px",
                                color:
                                  appointmentDataLog.status === "completed"
                                    ? "green"
                                    : appointmentDataLog.status === "released"
                                    ? "orange"
                                    : appointmentDataLog.status === "scheduled"
                                    ? "red"
                                    : "inherit",
                              }}
                            />
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => handleRelease()}
                              disabled // Disable the button
                              sx={{ marginLeft: 2 }}
                            >
                              {appointmentDataLog.status === "released"
                                ? "Already Released"
                                : "Release"}
                            </Button>
                          </>
                        )}
                    </Box>
                  </div>
                </div>
              </Paper>

              <Paper
                elevation={1}
                sx={{
                  padding: 1,
                  borderRadius: 2,
                  marginBottom: 3,
                  marginTop: -5,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="h6" gutterBottom>
                    Job Details
                  </Typography>
                  {/* Display the common PR number centered after the Job Details header */}
                  {commonPrNo && (
                    <Typography
                      variant="body2"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "bold",
                      }}
                    >
                      PR No: {commonPrNo}
                    </Typography>
                  )}
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    marginTop={0}
                    marginBottom={1}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="small "
                      sx={{ marginRight: 1, height: "40px", width: "220px" }}
                      onClick={() => {
                        createProcurement();
                        validateAndPostService(
                          "services_actual",
                          appointmentDataLog
                        );
                        setUpdateButtonclicked(true);
                      }}
                      disabled // Disable the button
                    >
                      {prCreated ? "PR Created" : "Create PR"}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ marginRight: 1, height: "40px", width: "220px" }}
                      onClick={() => {
                        generatePDF();
                      }}
                      disabled // Disable the button
                    >
                      Estimation Print
                    </Button>
                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      marginTop={0}
                      marginBottom={1}
                    >
                      {Array.isArray(appointmentDataLog.services_actual) &&
                      appointmentDataLog.services_actual.length > 0 &&
                      appointmentDataLog.services_actual.some(
                        (service) => service.service_id
                      ) ? (
                        <Button
                          disabled // Disable the button
                          variant="contained"
                          color="success"
                          onClick={() => {
                            validateAndPostService(
                              "services_actual",
                              appointmentDataLog
                            );
                            setUpdateButtonclicked(true);
                          }}
                          sx={{
                            marginRight: 2,
                            height: "40px",
                            width: "120px",
                          }}
                        >
                          Update
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() =>
                            validateAndPostService(
                              "services_actual",
                              appointmentDataLog,
                              "save"
                            )
                          }
                          sx={{
                            marginRight: 2,
                            height: "40px",
                            width: "120px",
                          }}
                          disabled // Disable the button
                        >
                          Save
                        </Button>
                      )}
                    </Box>
                  </Box>
                </div>
                <Divider sx={{ marginBottom: 2 }} />

                <TableContainer className="table-container">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell className="table-cell" align="center">Type</TableCell>
                        <TableCell className="table-cell" align="center">Spare List</TableCell>
                        <TableCell className="table-cell" align="center">Reported Issue</TableCell>
                        <TableCell className="table-cell" align="center">Qty</TableCell>
                        <TableCell className="table-cell" align="center">UOM</TableCell>
                        <TableCell className="table-cell" align="center">Price</TableCell>
                        <TableCell className="table-cell" align="center">Tax</TableCell>
                        <TableCell className="table-cell" align="left">Stock</TableCell>
                        <TableCell className="table-cell" align="center">Estimated Amount</TableCell>
                        <TableCell className="table-cell" align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {estimateItems.map((item, index) => {
                        const selectedItem = inventory.find(
                          (invItem) => invItem.part_name === item.spareList
                        );
                        const isStockInsufficient =
                          selectedItem && selectedItem.quantity < item.qty;

                        // Find the UOM from the services_actual data
                        const service = appointmentDataLog.services_actual.find(
                          (service) => service.service_id === item.service_id
                        );
                        const preSelectedUOM = service ? service.uom : "";

                        // Check if PR number exists for the current service
                        const currentService =
                          appointmentDataLog.services_actual.find(
                            (service) => service.service_id === item.service_id
                          );

                        // Find the specific item in the current service's items_required
                        const currentItem = currentService?.items_required.find(
                          (requiredItem) =>
                            requiredItem.item_name === item.spareList
                        );

                        // Access the pr_no from the currentItem
                        const prNo = currentItem?.pr_no;

                        // console.log("currentService", currentService);
                        // console.log("currentItem", currentItem);
                        // console.log("prNo", prNo);

                        return (
                          <TableRow key={index}>
                            {/* //? Type */}
                            <TableCell>
                              <Autocomplete
                                size="small"
                                value={item.type || ""}
                                onChange={(event, newValue) =>
                                  handleTypeChange(index, newValue)
                                }
                                options={services.map(
                                  (service) => service.service_name
                                )}
                                sx={{ width: "200px" }}
                                renderInput={(params) => (
                                  <TextField {...params} label="Select Type" />
                                )}
                                fullWidth
                                disabled // Disable the input
                              />
                            </TableCell>

                            {/* //? Spare List */}
                            <TableCell>
                              <Autocomplete
                                size="small"
                                disablePortal
                                options={getFilteredInventory(item.type).map(
                                  (option) => option.part_name
                                )}
                                value={item.spareList || ""}
                                onChange={(e) => {
                                  handleSpareListChange(
                                    index,
                                    e.target.innerHTML
                                  );
                                }}
                                sx={{ width: 200 }}
                                renderInput={(params) => (
                                  <TextField {...params} />
                                )}
                                noOptionsText={
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Typography variant="body1">
                                      No Items Available
                                    </Typography>
                                    <Button
                                      size="small"
                                      color="primary"
                                      onClick={() => {
                                        setOpenAddProductModal(true);
                                        setProductType(item.type);
                                      }}
                                      disabled // Disable the button
                                    >
                                      Add
                                    </Button>
                                  </Box>
                                }
                                disabled // Disable the input
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={item.reportedIssue}
                                size="small"
                                onChange={(e) =>
                                  updateEstimateItem(
                                    index,
                                    "reportedIssue",
                                    e.target.value
                                  )
                                }
                                fullWidth
                                onKeyDown={(e) => handleKeyPress(e, index)}
                                sx={{ width: "200px" }}
                                disabled // Disable the input
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                {/* <IconButton
                                  onClick={() =>
                                    updateEstimateItem(
                                      index,
                                      "qty",
                                      Math.max(item.qty - 1, 0)
                                    )
                                  }
                                >
                                  <RemoveIcon /x={{ fontSize: 15 }} />
                                </IconButton> */}
                                <TextField
                                  value={item.qty}
                                  size="small"
                                  type="number"
                                  min="0"
                                  inputProps={{ step: "0.5" }}
                                  onKeyDown={(e) => handleKeyPress(e, index)}
                                  onChange={(e) => {
                                    if (e.target.value < 0) {
                                      e.preventDefault();
                                      return;
                                    }
                                    const updatedQty = parseFloat(
                                      e.target.value
                                    ).toFixed(1);
                                    if (!isNaN(updatedQty) && updatedQty >= 0) {
                                      updateEstimateItem(
                                        index,
                                        "qty",
                                        parseFloat(e.target.value).toFixed(1) ||
                                          0.0
                                      );
                                    } else {
                                      e.preventDefault();
                                      return;
                                    }
                                  }}
                                  fullWidth
                                  sx={{ width: "100px", margin: "0 5px" }}
                                  disabled // Disable the input
                                />
                                {/* <IconButton
                                  onClick={() =>
                                    updateEstimateItem(
                                      index,
                                      "qty",
                                      (item.qty || 0) + 1
                                    )
                                  }
                                >
                                  <AddIcon sx={{ fontSize: 15 }} />
                                </IconButton> */}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography>
                                {item.type === "Services"
                                  ? inventory.find(
                                      (invItem) =>
                                        invItem.part_name === item.spareList
                                    )?.uom || "N/A"
                                  : inventory.find(
                                      (invItem) =>
                                        invItem.part_name === item.spareList
                                    )?.uom || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.type === "Services" ? (
                                <TextField
                                  value={item.price}
                                  size="small"
                                  min="0"
                                  onKeyDown={(e) => handleKeyPress(e, index)}
                                  onChange={(e) =>
                                    updateEstimateItem(
                                      index,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  sx={{ width: "100px" }}
                                  disabled // Disable the input
                                />
                              ) : (
                                <TextField
                                  value={item.price}
                                  size="small"
                                  type="number"
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Check if the value is a valid number and greater than or equal to 0
                                    if (value >= 0 || value === "") {
                                      updateEstimateItem(index, "price", value);
                                    }
                                  }}
                                  fullWidth
                                  sx={{ width: "100px" }}
                                  onKeyDown={(e) => handleKeyPress(e, index)}
                                  disabled // Disable the input
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                sx={{ width: "70px" }}
                                value={item.tax || "0"}
                                onKeyDown={(e) => handleKeyPress(e, index)}
                                onChange={(e) => {
                                  const newTax = e.target.value;
                                  updateEstimateItem(index, "tax", newTax);
                                  // Recalculate the estimated amount when tax changes
                                  calculateEstimatedAmount(
                                    index,
                                    estimateItems
                                  );
                                }}
                                fullWidth
                                SelectProps={{
                                  native: true,
                                }}
                                inputRef={
                                  index === estimateItems.length - 1
                                    ? lastInputRef
                                    : null
                                }
                                disabled // Disable the input
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </TextField>
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" alignItems="left">
                                <Typography>
                                  {item.type === "Services"
                                    ? "---"
                                    : selectedItem
                                    ? selectedItem.quantity
                                    : 0}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography>
                                {parseFloat(item.estimatedAmount).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" alignItems="center">
                                <IconButton
                                  disabled // Disable the delete button
                                >
                                  <DeleteIcon />
                                </IconButton>
                                {index === estimateItems.length - 1 && (
                                  <IconButton
                                    disabled // Disable the add button
                                  >
                                    <AddIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Paper
                  elevation={3}
                  sx={{ padding: 3, borderRadius: 2, marginBottom: 3 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ marginBottom: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Grand Total:</strong> {grandTotal.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Total Tax:</strong> {totalTax.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Overall Total:</strong> {grandTotal.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Paper>
            </Box>
          )}
          <Modal
            open={openAddProductModal}
            onClose={() => setOpenAddProductModal(false)}
          >
            <AddProduct token={token} category={productType} />
          </Modal>

          {/* Chat Box */}
          <LiveChat room={appointmentId} />

          {/* Add the Dialog component */}
          <Dialog
            open={openConfirmationModal}
            onClose={() => setOpenConfirmationModal(false)}
            sx={{
              "& .MuiDialog-paper": {
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                padding: "16px",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Confirm Deletion
            </DialogTitle>

            <DialogContent
              sx={{
                padding: "16px 24px",
                fontSize: "1rem",
                color: "#555",
                lineHeight: "1.5",
              }}
            >
              <Typography>
                Are you sure you want to{" "}
                <span style={{ fontWeight: "bold" }}>
                  delete this item
                </span>
                {/* {selectedRow !== null ? ` with ID: ${estimateItems[selectedRow].service_id}` : ""}? */}
                {/* <br></br> */}
                {/* This action cannot be undone. */}
              </Typography>
            </DialogContent>

            <DialogActions
              sx={{
                padding: "8px 16px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <Button
                onClick={() => setOpenConfirmationModal(false)}
                color="primary"
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                }}
                disabled // Disable the button
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                color="error"
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                }}
                disabled // Disable the button
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </div>
  );
};

export default CustomerDetail;
