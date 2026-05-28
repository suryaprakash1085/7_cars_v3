"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
import RateReviewIcon from '@mui/icons-material/RateReview';

// data b
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
    FormControl,
    InputLabel,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BackButton from "@/components/backButton";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import Image from "next/image";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

// import { generatePDF } from "./jobCardIDHelper";
import { isFuture, set } from "date-fns";
import AppAlert from "@/components/snackBar";
import generatePDF, { previewPDF as previewEstimatePDF } from "../../../../components/PDFGenerator_estimate";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
const CustomerDetail = () => {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params.id;
    const [token, setToken] = useState();
    const [expandedComments, setExpandedComments] = useState({});
    const [opencomment_modal, setopencomment_modal] = useState(false);
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
    const [severity, setSeverity] = useState("info");
    const Role = Cookies.get("role");
    const [selectedMechanic, setSelectedMechanic] = useState("");
    const [users, setUsers] = useState([]);
    const [typedname, setTypedname] = useState("");
    const [PdfHeaderImage, setPdfHeaderImage] = useState("");
    const [pdfFooterImage, setPdfFooterImage] = useState("");
    const [pdfLogo, setPdfLogo] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };




    const [statusChange, setStatusChange] = useState(""); //   ADD HERE

    // Header state for adding issues and spares
    const [headerReportedIssue, setHeaderReportedIssue] = useState("");
    const [headerSpares, setHeaderSpares] = useState([
        { spareList: "", qty: 0, price: 0 }
    ]);

    const handleSendMessage = () => {
        if (newMessage.trim() !== "") {
            setMessages([...messages, { sender: "Garage Owner", text: newMessage }]);
            setNewMessage("");
        }
    };

    const totalSpares = estimateItems.reduce(
        (acc, item) => acc + item.spares.length,
        0
    ); // Calculate total spares
    console.log("totalSpares", totalSpares);

    function TabPanel(props) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
            </div>
        );
    }
    useEffect(() => {
        if (estimateItems.length === 1) {
            setDisableDelete(true);
        } else {
            setDisableDelete(false);
        }
    }, [estimateItems]);

    // Set the pdfHeaderImage and pdfFooterImage when companyDetails change
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch the data from the API
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/ss/`
                );
                console.log("my response", response);
                // console.log('my header image', PdfHeaderImage)
                // console.log('my footet image', pdfFooterImage)

                // Check if company details are available in the response data
                const companyDetails = response?.data?.company_details?.[0];
                console.log("company details", companyDetails);
                // Set the header and footer images
                // const pdfHeader = ;
                // const pdfFooter = ;

                // Assuming you're using React, you can set the state as follows:
                setPdfHeaderImage(companyDetails?.pdf_header || "");
                setPdfFooterImage(companyDetails?.pdf_footer || "");
                setPdfLogo(companyDetails?.logo || "");

                // console.log('pdfHeaderImage', companyDetails?.pdf_header)
                // console.log('pdfFooterImage', companyDetails?.pdf_header)
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []); // Empty dependency array to fetch only on mount

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

                console.log("appointmentData", appointmentData);
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

                if (
                    appointmentData.services_actual &&
                    appointmentData.services_actual.length > 0
                ) {
                    // Group services by description to combine related spares
                    const servicesByDescription = {};

                    appointmentData.services_actual.forEach((service) => {
                        if (!servicesByDescription[service.service_description]) {
                            servicesByDescription[service.service_description] = {
                                service_id: service.service_id,
                                type: service.service_type || "",
                                reportedIssue: service.service_description,
                                spares: [],
                                estimatedAmount: parseFloat(service.price || 0),
                            };
                        }

                        // Add items_required as spares if they exist
                        if (service.items_required && service.items_required.length > 0) {
                            service.items_required.forEach((item) => {
                                servicesByDescription[service.service_description].spares.push({
                                    spareList: item.item_name || "",
                                    service_id: service.service_id,
                                    qty: item.qty || 0,
                                    price: item.price || 0,
                                });
                            });
                        } else {
                            // Add an empty spare slot if no items_required
                            servicesByDescription[service.service_description].spares.push({
                                spareList: "",
                                service_id: service.service_id,
                                qty: 0,
                                price: 0,
                            });
                        }
                    });

                    const formattedItems = Object.values(servicesByDescription);
                    setEstimateItems(formattedItems);
                    calculateAllEstimatedAmounts(formattedItems);
                } else {
                    setEstimateItems([]);
                }

                if (
                    appointmentData.services_actual &&
                    appointmentData.services_actual.length > 0
                ) {
                    setServicesActualExists(true);
                }

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

    const handleGeneratePDF = () => {
        // Call the PDFGenerator component with the necessary props
        // Or trigger the PDF generation logic directly
        console.log("Generating PDFs");
        generatePDF({
            customer,
            estimateItems,
            appointmentId,
            vehicleId,
            km,
            grandTotal,
            PdfHeaderImage,
            pdfFooterImage,
            pdfLogo
        });
    };
    const previewPDF = () => {
        // Call the PDFGenerator component with the necessary props
        // Or trigger the PDF generation logic directly
        previewEstimatePDF({
            customer,
            estimateItems,
            appointmentId,
            vehicleId,
            km,
            grandTotal,
            PdfHeaderImage,
            pdfFooterImage,
            pdfLogo
        });
    };
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
    //

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const usersData = await response.json();
                const filteredUsers = usersData.filter(
                    (user) => user.role_type === "Mechanic"
                );
                setUsers(filteredUsers);
            } catch (error) {
                console.log("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, [token]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // ... existing fetch calls ...

                const appointmentResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!appointmentResponse.ok)
                    throw new Error("Failed to fetch appointment");
                const appointmentData = await appointmentResponse.json();

                // Set the selected mechanic from appointment data
                setSelectedMechanic(appointmentData.mechanic_id || "");
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setSnackbarMessage("Error loading data");
                setOpenSnackbar(true);
            }
        };

        if (token) {
            fetchInitialData();
        }
    }, [token, appointmentId]);

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
                new: "X",
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
            item.spares.some(
                (spare, j) => spare.spareList === value && j !== spareIndex
            )
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
        if (event.key === "Enter") {
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
        setHasChanges(false);
        console.log("Check 1");
        // Check if mechanic is assigned
        if (!selectedMechanic) {
            setSnackbarMessage("Please assign a mechanic before saving");
            setOpenSnackbar(true);
            return;
        }

        const token = Cookies.get("token");
        const validItems = estimateItems.filter((item) => item.reportedIssue);

        if (validItems.length === 0) {
            setEnableRelease(false);
            setSnackbarMessage("Please add Service, Service Cant Blanks");
            setOpenSnackbar(true);
            return;
        }
        console.log("Check 2");
        // Prepare services array, each spare part as a separate service
        const services = validItems.flatMap((item) => {
            // Filter out spares with empty item names first
            const validSpares = item.spares.filter((spare) => spare.spareList && spare.spareList.trim() !== "");

            if (validSpares.length === 0) {
                // If no spares, send only the reported issue
                return [
                    {
                        service_id: item.service_id ? item.service_id : null,
                        service_description: item.reportedIssue,
                        price: item.estimatedAmount,
                        service_type: item.type,
                        items_required: [], // Empty array for items_required
                        status: "pending", // Set the status as needed
                    },
                ];
            }
            return validSpares.map((spare) => ({
                service_id: spare.service_id ? spare.service_id : null, // Use existing service_id if available, null for new services
                service_description: item.reportedIssue,
                price: item.estimatedAmount,
                service_type: item.type,
                items_required: [
                    {
                        item_id: inventory.find(
                            (invItem) => invItem.part_name === spare.spareList
                        )?.inventory_id,
                        item_name: spare.spareList,
                        qty: spare.qty,
                        price: spare.price,
                    },
                ],
                status: "pending", // Set the status as needed
            }));
        });

        // Check inventory stock and create procurement if necessary
        const itemsToProcure = services
            .flatMap((service) =>
                service.items_required.map((item) => {
                    const stockQuantity =
                        inventory.find((invItem) => invItem.inventory_id === item.item_id)
                            ?.quantity || 0;
                    const requiredQuantity =
                        item.qty > stockQuantity ? item.qty - stockQuantity : 0; // Calculate the difference
                    return requiredQuantity > 0
                        ? {
                            product: item.item_name,
                            qty: requiredQuantity,
                            service_id: service.service_id,
                            item_id: item.item_id,
                        }
                        : null;
                    if (
                        service.items_required[0].item_name == "" ||
                        service.items_required[0].item_name == undefined
                    ) {
                    }
                })
            )
            .filter((item) => item !== null); // Filter out null values

        console.log({ services });
        let is_empty = false;
        let is_zero = false;

        // Check for zero quantities or empty item names only if items_required exists
        for (const service of services) {
            if (service.items_required && service.items_required.length > 0) {
                // Only check if service has items required
                const itemName = service.items_required[0].item_name;
                const qty = service.items_required[0].qty;

                // Skip validation for empty item names (they should have been filtered out)
                if (itemName && itemName.trim() !== "") {
                    if (qty === 0 || qty === undefined) {
                        is_zero = true;
                        break;
                    }
                }
            }
            // Services without items_required are valid (e.g., labor/diagnosis only)
        }

        // Allow services if they have valid service_description
        // Price can be 0 or empty (optional field)
        const hasValidServices = services.every(
            (s) => s.service_description && s.service_description.trim() !== ""
        );

        if (!is_empty && !is_zero && hasValidServices && estimateItems.length > 0) {
            try {
                console.log("Check 4");
                // First, post services to get service_id(s)
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
                console.log("Check 6");
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || `Failed to post to ${serviceType}`);
                }

                const responseData = await response.json();
                console.log("Service response:", responseData);

                // After services are posted, create procurement if needed
                if (itemsToProcure.length > 0) {
                    // Get the service_ids from the response
                    let serviceId = null;
                    if (responseData.services && responseData.services.length > 0) {
                        serviceId = responseData.services[0].service_id;
                    }

                    console.log("Service ID for procurement:", serviceId);

                    // Create procurement for out-of-stock items
                    await createProcurement(itemsToProcure, serviceId);
                }

                setSnackbarMessage(`Job Card ${appointmentId} updated successfully`);
                setOpenSnackbar(true);
                handleRelease();
                // reload after 2 seconds
                setTimeout(() => {
                    // window.location.reload();
                }, 2000);
            } catch (err) {
                setSnackbarMessage(`Error: ${err.message || 'Failed to post services'}`);
                setOpenSnackbar(true);
                console.error("Error details:", err);
            }
        } else {
            let errorMsg = "Service can't be blank. Please add Service.";
            if (is_zero) {
                errorMsg = "All spare parts must have quantity greater than 0.";
            } else if (is_empty) {
                errorMsg = "All spare parts must have a valid item name.";
            } else if (!hasValidServices) {
                errorMsg = "All services must have a valid description.";
            }
            setSnackbarMessage(errorMsg);
            setOpenSnackbar(true);
        }
    };

    // Function to create procurement
    const createProcurement = async (itemsToProcure, serviceId = null) => {
        const token = Cookies.get("token");
        try {
            const procurementPayload = {
                pr_type: "SRPR",
                items: itemsToProcure,
                referenceName: `Procurement for Job Card using ${appointmentId}`,
            };

            // Add service_id if available
            if (serviceId) {
                procurementPayload.service_id = serviceId;
            }

            console.log("Creating procurement with payload:", procurementPayload);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/procurement/srpr`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(procurementPayload),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create procurement");
            }
            const data = await response.json();
            setPrNo(data.pr_no); // Set the PR number from the response
            setPrCreated(true); // Mark PR as created
            setSnackbarMessage(`Procurement ${data.pr_no} created successfully`);
            setOpenSnackbar(true);
        } catch (error) {
            setSnackbarMessage(`Error creating procurement: ${error.message}`);
            setOpenSnackbar(true);
            console.error("Procurement error:", error);
        }
    };

    //!! Updating KM in the database
    const updateKm = async (newKm) => {
        const token = Cookies.get("token");
        if (isNaN(newKm)) {
            setSnackbarMessage("KM should be a number");
            setSeverity("error");
            setOpenSnackbar(true);
            return;
        }
        try {
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
            setSeverity("success");
            setOpenSnackbar(true);
        } catch (error) {
            setSnackbarMessage("Failed to update KM");
            setSeverity("error");
            setOpenSnackbar(true);
        }
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
        // Check if mechanic is assigned
        if (!selectedMechanic) {
            setSnackbarMessage("Please assign a mechanic before saving");
            setOpenSnackbar(true);
            return;
        }

        // check if km is 0
        console.log("Hitting Before");
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
        console.log("Hitting After");
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
                const updatedItems = [...prevItems];
                updatedItems[index].spares.splice(spareIndex, 1); // Remove the spare at the specified index
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
                const updatedItems = [...prevItems];
                updatedItems[index].spares.splice(spareIndex, 1); // Remove the spare at the specified index
                return updatedItems;
            });
        } else {
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

    const assignMechanic = async (mechanicId, mechanicName) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/assign_mechanic`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ mechanic_id: mechanicId }),
                }
            );

            if (!response.ok) throw new Error("Failed to assign mechanic");

            setSelectedMechanic(mechanicId);
            setSnackbarMessage(`Mechanic ${mechanicName} assigned successfully`);
            setOpenSnackbar(true);

            // Optional: Send WhatsApp notification
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
                const dynamicValues = {
                    customer_name: customer.customer_name,
                    order_id: appointmentId,
                    vehicle_id: vehicleId,
                    km: km,
                    mechanic_name: mechanicName,
                };
                const message = replacePlaceholders(
                    template.data.template_message,
                    dynamicValues
                );
                const fromNumber = Cookies.get("phone");
                const toNumber = customer.contact.phone;
                const type = "text";
                sendWhatsappMessage(fromNumber, toNumber, message, type, null, null);
            }
        } catch (error) {
            console.error("Error assigning mechanic:", error);
            setSnackbarMessage("Error assigning mechanic");
            setOpenSnackbar(true);
        }
    };

    const handleToggleExpand = (index) => {
        setExpandedComments((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    //!! Handle Status Change API call
    const handleStatusUpdate = async () => {
        if (!statusChange) {
            setSnackbarMessage("Please select a status");
            setOpenSnackbar(true);
            return;
        }

        const token = Cookies.get("token");

        // Map the dropdown values to API status values
        const statusMap = {
            server_center: "released",
            service_inspection: "inspection",
            invoice: "invoice"
        };

        const apiStatus = statusMap[statusChange];

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_status`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: apiStatus }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            setSnackbarMessage("Status updated successfully");
            setSeverity("success");
            setOpenSnackbar(true);
            setStatusChange(""); // Reset the dropdown
        } catch (error) {
            console.error("Error updating status:", error);
            setSnackbarMessage("Error updating status");
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };

    // Add a new spare row to header
    const handleAddSpareToHeader = () => {
        setHeaderSpares((prevSpares) => [
            ...prevSpares,
            { spareList: "", qty: 0, price: 0 },
        ]);
    };

    // Update spare row in header
    const handleUpdateHeaderSpare = (index, field, value) => {
        setHeaderSpares((prevSpares) => {
            const updatedSpares = [...prevSpares];
            updatedSpares[index] = {
                ...updatedSpares[index],
                [field]: value,
            };
            return updatedSpares;
        });
    };

    // Remove spare row from header
    const handleRemoveHeaderSpare = (index) => {
        if (headerSpares.length === 1) {
            setSnackbarMessage("You must have at least one spare");
            setSeverity("warning");
            setOpenSnackbar(true);
            return;
        }
        setHeaderSpares((prevSpares) => prevSpares.filter((_, i) => i !== index));
    };

    // Load issue back to header for editing
    const handleEditIssue = (index) => {
        const issue = estimateItems[index];
        setHeaderReportedIssue(issue.reportedIssue);
        setHeaderSpares(issue.spares);
        // Remove from list
        setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
        // Scroll to header
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Submit issue with all spares from header to the list below
    const handleAddIssueFromHeader = () => {
        const reportedIssue = headerReportedIssue.trim();

        if (!reportedIssue) {
            setSnackbarMessage("Please enter a reported issue description");
            setSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        // Validate all spares have required data
        const validSpares = headerSpares.filter((spare) => spare.spareList.trim() !== "");
        if (validSpares.length === 0) {
            setSnackbarMessage("Please add at least one spare part");
            setSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        // Calculate total estimated amount
        const totalAmount = validSpares.reduce((sum, spare) => {
            return sum + (parseFloat(spare.qty) || 0) * (parseFloat(spare.price) || 0);
        }, 0);

        // Create new issue
        const newIssue = {
            service_id: "",
            type: "Services",
            spares: validSpares,
            reportedIssue: reportedIssue,
            estimatedAmount: totalAmount.toFixed(2),
            isNew: true,
        };

        setEstimateItems((prevItems) => [...prevItems, newIssue]);

        // Clear header
        setHeaderReportedIssue("");
        setHeaderSpares([{ spareList: "", qty: 0, price: 0 }]);

        setSnackbarMessage("Issue added successfully");
        setSeverity("success");
        setOpenSnackbar(true);
        setHasChanges(true);
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
    const pageType = Cookies.get("page_type"); // "tab" or others

    const safeParseComments = (comments) => {
        if (!comments) return [];

        // Already parsed
        if (typeof comments === "object") return comments;

        try {
            const parsed = JSON.parse(comments);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            // Plain text fallback
            return [
                {
                    comments: comments,
                    current_date: null,
                },
            ];
        }
    };


    return (
        <div>
            {/* <Navbar pageName="Job Assessment Details" hasChanges={hasChanges} /> */}
            {pageType !== "tab" && <Navbar pageName="Job Assessment Details" hasChanges={hasChanges} />}
            <Dialog
                open={opencomment_modal}
                onClose={() => setopencomment_modal(false)}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 2, // Rounded corners
                        padding: 2, // Add padding for better spacing
                        overflow: 'hidden', // Ensure content doesn't overflow outside
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Subtle shadow for modern look
                    },
                }}
            >
                {/* Close Icon */}
                <IconButton
                    edge="end"
                    color="danger"
                    onClick={() => setopencomment_modal(false)}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <TableContainer
                    sx={{
                        maxHeight: '60vh', // Make it scrollable vertically
                        overflowY: 'auto',
                        backgroundColor: '#f9f9f9', // Light background for modern feel
                        borderRadius: 8, // Rounded edges for the table container
                    }}
                >
                    <Table>
                        <TableHead
                            sx={{
                                position: 'sticky', // Sticky header
                                top: 0, // Fix header at the top
                                backgroundColor: '#f1f1f1', // Light background for header
                                color: '#333', // Dark text for contrast
                                zIndex: 1, // Ensure header is above the content
                            }}
                        >
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Reported Issue</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Part Number</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Inspection Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Comments</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {appointmentDataLog.services_actual?.map((service) => (
                                <TableRow key={service.service_id}>
                                    <TableCell>{service.service_description}</TableCell>
                                    <TableCell>
                                        {service.items_required?.map((item) => (
                                            <Typography key={item.item_id} variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                {item.item_id}: {item.item_name} ({item.qty})
                                            </Typography>
                                        ))}
                                    </TableCell>
                                    <TableCell>{service.service_status}</TableCell>
                                    <TableCell>
                                        {safeParseComments(service.comments).map((comment, index) => {
                                            const commentText = comment.comments;
                                            const truncatedText =
                                                commentText.length > 200
                                                    ? commentText.slice(0, 300) + "..."
                                                    : commentText;

                                            return (
                                                <Box key={index} sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.9rem', color: "#333" }}>
                                                        {expandedComments[index] ? commentText : truncatedText}
                                                    </Typography>
                                                    {commentText.length > 200 && (
                                                        <Button
                                                            onClick={() => handleToggleExpand(index)}
                                                            variant="text"
                                                            sx={{ padding: 0, color: "primary.main", fontSize: '0.85rem' }}
                                                        >
                                                            {expandedComments[index] ? (
                                                                <>
                                                                    <ExpandLess fontSize="small" /> Read less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ExpandMore fontSize="small" /> Read more
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                                        {comment.current_date}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Dialog>
            <Box
                sx={{
                    backgroundSize: "cover",
                    color: "#333",
                    minHeight: "89vh",
                    backgroundColor: "#fafafa",
                    paddingX: 2,
                    paddingTop: 2
                }}
                style={{ marginTop: pageType !== "tab" ? "0px" : "16px" }}
            >
                <Box sx={{ maxWidth: "1400px", marginX: "auto" }}>
                    {loading && <Typography>Loading details...</Typography>}
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={6000}
                        onClose={handleCloseSnackbar}
                    >
                        <MuiAlert
                            onClose={handleCloseSnackbar}
                            severity={severity}
                            sx={{ width: "100%" }}
                        >
                            {snackbarMessage}
                        </MuiAlert>
                    </Snackbar>
                    {customer && (
                        <Box display="flex" flexDirection="column" gap={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: 2,
                                    marginBottom: 2,
                                    paddingBottom: 2.5,
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                    padding: 3,
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)"
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
                                                setHasChanges(true);
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
                                        <FormControl sx={{ width: "200px" }} size="small" required>
                                            <InputLabel id="mechanic-label">Mechanic *</InputLabel>
                                            <Select
                                                labelId="mechanic-label"
                                                value={selectedMechanic}
                                                size="small"
                                                error={!selectedMechanic}
                                                onChange={(e) => {
                                                    const mechanicId = e.target.value;
                                                    const mechanic = users.find(
                                                        (user) => user.user_id === mechanicId
                                                    );
                                                    const mechanicName = mechanic
                                                        ? `${mechanic.firstName} ${mechanic.lastName}`
                                                        : "";
                                                    setSelectedMechanic(mechanicId);
                                                    assignMechanic(mechanicId, mechanicName);
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>Select Mechanic</em>
                                                </MenuItem>
                                                {users.map((user) => (
                                                    <MenuItem key={user.user_id} value={user.user_id}>
                                                        {`${user.firstName} ${user.lastName}`}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>




                                        <FormControl sx={{ width: "200px" }} size="small" required>
                                            <InputLabel id="status-label">Status Change</InputLabel>
                                            <Select
                                                labelId="status-label"
                                                label="Status Change"
                                                value={statusChange}
                                                size="small"
                                                error={!statusChange}
                                                onChange={(e) => setStatusChange(e.target.value)}
                                            >
                                                <MenuItem value="">
                                                    <em>Select Status</em>
                                                </MenuItem>

                                                <MenuItem value="server_center">
                                                    Save to Server Center
                                                </MenuItem>

                                                <MenuItem value="service_inspection">
                                                    Save to Service Inspection
                                                </MenuItem>

                                                <MenuItem value="invoice">
                                                    Save to Invoice
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            style={{ height: "38px" }}
                                            onClick={handleStatusUpdate}
                                        >
                                            Status Update
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

                                    {/* //! Not Required anymore */}
                                    {/* <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
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
                  </div> */}
                                </div>
                            </Paper>

                            {/* STICKY HEADER - ADD NEW ISSUE WITH MULTIPLE SPARES */}
                            <Paper elevation={1} sx={{
                                padding: 3,
                                backgroundColor: "#ffffff",
                                marginBottom: 4,
                                border: "1px solid #f0f0f0",
                                borderRadius: 2,
                                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)"
                            }}>
                                {/* Card Header */}
                                <Box sx={{ marginBottom: 3, paddingBottom: 2, borderBottom: "1px solid #f0f0f0" }}>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 600,
                                        fontSize: "1.1rem",
                                        color: "#1a1a1a",
                                        letterSpacing: "-0.3px"
                                    }}>
                                        Add New Issue
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#999", fontSize: "0.75rem" }}>
                                        Fill in the issue details and spare parts information
                                    </Typography>
                                </Box>

                                {/* Two Column Layout */}
                                <Grid container spacing={3} sx={{ marginBottom: 2 }}>
                                    {/* Left Half - Reported Issue */}
                                    <Grid item xs={12} md={6}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{
                                                color: "#333",
                                                fontSize: "0.85rem",
                                                marginBottom: 1,
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5
                                            }}>
                                                Reported Issue
                                                <span style={{ color: "#e53935" }}>*</span>
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Describe the issue or problem found..."
                                                value={headerReportedIssue}
                                                onChange={(e) => setHeaderReportedIssue(e.target.value)}
                                                multiline
                                                rows={4}
                                                variant="outlined"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        backgroundColor: "#fafafa",
                                                        "& fieldset": {
                                                            borderColor: "#e0e0e0",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#bdbdbd",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#1976d2",
                                                        }
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Right Half - Spares Section */}
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                                <Typography variant="subtitle2" sx={{
                                                    color: "#333",
                                                    fontSize: "0.85rem",
                                                    fontWeight: 600
                                                }}>
                                                    Spare Parts
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={handleAddSpareToHeader}
                                                    sx={{
                                                        fontSize: "0.75rem",
                                                        padding: "4px 12px",
                                                        height: "32px",
                                                        textTransform: "none",
                                                        borderColor: "#d0d0d0",
                                                        color: "#1976d2",
                                                        "&:hover": {
                                                            borderColor: "#1976d2",
                                                            backgroundColor: "#f5f5f5"
                                                        }
                                                    }}
                                                >
                                                    Add Spare
                                                </Button>
                                            </Box>

                                            {/* Spares Grid - Expands to fill available space */}
                                            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.2 }}>
                                                {headerSpares.map((spare, spareIdx) => (
                                                    <Box
                                                        key={spareIdx}
                                                        sx={{
                                                            padding: 1.5,
                                                            backgroundColor: "#fafafa",
                                                            borderRadius: 1.5,
                                                            border: "1px solid #e8e8e8",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 1,
                                                            transition: "all 0.2s ease",
                                                            "&:hover": {
                                                                backgroundColor: "#f5f5f5",
                                                                borderColor: "#d0d0d0"
                                                            }
                                                        }}
                                                    >
                                                        {/* Spare Part Autocomplete */}
                                                        <Autocomplete
                                                            size="small"
                                                            options={inventory.map((option) => option.part_name)}
                                                            value={spare.spareList}
                                                            onChange={(e, newValue) => {
                                                                const selectedItem = inventory.find((item) => item.part_name === newValue);
                                                                handleUpdateHeaderSpare(spareIdx, "spareList", newValue || "");
                                                                if (selectedItem) {
                                                                    handleUpdateHeaderSpare(spareIdx, "price", selectedItem.price || 0);
                                                                }
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Select Part"
                                                                    placeholder="Search spare part..."
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root": {
                                                                            backgroundColor: "#fff",
                                                                            "& fieldset": {
                                                                                borderColor: "#e0e0e0",
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        />

                                                        {/* Qty, Price, and Delete in a row */}
                                                        <Grid container spacing={1} sx={{ alignItems: "flex-end" }}>
                                                            <Grid item xs={6}>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    type="number"
                                                                    label="Qty"
                                                                    value={spare.qty}
                                                                    onChange={(e) =>
                                                                        handleUpdateHeaderSpare(spareIdx, "qty", parseFloat(e.target.value) || 0)
                                                                    }
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter" && spareIdx === headerSpares.length - 1) {
                                                                            handleAddSpareToHeader();
                                                                        }
                                                                    }}
                                                                    inputProps={{ step: "0.5", min: "0" }}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root": {
                                                                            backgroundColor: "#fff",
                                                                            "& fieldset": {
                                                                                borderColor: "#e0e0e0",
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </Grid>

                                                            <Grid item xs={4}>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    type="number"
                                                                    label="Price"
                                                                    value={spare.price}
                                                                    onChange={(e) =>
                                                                        handleUpdateHeaderSpare(spareIdx, "price", parseFloat(e.target.value) || 0)
                                                                    }
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter" && spareIdx === headerSpares.length - 1) {
                                                                            handleAddSpareToHeader();
                                                                        }
                                                                    }}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root": {
                                                                            backgroundColor: "#fff",
                                                                            "& fieldset": {
                                                                                borderColor: "#e0e0e0",
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </Grid>

                                                            <Grid item xs={2} sx={{ display: "flex", justifyContent: "center" }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleRemoveHeaderSpare(spareIdx)}
                                                                    sx={{
                                                                        color: "#e53935",
                                                                        padding: "6px",
                                                                        transition: "all 0.2s ease",
                                                                        "&:hover": {
                                                                            backgroundColor: "#ffebee"
                                                                        }
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <DeleteIcon sx={{ fontSize: "18px" }} />
                                                                </IconButton>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Add Issue Button */}
                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, marginTop: 3, paddingTop: 2, borderTop: "1px solid #f0f0f0" }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddIssueFromHeader}
                                        sx={{
                                            fontSize: "0.9rem",
                                            padding: "8px 24px",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            boxShadow: "0px 2px 4px rgba(25, 118, 210, 0.15)",
                                            "&:hover": {
                                                boxShadow: "0px 4px 8px rgba(25, 118, 210, 0.25)"
                                            }
                                        }}
                                    >
                                        Add Issue
                                    </Button>
                                </Box>
                            </Paper>

                            {estimateItems.some(item => item.spares.some(spare => spare.spareList && spare.spareList.trim() !== "")) && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        padding: 2.5,
                                        borderRadius: 2,
                                        marginBottom: 3,
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #f0f0f0",
                                        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)"
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, marginBottom: 2, color: "#1a1a1a" }}>
                                        Issues & Spare Parts
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 400 }} className="table-container">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: "#f8f8f8", borderBottom: "2px solid #e8e8e8" }}>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }}>
                                                        Reported Issue
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }}>
                                                        Spare Part
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }} align="center">
                                                        Qty
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }} align="center">
                                                        Price
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }} align="right">
                                                        Amount
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#333" }} align="center">
                                                        Actions
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {estimateItems.filter(item => item.spares.some(spare => spare.spareList && spare.spareList.trim() !== "")).map((item, index) =>
                                                    item.spares.filter(spare => spare.spareList && spare.spareList.trim() !== "").map((spare, spareIndex) => (
                                                        <TableRow key={`${index}-${spareIndex}`}>
                                                            {spareIndex === 0 && (
                                                                <TableCell rowSpan={item.spares.length} sx={{ fontSize: "0.8rem", maxWidth: "150px" }}>
                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                        <span>{item.reportedIssue || "-"}</span>
                                                                        <Tooltip title="Edit">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleEditIssue(estimateItems.indexOf(item))}
                                                                                sx={{ color: "primary.main", padding: "2px", minWidth: "24px" }}
                                                                            >
                                                                                <EditIcon sx={{ fontSize: "14px" }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ fontSize: "0.8rem", maxWidth: "120px" }}>
                                                                {spare.spareList || "-"}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: "0.8rem" }} align="center">
                                                                {spare.qty || 0}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: "0.8rem" }} align="center">
                                                                {Role !== "Mechanic" ? (parseFloat(spare.price) || 0).toFixed(2) : "-"}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: "0.8rem", fontWeight: "bold" }} align="right">
                                                                {Role !== "Mechanic"
                                                                    ? ((parseFloat(spare.qty) || 0) * (parseFloat(spare.price) || 0)).toFixed(2)
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: "0.8rem" }} align="center">
                                                                <Tooltip title="Delete">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => {
                                                                            deleteSpareByServiceId(
                                                                                spare.service_id,
                                                                                estimateItems.indexOf(item),
                                                                                spareIndex
                                                                            );
                                                                        }}
                                                                        sx={{ color: "red", padding: "4px" }}
                                                                    >
                                                                        <DeleteIcon sx={{ fontSize: "16px" }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Summary Row */}
                                    {Role !== "Mechanic" && (
                                        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2, paddingTop: 2, borderTop: "1px solid #e0e0e0" }}>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                Total: {parseFloat(grandTotal).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            )}

                            {!estimateItems.some(item => item.spares.some(spare => spare.spareList && spare.spareList.trim() !== "")) && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        padding: 4,
                                        borderRadius: 2,
                                        marginBottom: 3,
                                        textAlign: "center",
                                        backgroundColor: "#fafafa",
                                        border: "1px solid #f0f0f0"
                                    }}
                                >
                                    <Typography variant="body1" sx={{ color: "#aaa", fontWeight: 500 }}>
                                        No issues found - Add a new issue to get started
                                    </Typography>
                                </Paper>
                            )}

                            {Role != "Mechanic" && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        padding: 3,
                                        borderRadius: 2,
                                        marginBottom: 3,
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #f0f0f0",
                                        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)"
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 2, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                                        Summary
                                    </Typography>
                                    <Divider sx={{ marginBottom: 2.5, borderColor: "#f0f0f0" }} />
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ padding: 1.5, backgroundColor: "#fafafa", borderRadius: 1, border: "1px solid #f0f0f0" }}>
                                                <Typography variant="caption" sx={{ color: "#999", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 0.5 }}>
                                                    Grand Total
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2", fontSize: "1.3rem" }}>
                                                    {grandTotal.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ padding: 1.5, backgroundColor: "#fafafa", borderRadius: 1, border: "1px solid #f0f0f0" }}>
                                                <Typography variant="caption" sx={{ color: "#999", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: 0.5 }}>
                                                    Overall Total
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2", fontSize: "1.3rem" }}>
                                                    {overallTotal.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}
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
                            setOpenAddProductModal={setOpenAddProductModal}
                            typedname={typedname}
                        />
                    </Modal>

                    <Box
                        sx={{
                            position: "fixed",
                            bottom: 20,
                            right: 120,
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                        // marginTop={0}
                        // marginBottom={1}
                        >
                            {Array.isArray(appointmentDataLog.services_actual) &&
                                appointmentDataLog.services_actual.length > 0 &&
                                appointmentDataLog.services_actual.some(
                                    (service) => service.service_id
                                ) ? (
                                <Button
                                    // disabled={updateButtonclicked}
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        previewPDF();
                                    }}
                                    sx={{
                                        marginRight: 2,
                                        height: "40px",
                                        width: "60px",
                                    }}
                                >
                                    <VisibilityIcon />
                                </Button>

                            ) : (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={() => {
                                        if (km === 0) {
                                            console.log("Km is 0");
                                            setSnackbarMessage("KM should be greater than 0");
                                            setOpenSnackbar(true);
                                            return;
                                        } else {
                                            // handleRelease();
                                            validateAndPostService(
                                                "services_actual",
                                                appointmentDataLog,
                                                "save"
                                            );
                                        }
                                    }}
                                    sx={{
                                        marginRight: 2,
                                        height: "40px",
                                        width: "120px",
                                    }}
                                >
                                    <SaveIcon />
                                </Button>
                            )}
                            <Button
                                // disabled={updateButtonclicked}
                                variant="contained"
                                color="success"
                                onClick={() => {
                                    // check if km is greater than 0
                                    if (km > 0) {
                                        validateAndPostService(
                                            "services_actual",
                                            appointmentDataLog
                                        );
                                        setUpdateButtonclicked(false);
                                        // disable the button
                                        setUpdateButtonclicked(true);
                                    } else {
                                        setSnackbarMessage("KM should be greater than 0");
                                        setOpenSnackbar(true);
                                    }
                                }}
                                sx={{
                                    marginRight: 6,
                                    height: "40px",
                                    width: "60px",
                                }}
                            >
                                <EditIcon />
                            </Button>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            position: "fixed",
                            bottom: 20,
                            right: 70,
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        {" "}
                        {Role != "Mechanic" && (
                            <IconButton
                                variant="contained"
                                size="small"
                                // sx={{ marginRight: 1}}
                                sx={{
                                    height: "50px",
                                    width: "50px",
                                    marginRight: 1,
                                    backgroundColor: "green",
                                    "&:hover": {
                                        backgroundColor: "blue",
                                    },
                                    boxShadow: 3,
                                }}
                                onClick={handleGeneratePDF}
                            >
                                <PrintIcon />
                            </IconButton>
                        )}
                    </Box>

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
            </Box >

            <AppAlert alertData={jobCardAlertData} />
        </div >
    );
};

export default CustomerDetail;

// last update 07-03-2025 11:56 AM
