"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
// test
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// whatsapp component
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "@/components/whatsapp";
import Cookies from "js-cookie";
import Navbar from "@/components/navbar";
import LiveChat from "@/components/liveChat";
import axios from "axios";
// const [error, setError] = useState(false);
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
  Link,
  Paper,
  Divider,
  InputAdornment,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BackButton from "@/components/backButton";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import SportsScoreIcon from "@mui/icons-material/SportsScore";

// import { generatePDF } from "./jobCardIDHelper";
import { set } from "date-fns";
import AppAlert from "@/components/snackBar";

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
  const [error, setError] = useState();
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
  const [jobCardAlertData, setJobCardAlertData] = useState({});

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

  const [isMobile, setIsMobile] = useState(false);
  const [severity, setseverity] = useState();
  // const [error,setError]=useState(false)

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
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
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
              spares: service.items_required.map((item) => ({
                spareList: item.item_name || "",
                service_id: service.service_id || "",
                qty: item.qty || 0,
                price: item.price || 0,
              })),
              reportedIssue: service.service_description || "",
              estimatedAmount: service.price || 0,
            })
          );

          const sparePartsByIssue = {};
          preFilledItems.forEach(item => {
            const description = item.reportedIssue;
            if (!sparePartsByIssue[description]) {
              sparePartsByIssue[description] = {
                reportedIssue: description,
                spares: [],
              };
            }
            item.spares.forEach(spare => {
              sparePartsByIssue[description].spares.push({
                spareList: spare.spareList,
                service_id: spare.service_id,
                qty: spare.qty,
                price: spare.price,
              });
              sparePartsByIssue[description].service_id = item.service_id;
              sparePartsByIssue[description].type = item.type;
              sparePartsByIssue[description].estimatedAmount = item.estimatedAmount;
            });
          });
          const sparePartsArray = Object.values(sparePartsByIssue);


          setEstimateItems(sparePartsArray);
          calculateAllEstimatedAmounts(sparePartsArray);
          // console.log("preFilledItems", preFilledItems);
        } else {
          if (appointmentData.services_actual.length > 0) {
            const preFilledItems = appointmentData.services_actual.map(
              (service) => ({
                service_id: service.service_id || "",
                type: service.service_type || "",
                spares: service.items_required.map((item) => ({
                  spareList: item.item_name || "",
                  qty: item.qty || 0,
                  price: service.price || 0,
                })),
                reportedIssue: service.service_description || "",
                estimatedAmount: service.price || 0,
              })
            );
            setEstimateItems(preFilledItems);
            calculateAllEstimatedAmounts(preFilledItems);
          } else {
            setEstimateItems([
              {
                service_id: "",
                type: "Services",
                spares: [],
                reportedIssue: "",
                estimatedAmount: 0,
              },
            ]);
            calculateAllEstimatedAmounts([
              {
                service_id: "",
                type: "Services",
                spares: [],
                reportedIssue: "",
                estimatedAmount: 0,
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
        // if (
        //   appointmentData.services_actual &&
        //   appointmentData.services_actual.length > 0
        // ) {
        //   setServicesEstimateExists(true);
        // }

        // console.log(appointmentData);
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
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
      (acc, item) => acc + parseFloat(item.estimatedAmount),
      0
    );

    const overallTotal = grandTotal;
    return { grandTotal, overallTotal };
  };

  const { grandTotal, overallTotal } = calculateTotals();

  const addEstimateItem = () => {
    const newItem = {
      type: "",
      spares: [],
      reportedIssue: "",
      estimatedAmount: 0,
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
      if (["qty", "price"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
  };

  // Modify the data structure to allow multiple spares per issue
  const addSpareToIssue = (index) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].spares.push({
        spareList: "",
        qty: 0,
        price: 0,
        new: 'X'
      });
      return updatedItems;
    });
  };

  // Remove tax-related logic
  const calculateEstimatedAmount = (index, items) => {
    const item = items[index];
    const totalAmount = item.spares.reduce((acc, spare) => {
      const price = parseFloat(spare.price) || 0;
      const qty = parseFloat(spare.qty) || 0;
      return acc + qty * price;
    }, 0);

    items[index].estimatedAmount = totalAmount.toFixed(2);
  };

  // Function to calculate estimated amounts for all items
  const calculateAllEstimatedAmounts = (items) => {
    items.forEach((_, index) => {
      calculateEstimatedAmount(index, items);
    });
  };

  useEffect(() => {
    // console.log({ estimateItems: estimateItems });
    // if (estimateItems.length > 0 && estimateItems[0]?.type !== "") {
    setEnableRelease(true);
    // }
  }, [estimateItems]);

  const handleSpareListChange = (index, spareIndex, value) => {
    // Check for duplicates across all spares in estimateItems
    const isDuplicate = estimateItems.some((item) =>
      item.spares.some((spare, j) => spare.spareList === value && j !== spareIndex)
    );

    if (isDuplicate) {
      toast.error("Duplicate spare list item selected");
      return;
    }

    const selectedItem = inventory.find((item) => item.part_name === value);
    if (selectedItem) {
      updateSpareItem(index, spareIndex, "spareList", value);
      updateSpareItem(index, spareIndex, "price", selectedItem.price);
      updateSpareItem(
        index,
        spareIndex,
        "qty",
        estimateItems[index].spares[spareIndex].qty || 1
      );
    } else {
      updateSpareItem(index, spareIndex, "spareList", value);
      updateSpareItem(index, spareIndex, "price", 0);
      updateSpareItem(index, spareIndex, "qty", 0);
    }
  };

  const updateSpareItem = (index, spareIndex, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].spares[spareIndex] = {
        ...updatedItems[index].spares[spareIndex],
        [field]: value,
      };

      // Recalculate estimated amount if necessary
      if (["qty", "price"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
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

  const handleSpareKeyPress = (event, index, spareIndex) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSpareToIssue(index);
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
      (item) => item.reportedIssue // Ensure reportedIssue is present
    );

    if (validItems.length === 0) {
      setEnableRelease(false);
      setSnackbarMessage("Please add Service, Service Cant Blanks");
      setOpenSnackbar(true);
      return;
    }

    // Prepare services array, each spare part as a separate service
    const services = validItems.flatMap((item) => {
      if (item.spares.length === 0) {
        // If no spares, send only the reported issue
        return [{
          service_id: item.spares.length > 0 ? item.spares[0].service_id : '', // No service_id since there are no spares
          service_description: item.reportedIssue,
          price: item.estimatedAmount,
          service_type: item.type,
          items_required: [], // Empty array for items_required
          status: "pending", // Set the status as needed
        }];
      }
      return item.spares.map((spare) => ({
        service_id: spare.new != 'X' ? spare.service_id : '', // Use existing service_id if available
        service_description: item.reportedIssue,
        price: item.estimatedAmount,
        service_type: item.type,
        items_required: [{
          // item_type: item.type,
          item_id: inventory.find(
            (invItem) => invItem.part_name === spare.spareList
          )?.inventory_id,
          item_name: spare.spareList,
          qty: spare.qty,
          price: spare.price,
        }],
        status: "pending", // Set the status as needed
      }));
    });

    // Check inventory stock and create procurement if necessary
    const itemsToProcure = services.flatMap(service =>
      service.items_required.map(item => {
        const stockQuantity = inventory.find(invItem => invItem.inventory_id === item.item_id)?.quantity || 0;
        const requiredQuantity = item.qty > stockQuantity ? item.qty - stockQuantity : 0; // Calculate the difference
        return requiredQuantity > 0 ? {
          product: item.item_name,
          qty: requiredQuantity,
          service_id: service.service_id,
          item_id: item.item_id,
        } : null;
      })
    ).filter(item => item !== null); // Filter out null values

    if (itemsToProcure.length > 0) {
      // Create procurement for out-of-stock items
      await createProcurement(itemsToProcure);
    }

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
      if (!response.ok) throw new Error(`Failed to post to ${serviceType}`);
      setSnackbarMessage(`Job Card ${appointmentId} updated successfully`);
      setOpenSnackbar(true);
      // reload after 2 seconds
      setTimeout(() => {
        // window.location.reload();
      }, 2000);
    } catch (err) {
      setSnackbarMessage(`Error posting to ${serviceType}`);
      setOpenSnackbar(true);
    }
  };

  // Function to create procurement
  const createProcurement = async (itemsToProcure) => {
    const token = Cookies.get("token");
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
            items: itemsToProcure,
            referenceName: `Procurement for Job Card using ${appointmentId}`,
            service_id: itemsToProcure[0]?.service_id, // Use the service_id from the first item
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to create procurement");
      const data = await response.json();
      setPrNo(data.pr_no); // Set the PR number from the response
      setPrCreated(true); // Mark PR as created
      setSnackbarMessage("Procurement created successfully");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage("Error creating procurement");
      setOpenSnackbar(true);
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
    setError("success");
  };
  const handleKmChange = (event) => {
    setKm(event.target.value);
    updateKm(event.target.value);
  };

  useEffect(() => {
    setTempKm(km); // Update tempKm whenever km changes
  }, [km]);

  const handleTempKmChange = (event) => {
    setTempKm(event.target.value); // Sync tempKm with input changes
  };

  const handleUpdateKmClick = () => {
    if (tempKm === "" || tempKm === "0" || tempKm === 0) {
      // If the value is empty or 0, show an error message
      setSnackbarMessage("KM cannot be empty or 0");
      setOpenSnackbar(true);
      setError("error");
      return; // Add return statement to prevent further execution
    }

    // If the value is valid, proceed with the update
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
      // checking if whatsapp is logged in
      if (checkWhatsappLoggedIn()) {
        const current_page = "jobCard";
        const template = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${current_page}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        // replace placeholders in the template message if any
        const dynamicValues = {
          customer_name: customer.customer_name,
          order_id: appointmentId,
          vehicle_id: vehicleId,
          km: km,
        };
        const message = replacePlaceholders(
          template.data.template_message,
          dynamicValues
        );
        const fromNumber = Cookies.get("phone");
        const toNumber = customer.contact.phone;
        const type = "text";
        const file = null;
        const caption = null;
        // console.log(fromNumber, toNumber, message, type, file, caption);
        sendWhatsappMessage(fromNumber, toNumber, message, type, file, caption);
      }
      setTimeout(() => {
        // window.location.reload();
        router.push(`/views/`);
      }, 2000);
    }
  };

  // !? replace placeholders in the template message if any
  const replacePlaceholders = (template, dynamicValues) => {
    return template.replace(
      /{{([^}]+)}}/g,
      (match, p1) => dynamicValues[p1] || match
    );
  };

  // delete a spare by service_id
  const deleteSpareByServiceId = async (serviceId, index, spareIndex) => {
    const token = Cookies.get("token");
    if (serviceId == null) {
      setEstimateItems((prevItems) => {
        const updatedItems = [
          ...prevItems,
        ];
        updatedItems[
          index
        ].spares.splice(spareIndex, 1); // Remove the spare at the specified index
        return updatedItems;
      });
      return;
    }
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
    if (response.status == 200) {
      setSnackbarMessage("Spare deleted successfully");
      setOpenSnackbar(true);
      setEstimateItems((prevItems) => {
        const updatedItems = [
          ...prevItems,
        ];
        updatedItems[
          index
        ].spares.splice(spareIndex, 1); // Remove the spare at the specified index
        return updatedItems;
      });
    }
    else {
      setSnackbarMessage("Failed to delete spare : Try again later");
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
  // !! Generate PDF
  const generatePDF = async () => {
    const taxDetails = {
      // value: grandTotal,
      // cgst: totalTax / 2,
      // sgst: totalTax / 2,
      // totalTax: totalTax,
    };

    const amountInWords = (amount) => {
      // convert amount to whole number if decimal is there ex 55.51 => 56
      const wholeNumber = Math.round(amount);
      const toWords = require("number-to-words");
      return (
        toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
        toWords.toWords(wholeNumber).slice(1)
      );
    };

    const MyDocument = () => {
      const itemsPerPage = 10; // Set the number of items per page
      const totalPages = Math.ceil(estimateItems.length / itemsPerPage); // Calculate total pages

      return (
        <Document>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <Page
              key={pageIndex}
              size="A4"
              style={{
                padding: 20,
                fontSize: 10,
                fontFamily: "Times-Roman",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "100vh",
              }}
            >
              {/* Watermark */}
              <PDFImage
                src="/icons/Arg_s7Cars Logo.png"
                style={{
                  height: 300,
                  width: 450,
                  position: "absolute",
                  top: "30%",
                  left: "10%",
                  opacity: 0.1,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />

              {/* Header Section */}
              <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 10,
                    borderBottom: "2px solid #000",
                  }}
                >
                  <PDFImage
                    src="/icons/pdf_head.png"
                    style={{ height: 75, width: 75 }}
                  />
                  <PDFImage
                    src="/icons/Arg_s7Cars Logo.png"
                    style={{ height: 100, width: 150 }}
                  />
                  <View style={{ textAlign: "center", flexGrow: 1 }}>
                    <PDFImage
                      src="/icons/ayyanar.png"
                      style={{ height: 30, width: 130, marginRight: 350 }}
                    />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bolder",
                        marginLeft: 80,
                      }}
                    >
                      ARG's 7 Cars
                    </Text>
                    <Text
                      style={{
                        fontWeight: "light",
                        fontStyle: "italic",
                        marginLeft: 80,
                      }}
                    >
                      Perfectus Immutatio
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      No 366, Thiruthangal Road, Sivakasi - 626130
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      Contact: 77080 03008, 72003 77707
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      GSTIN: 33BGFPA9032E1ZY
                    </Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>
                  Estimate
                </Text>
              </View>
              {/* Patron and Vehicle Details Section */}
              <View
                style={{
                  border: "1px solid #000",
                  padding: 10,
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Patron and Vehicle Info */}
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    alignContent: "space-between",
                  }}
                >
                  <View style={{ width: "60%" }}>
                    <Text>Patron: Mr./Mrs./Ms.</Text>
                    <Text>{customer.customer_name}</Text>
                    <Text>Address:</Text>
                    <Text>
                      {customer.contact.address.street},{" "}
                      {customer.contact.address.city}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "column",
                      width: "40%",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Estimate No</Text>
                      <Text style={{ textAlign: "left" }}>{appointmentId}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Estimate Date</Text>
                      <Text style={{ textAlign: "left" }}>
                        {new Date().toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Vehicle No</Text>
                      <Text style={{ textAlign: "left" }}>{vehicleId}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Vehicle Kms</Text>
                      <Text style={{ textAlign: "left" }}>{km}</Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    padding: 1,
                    width: "30%",
                    marginBottom: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
                </View>
              </View>

              {/* Items Table Section */}
              <View
                style={{
                  border: "1px solid #000",
                  marginBottom: 10,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                    backgroundColor: "#f0f0f0",
                    padding: 5,
                  }}
                >
                  <Text style={{ width: "10%", textAlign: "center" }}>
                    S.No
                  </Text>
                  <Text style={{ width: "40%", textAlign: "left" }}>
                    Particulars
                  </Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>Qty</Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>UOM</Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>
                    Rate
                  </Text>
                  <Text style={{ width: "20%", textAlign: "center" }}>
                    Amount
                  </Text>
                </View>

                {/* Items Display */}
                {estimateItems
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((item, index) => (
                    <View
                      key={index}
                      style={{ flexDirection: "column", padding: 1 }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 12,
                          marginBottom: 5,
                        }}
                      >
                        Reported Issue: {item.reportedIssue}
                      </Text>
                      {item.spares.map(
                        (spare, spareIndex) => {
                          // Find the corresponding inventory item to get the UOM
                          const inventoryItem = inventory.find(
                            (inv) => inv.part_name === spare.spareList
                          );
                          const uom = inventoryItem ? inventoryItem.uom : "N/A"; // Get UOM or default to "N/A"
                          return (
                            <View
                              key={spareIndex}
                              style={{ flexDirection: "row" }}
                            >
                              <Text
                                style={{ width: "10%", textAlign: "center" }}
                              >
                                {pageIndex * itemsPerPage +
                                  index * item.spares.length +
                                  spareIndex +
                                  1}
                              </Text>
                              <Text style={{ width: "40%", textAlign: "left" }}>
                                {spare.spareList}
                              </Text>
                              <Text
                                style={{ width: "10%", textAlign: "center" }}
                              >
                                {spare.qty || "N/A"}
                              </Text>
                              <Text
                                style={{ width: "10%", textAlign: "center" }}
                              >
                                {uom} {/* Display the UOM here */}
                              </Text>
                              <Text
                                style={{ width: "10%", textAlign: "center" }}
                              >
                                {parseFloat(spare.price).toFixed(2) || "N/A"}
                              </Text>
                              <Text
                                style={{ width: "20%", textAlign: "center" }}
                              >
                                {parseFloat(spare.qty) *
                                  parseFloat(spare.price) || "N/A"}
                              </Text>
                            </View>
                          );
                        }
                      )}
                      <View
                        style={{
                          borderBottom: "1px solid #000",
                          marginVertical: 5,
                        }}
                      />{" "}
                      {/* Separator line */}
                    </View>
                  ))}
              </View>

              {/* Total Section */}
              {pageIndex === totalPages - 1 && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      borderTop: "1px solid #000",
                      padding: 5,
                    }}
                  >
                    <View style={{ width: "80%", fontWeight: "bold" }}>
                      <Text style={{ textAlign: "left", fontSize: 8 }}>
                        Amount in Words :{" "}
                      </Text>
                      <Text style={{ textAlign: "left", fontSize: 10 }}>
                        {"Rupees " + amountInWords(grandTotal) + " Only."}
                      </Text>
                    </View>
                    <Text
                      style={{
                        width: "80%",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Total :{" Rs."}
                      {grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  {/* Footer Section */}
                  <View
                    style={{
                      borderTop: "1px solid #000",
                      paddingTop: 10,
                      backgroundColor: "#f0f0f0",
                      padding: 10,
                      marginTop: "auto",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ width: "50%" }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            marginBottom: 5,
                            fontStyle: "underline",
                          }}
                        >
                          Bank Details:
                        </Text>
                        <Text style={{ fontWeight: "bold" }}>
                          ARG's 7 Cars & Sree Jaya Finserve
                        </Text>
                        <Text>City Union Bank, Thiruthangal</Text>
                        <Text>Account No: 51090010124030</Text>
                        <Text>IFSC Code: CIUB0000648</Text>
                        <Text>GPay: +91 7708003008</Text>
                      </View>
                      {customer.gst_number && (
                        <>
                          <View
                            style={{
                              width: "1px",
                              height: "100%",
                              backgroundColor: "#000",
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                          ></View>
                          <View
                            style={{
                              width: "45%",
                              border: "1px solid #000",
                              padding: 5,
                            }}
                          >
                            <Text
                              style={{ fontWeight: "bold", marginBottom: 5 }}
                            >
                              Tax Details:
                            </Text>
                            <Text>Value: {taxDetails.value.toFixed(2)}</Text>
                            <Text>CGST: {taxDetails.cgst.toFixed(2)}</Text>
                            <Text>SGST: {taxDetails.sgst.toFixed(2)}</Text>
                            <Text>
                              Total Tax: {taxDetails.totalTax.toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <View style={{ width: "50%", textAlign: "left" }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                          Our Services:
                        </Text>
                        <Text>
                          Multi Brand Car Service & Accessories, Bodyshop work
                          (Painting, Tinkering, Electrical & AC Repair)
                        </Text>
                        <Text style={{ marginBottom: 5 }}>
                          HDFC Bank & Kotak Mahindra Bank Car Loans Service,
                          Insurance Renewal & Claim Service
                        </Text>
                      </View>
                      <View
                        style={{
                          width: "50%",
                          textAlign: "right",
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                          For ARG's 7 Cars
                        </Text>
                        <Text style={{ marginBottom: 5, paddingTop: 50 }}>
                          Authorized Signature
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: "100%" }}>
                    <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                      Subscidary:
                    </Text>
                  </View>

                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        width: "50%",
                        marginLeft: 0,
                        position: "static",
                      }}
                    >
                      <PDFImage
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      />
                    </View>
                    <View
                      style={{
                        width: "50%",
                        marginLeft: 50,
                        position: "static",
                      }}
                    >
                      <PDFImage
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      />
                    </View>
                  </View>

                  <Text style={{ textAlign: "center", marginTop: 10 }}>
                    Page {pageIndex + 1} of {totalPages}
                  </Text>
                </>
              )}
            </Page>
          ))}
        </Document>
      );
    };

    const pdfBlob = await pdf(<MyDocument />).toBlob();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    const Timestamp = new Date().getTime();
    link.download = `Estimate_${appointmentId}_${Timestamp}.pdf`;
    document.body.appendChild(link);
    // Open the file in a new tab
    // window.open(url, `Estimate_${appointmentId}_${Timestamp}.pdf`);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600); // Adjust the width as needed for your mobile breakpoint
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially to set the state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to fetch updated inventory
  const fetchInventory = async () => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.log("Error fetching inventory:", error);
    }
  };

  if (isMobile) {
    return (
      <div>
        <ToastContainer />
        <BackButton />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          {/* <div style={{ padding: "10%" }}> */}
          {/* <h1>404 - Page Not Found</h1>
        <p>This page is not available on mobile view.</p> */}

          <Image src="/icons/404.jpg" alt="404" width={350} height={300} />
          {/* </div> */}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar pageName="Job Card Details" />
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
            <MuiAlert
              onClose={handleCloseSnackbar}
              severity={error}
              sx={{ width: "100%" }}
            >
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
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateKmClick}
                      style={{ height: "38px" }}
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
                        // servicesEstimateExists && (
                        servicesActualExists && (
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
                              disabled={
                                appointmentDataLog.status === "released" ||
                                appointmentDataLog.status === "invoice" ||
                                appointmentDataLog.status === "inspection" ||
                                appointmentDataLog.status === "completed" ||
                                enableRelease == false
                              }
                              sx={{ marginLeft: 2 }}
                            // disabled={enableRelease }
                            >
                              {appointmentDataLog.status === "released" ||
                                appointmentDataLog.status === "invoice" ||
                                appointmentDataLog.status === "inspection" ||
                                appointmentDataLog.status === "completed"
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
                        // justifyContent: "right",
                        // alignItems: "right",
                        marginLeft: "60%",
                        marginTop: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      <Link target="_blank" href={`/views/purchase/`} style={{ textDecoration: "none", color: "inherit" }}>
                        PR No: {commonPrNo}
                      </Link>
                    </Typography>
                  )}
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    marginTop={0}
                    marginBottom={1}
                  >
                    {/* <Button
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
                      disabled={!isCreatePrEnabled}
                    >
                      {prCreated ? "PR Created" : "Create PR"}
                    </Button> */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ marginRight: 1, height: "40px", width: "220px" }}
                      onClick={() => {
                        generatePDF();
                      }}
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
                          disabled={updateButtonclicked}
                          variant="contained"
                          color="success"
                          onClick={() => {
                            validateAndPostService(
                              "services_actual",
                              appointmentDataLog
                            );
                            setUpdateButtonclicked(false);
                            // disable the button
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
                        {/* <TableCell className="table-cell" align="left">Reported Issue</TableCell>
                        <TableCell className="table-cell" align="right">Spare List</TableCell>
                        <TableCell className="table-cell" align="center">Estimated Amount</TableCell>
                        <TableCell className="table-cell" align="center">Actions</TableCell> */}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {estimateItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={4}>
                            <Card variant="outlined">
                              {/* <CardHeader
                                title={item.reportedIssue}
                                sx={{ backgroundColor: "#f5f5f5", textAlign: "center" }}
                              /> */}
                              {/* Estimated Amount */}
                              <Box
                                display="flex"
                                justifyContent="flex-end"
                                alignItems="left"
                                gap={2}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "bold",
                                    paddingTop: "15px",
                                  }}
                                >
                                  Estimated Amount:{" "}
                                  {parseFloat(item.estimatedAmount).toFixed(2)}
                                </Typography>
                                <IconButton
                                  onClick={() => addSpareToIssue(index)}
                                  sx={{
                                    color: "green",
                                    marginTop: "8px",
                                    marginRight: "10px",
                                    variant: "outlined",
                                    borderRadius: "8px",
                                    backgroundColor: "green",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#006D5B",
                                    },
                                  }}
                                >
                                  <AddIcon />
                                </IconButton>
                                <IconButton
                                  disabled={disableDelete}
                                  onClick={() => handleDeleteClick(index)}
                                  sx={{
                                    color: "red",
                                    marginTop: "10px",
                                    marginRight: "15px",
                                    marginLeft: "-15px",
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                                {/* </Tooltip> */}
                              </Box>

                              <CardContent>
                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  gap={2}
                                >
                                  {/* Reported Issue and Spares */}
                                  <Box display="flex" gap={0} alignItems="left">
                                    <TextField
                                      label="Reported Issue"
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
                                      multiline
                                      rows={2}
                                      sx={{
                                        flex: 4,
                                        width: "100%", // Ensures the width is 100% of the parent container, but still within the boundaries
                                        maxWidth: "50%", // Set a max width to prevent stretching beyond a reasonable size
                                        textarea: {
                                          padding: "10px", // Adds padding to the text area for more spacing
                                        },
                                        borderRadius: "8px", // Optional: Adjust border radius for a more rectangular shape
                                        "& .MuiInputBase-root": {
                                          borderRadius: "8px", // Ensures the border radius is applied to the entire input field
                                        },
                                      }}
                                    />

                                    <Box
                                      display="flex"
                                      flexDirection="column"
                                      gap={1}
                                      sx={{
                                        flex: 2,
                                        width: "50%",
                                        paddingLeft: "10px",
                                      }}
                                    >
                                      {item.spares.map((spare, spareIndex) => (
                                        <Box
                                          key={spareIndex}
                                          display="flex"
                                          gap={1}
                                          alignItems="center"
                                        >
                                          <Autocomplete
                                            size="small"
                                            disablePortal
                                            options={inventory.map(
                                              (option) => option.part_name
                                            )}
                                            value={spare.spareList || ""}
                                            onChange={(e, newValue) => {
                                              handleSpareListChange(
                                                index,
                                                spareIndex,
                                                newValue
                                              );
                                            }}
                                            sx={{ flex: 1 }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                label="Spare Part"
                                              />
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
                                                    setOpenAddProductModal(
                                                      true
                                                    );
                                                    setProductType(item.type);
                                                  }}
                                                >
                                                  Add
                                                </Button>
                                              </Box>
                                            }
                                          />

                                          <TextField
                                            label="Qty"
                                            value={spare.qty}
                                            size="small"
                                            type="number"
                                            min="0"
                                            onChange={(e) => {
                                              const updatedQty =
                                                parseFloat(e.target.value) || 0;
                                              updateSpareItem(
                                                index,
                                                spareIndex,
                                                "qty",
                                                updatedQty
                                              );
                                            }}
                                            onKeyPress={(e) => handleSpareKeyPress(e, index, spareIndex)}
                                            sx={{ width: "80px" }}
                                          />
                                          <TextField
                                            label="Price"
                                            value={spare.price}
                                            size="small"
                                            type="number"
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              updateSpareItem(
                                                index,
                                                spareIndex,
                                                "price",
                                                value
                                              );
                                            }}
                                            onKeyPress={(e) => handleSpareKeyPress(e, index, spareIndex)}
                                            sx={{ width: "100px" }}
                                          />
                                          {/* show at end of row */}
                                          {/* {index === item.spares.length - 1 && (
                                          <IconButton
                                            onClick={() => addSpareToIssue(index)}
                                            sx={{
                                              color: "green",
                                              marginTop: "10px",
                                              marginRight: "15px",
                                            }}
                                          >
                                            <AddIcon />
                                          </IconButton>
                                          )} */}
                                          <Tooltip title="Delete Spare">
                                            <IconButton
                                              onClick={() => {

                                                deleteSpareByServiceId(spare.service_id, index, spareIndex);
                                              }}
                                              sx={{ color: "red" }}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>

                                  {/* Add Spare Button */}

                                  {/* Actions */}
                                  <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    gap={1}
                                  >
                                    {index === estimateItems.length - 1 && (
                                      <IconButton
                                        onClick={() => addEstimateItem()}
                                        sx={{ color: "green" }}
                                      >
                                        <AddIcon />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      ))}
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
                        <strong>Overall Total:</strong>{" "}
                        {overallTotal.toFixed(2)}
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
            <AddProduct
              token={token}
              category={productType}
              onProductAdded={fetchInventory}
            />
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
                <span style={{ fontWeight: "bold" }}>delete this item</span>
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
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>

      <AppAlert alertData={jobCardAlertData} />
    </div>
  );
};

export default CustomerDetail;

// last update 07-03-2025 11:56 AM