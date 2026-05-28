"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";

import {
  fetchData,
  updatePRItem,
  deletePRItem,
  searchPR,
} from "../../../../controllers/purchaseControllers";
// !whatsapp things
import {
  checkWhatsappLoggedIn,
  sendWhatsappMessage,
} from "@/components/whatsapp";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Divider,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Drawer,
  TextField,
  Snackbar,
  Alert,
  Autocomplete,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";

// Add this custom component for mobile view
const MobileTableRow = ({
  item,
  onReceivedClick,
  isSelected,
  onSelectItem,
  tallied,
}) => (
  <Box
    sx={{
      border: "1px solid #ddd",
      borderRadius: "4px",
      mb: 1,
      p: 1,
      display: { xs: "block", sm: "none" },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
      <Checkbox checked={isSelected} onChange={() => onSelectItem(item._id)} />
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => onReceivedClick(item)}
        disabled={item.qty <= 0 || tallied}
      >
        Received
      </Button>
    </Box>
    <Typography>
      <strong>Product:</strong> {item.product}
    </Typography>
    <Typography>
      <strong>Details:</strong> {item.details}
    </Typography>
    <Typography>
      <strong>Quantity:</strong> {item.qty}
    </Typography>
    <Typography>
      <strong>Estimated Delivery:</strong>{" "}
      {new Date(item.estimatedDelivery).toLocaleDateString("en-IN")}
    </Typography>
    <Typography>
      <strong>Supplier Name:</strong> {item.supplierName || "N/A"}
    </Typography>
    <Typography>
      <strong>Supplier Number:</strong> {item.supplierNumber || "N/A"}
    </Typography>
  </Box>
);

const DrawerToggleButton = ({ handleDrawerToggle }) => (
  <IconButton
    color="inherit"
    aria-label="open drawer"
    edge="start"
    onClick={handleDrawerToggle}
    sx={{
      // display: { md: "none" }, // Hide on medium and larger screens
      position: "absolute",
      left: 16, // Add left positioning
      top: 16, // Add top positioning
      zIndex: 1, // Ensure it's above other elements
    }}
  >
    <MenuIcon />
  </IconButton>
);

export default function Purchase() {
  const [filterStatus, setFilterStatus] = useState("pending");

  const [token, setToken] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(true);
  const [prList, setPrList] = useState([]);
  const [filteredPrList, setFilteredPrList] = useState([]);
  const [slcdPr, setSlcdPr] = useState(null);
  const [selectedPR, setSelectedPR] = useState(null);
  const [showFormInTable, setShowFormInTable] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    prType: "MNPR",
    referenceName: "",
    supplierName: "",
    supplierNumber: "",
    items: [{ product: "", details: "", qty: "", estimatedDelivery: "" }],
  });
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [selectedRowId, setSelectedRowId] = useState([]);
  const [selectedRowDetails, setSelectedRowDetails] = useState([]);
  const [prEditModalOpen, setPrEditModalOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDeletePRDialog, setOpenDeletePRDialog] = useState(false);

  const [qty, setQty] = useState("");
  const [receivedQty, setReceivedQty] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierNumber, setSupplierNumber] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState("");

  const [searchTimeout, setSearchTimeout] = useState(null);

  const drawerWidth = {
    xs: 340,
    sm: 340,
    md: 340,
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);

    let slcdPr = Cookies.get("selectedPR");

    // If no PR is selected, find the latest pending PR
    if (!slcdPr && prList.length > 0) {
      const latestPendingPR = prList
        .filter((pr) => pr.status === "pending")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (latestPendingPR) {
        slcdPr = latestPendingPR._id;
        setSlcdPr(slcdPr);
        Cookies.set("selectedPR", slcdPr);
      }
    } else {
      setSlcdPr(slcdPr);
    }

    fetchData(storedToken, setPrList, setSelectedPR, slcdPr, selectedPR);

  }, [supplierId, updateKey]); // Remove prList from dependencies

  useEffect(() => {
    // Fetch data and set prList
    // After fetching, also set filteredPrList to the initial prList
    {
      console.log({ prList });
    }
    setFilteredPrList(prList);
  }, [prList]); // Update filtered list whenever prList changes

  const handleSearch = (event) => {
    const searchQuery = event.target.value;

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set a new timeout
    const timeout = setTimeout(() => {
      searchPR(token, prList, setSelectedPR, slcdPr, searchQuery, setPrList);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSelectSupplierChange = (event, index) => {
    const selectedSupplierName = event.target.value;
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.name === selectedSupplierName
    );

    // Ensure the index is valid and the item exists
    if (index >= 0 && index < formData.items.length) {
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index], // Spread the existing item properties
        supplierName: selectedSupplierName,
        supplierNumber: selectedSupplier ? selectedSupplier.contact.phone : "",
      };

      setFormData({ ...formData, items: updatedItems });
    } else {
    }
  };

  const drawer = (
    <Box
      sx={{
        height: "100%", // Take full height
        display: "flex",
        flexDirection: "column", // Stack children vertically
      }}
    >
      <Typography
        variant="h6"
        sx={{
          padding: "20px 0 0 0 ",
          textAlign: "center",
        }}
      >
        <b>PR List</b>
      </Typography>

      {/* Step 2: Add a dropdown for filtering */}
      <TextField
        select
        size="small"
        label="Filter"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        sx={{ margin: "0 10px 10px 10px" }}
        SelectProps={{
          native: true,
        }}
      >
        <option value="pending">Pending</option>
        <option value="Completed">Completed</option>
        <option value="all">All</option>
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        label="Search PRs, Products, or Suppliers"
        onChange={handleSearch}
        variant="outlined"
        placeholder="Type to search..."
      />

      <Divider />

      <Box sx={{ flexGrow: 1, overflow: "auto", mt: 2 }}>
        <List>
          {prList
            .filter((pr) => {
              if (filterStatus === "all") return true;
              return pr.status === filterStatus;
            })
            .sort((a, b) => {
              // Extract numeric part from pr_no (e.g., "PR-100001" -> 100001)
              const numA = parseInt(a.pr_no.split("-")[1], 10);
              const numB = parseInt(b.pr_no.split("-")[1], 10);
              return numB - numA; // Descending order
            })
            .map((pr) => (
              <ListItem
                key={pr._id}
                disablePadding
                sx={{
                  backgroundColor:
                    selectedPR && selectedPR._id === pr._id
                      ? "lightblue"
                      : "transparent",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                }}
              >
                <ListItemButton
                  onClick={() => {
                    setSelectedPR(pr);
                    setShowFormInTable(false);
                    setMobileOpen(false);
                    Cookies.set("selectedPR", pr._id);
                  }}
                >
                  <ListItemText
                    primary={
                      <>
                        {`PR No: ${pr.pr_no}`}
                        <br />
                        {pr.referenceName && pr.referenceName.trim() !== ""
                          ? `Reference Name: ${pr.referenceName}`
                          : ""}
                      </>
                    }
                    secondary={
                      pr.pr_type
                        ? `PR Type: ${pr.pr_type}`
                        : `Supplier Name: ${pr.supplierName}`
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
      </Box>
      {/* Fixed Add PR List button at bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(0, 0, 0, 0.12)",
          backgroundColor: "background.paper",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => {
            handleAddPRListClick();
            setMobileOpen(false);
          }}
        >
          Add PR List
        </Button>
      </Box>
    </Box>
  );

  const formatDate = (date) => {
    console.log({ date });
    if (!date) return "";
    try {
      const localDate = new Date(date);

      localDate.setDate(localDate.getDate() + 1);

      return localDate.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchInventoryAndSuppliers = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }
        let limit = 10000;

        const inventoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);

        const suppliersResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/supplier`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      } catch (error) {
        console.log("Error fetching inventory or suppliers:", error);
      }
    };

    fetchInventoryAndSuppliers();
  }, []);

  const handleModalClose = () => {
    setModalData(null);
    setReceivedQuantity("");
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name.startsWith("item")) {
      const items = [...formData.items];
      if (name === `item-supplierName`) {
        const selectedSupplier = suppliers.find(
          (supplier) => supplier.name === value
        );
        items[index].supplierName = value;
        items[index].supplierNumber = selectedSupplier
          ? selectedSupplier.contact.phone
          : "";
      } else {
        items[index][name.split("-")[1]] = value;
      }
      setFormData({ ...formData, items });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addNewItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product: "", details: "", qty: "", estimatedDelivery: "" },
      ],
    });
  };

  const removeItem = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData({ ...formData, items });
  };

  const handleEditClick = (id, currentStatus) => {
    setEditingId(id);
    setNewStatus(currentStatus);
  };

  const handleUpdate = async (id) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement/status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      console.log("Status updated successfully");
      setSnackbarMessage("Status updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setEditingId(null); // Exit edit mode
      // Optionally, refresh the procurement list or update the state
    } catch (error) {
      console.log("Error updating status:", error);
      setSnackbarMessage("Error updating status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete procurement");
      }

      setSnackbarMessage("Procurement deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenDeletePRDialog(false);
      // Refresh the PR list
      setTimeout(() => {
        setUpdateKey(prevKey => prevKey + 1);
      }, 500);
    } catch (error) {
      console.log("Error deleting procurement:", error);
      setSnackbarMessage("Error deleting procurement");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddPRListClick = () => {
    setShowFormInTable(true);
    setSelectedPR(null); // Deselect any selected PR
  };

  const handleSubmit = async () => {
    const onlyAlphabets = /^[a-zA-Z\s.]+$/;
    const onlyNumbers = /^(?!0+$)(?!.*\.\..*)\d+(\.\d+)?$/;
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("No token found. Please log in.");
    }

    // Validation: Check for empty fields in the form and items
    if (
      !formData.referenceName.trim() ||
      formData.items.some(
        (item) =>
          !item.product.trim() ||
          !item.details.trim() ||
          !item.qty.trim() ||
          !item.estimatedDelivery.trim() ||
          !item.supplierName.trim() ||
          !item.supplierNumber.trim()
      )
    ) {
      setSnackbarMessage("Please fill in all required fields.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    } else if (!onlyAlphabets.test(formData.referenceName)) {
      setSnackbarMessage("Reference Name should only contain alphabets.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    } else if (
      formData.items.some((item) => !onlyNumbers.test(item.qty.trim()))
    ) {
      setSnackbarMessage(
        "Quantity should contain only numbers (Should not be 0)."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true); // Start loading

      // Prepare items with correct item_id and supplier_id
      const itemsWithIds = await Promise.all(
        formData.items.map(async (item) => {
          // Ensure product is a string
          const productString = item.product || "";
          const products = productString.split(", ").map((p) => p.trim());

          const processedProducts = await Promise.all(
            products.map(async (product) => {
              let inventoryItem = inventory.find(
                (inv) => inv.part_name === product
              );

              // If the product doesn't exist in inventory, create it
              if (!inventoryItem) {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      part_name: product,
                      part_number: "",
                      description: ".", // Ensure this is valid if required
                      category: "", // Ensure this is valid if required
                      quantity: 0,
                      price: 0,
                    }),
                  }
                );

                if (!response.ok) {
                  const errorDetails = await response.json();
                  throw new Error(
                    `Failed to create new inventory item for ${product}: ${errorDetails.error}`
                  );
                }

                inventoryItem = await response.json(); // Wait for the response to get the new inventory item
                // Add the new item to the local inventory list
                setInventory((prevInventory) => [
                  ...prevInventory,
                  inventoryItem,
                ]);
                setSnackbarMessage(`1 new inventory item created: ${product}`);
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
              }

              const supplier = suppliers.find(
                (supplier) => supplier.name === item.supplierName
              );

              return {
                product,
                item_id: inventoryItem.inventory_id, // Use inventory_id as item_id
                supplierName: item.supplierName || "", // Ensure supplierName is not null
                supplierNumber: item.supplierNumber || "", // Ensure supplierNumber is not null
                supplier_id: supplier ? supplier.supplier_id : null, // Map supplier name to supplier_id
              };
            })
          );

          return processedProducts.map((processedProduct) => ({
            product: processedProduct.product,
            details: item.details,
            qty: item.qty,
            estimatedDelivery: item.estimatedDelivery,
            item_id: processedProduct.item_id, // Use inventory_id as item_id
            supplierName: processedProduct.supplierName,
            supplierNumber: processedProduct.supplierNumber,
            supplier_id: processedProduct.supplier_id,
          }));
        })
      );

      // Flatten the array of arrays into a single array
      const flattenedItems = itemsWithIds.flat();

      const formattedData = {
        pr_type: formData.prType,
        referenceName: formData.referenceName,
        supplierName: formData.supplierName,
        supplierNumber: formData.supplierNumber,
        items: flattenedItems,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit data");
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      setSnackbarMessage("Procurement created");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setModalOpen(false); // Close the modal on successful submission
      // Reset the form
      setFormData({
        prType: "MNPR",
        referenceName: "",
        supplierName: "",
        supplierNumber: "",
        items: [{ product: "", details: "", qty: "", estimatedDelivery: "" }],
      });
      setShowFormInTable(false);
      // ! whatsapp things
      if (checkWhatsappLoggedIn()) {
        // !? replace placeholders in the template message if any
        const replacePlaceholders = (template, dynamicValues) => {
          return template.replace(
            /{{([^}]+)}}/g,
            (match, p1) => dynamicValues[p1] || match
          );
        };
        const fromNumber = Cookies.get("phone");
        const toNumber =
          formattedData.items.length > 0
            ? formattedData.items[0].supplierNumber
            : "";
        let dynamic = {
          product_name:
            formattedData.items.length > 0
              ? formattedData.items[0].product
              : "",
          supplier_name:
            formattedData.items.length > 0
              ? formattedData.items[0].supplierName
              : "",
          qty: formattedData.items.map((item) => item.qty).join(", "),
          supplier_number: toNumber,
        };
        const page = "purchase";
        const template = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${page}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        const message = replacePlaceholders(
          template.data.template_message,
          dynamic
        );
        sendWhatsappMessage(fromNumber, toNumber, message, "text");
      }

      // Refresh the data after creating PR
      setTimeout(() => {
        setUpdateKey(prevKey => prevKey + 1);
      }, 1000);
    } catch (error) {
      console.log("Error submitting data:", error);
      setSnackbarMessage("Error submitting data");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleSelectItem = (index) => {
    setSelectedItems((prevSelected) => {
      // Check if the index is already selected
      if (prevSelected.includes(index)) {
        // If it is, remove it from the selectedItems
        return prevSelected.filter((i) => i !== index);
      } else {
        // If it isn't, add it to the selectedItems
        return [...prevSelected, index];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === selectedPR.items.length) {
      setSelectedItems([]); // Deselect all if all are currently selected
    } else {
      setSelectedItems(selectedPR.items.map((_, index) => index)); // Select all
    }
  };

  const handleUpdateSelectedItems = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      setLoading(true); // Show loading indicator

      await Promise.all(
        selectedItems.map(async (index) => {
          const item = selectedPR.items[index]; // Access the item using the index

          // Check if the item is defined before accessing its properties
          if (!item) {
            console.error(`Item at index ${index} is undefined`);
            return; // Skip this iteration if the item is undefined
          }

          const formattedData = {
            pr_no: selectedPR.pr_no,
            product: item.product,
            received_quantity: parseInt(item.qty, 10), // Use the item's current quantity
          };

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/procurement/updateQuantity/${item.item_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(formattedData),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to update quantities");
          }
        })
      );

      console.log("Selected quantities updated successfully");
      setSnackbarMessage("Selected quantities updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Refresh the data after updating selected items
      setTimeout(() => {
        setUpdateKey(prevKey => prevKey + 1);
      }, 1000);
    } catch (error) {
      console.log("Error updating quantities:", error);
      setSnackbarMessage("Error updating quantities");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleReceivedClick = (item) => {
    setModalData(item);
  };

  const handleReceivedSubmit = async () => {
    const existingQuantity = parseInt(modalData.received_qty, 10);
    const currentlyReceived = parseInt(receivedQuantity, 10);
    const requiredQuantity = parseInt(modalData.qty, 10);

    const totalReceived = existingQuantity + currentlyReceived;

    if (totalReceived > requiredQuantity) {
      setSnackbarMessage("Received quantity cannot exceed PR quantity");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      setLoading(true); // Show loading indicator

      const formattedData = {
        pr_no: selectedPR.pr_no,
        product: modalData.product,
        received_quantity: parseInt(receivedQuantity, 10),
        //! below field add to backend api
        vendor_invoice_number: vendorInvoiceNumber,
        vendor_invoice_date: vendorInvoiceDate,
      };
      // test
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement/updateQuantity/${modalData.item_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update quantities");
      }

      console.log("Quantities updated successfully");
      setSnackbarMessage("Quantities updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleModalClose();

      // Refresh the data after receiving items
      setTimeout(() => {
        setUpdateKey(prevKey => prevKey + 1);
      }, 1000);
    } catch (error) {
      console.log("Error updating quantities:", error);
      setSnackbarMessage("Error updating quantities");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  // Update the table section in mainContent
  const tableContent = selectedPR && (
    <>
      {/* Desktop view */}
      <TableContainer
        component={Paper}
        sx={{ display: { xs: "none", sm: "block" } }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox
                  checked={selectedItems.length === selectedPR.items.length}
                  indeterminate={
                    selectedItems.length > 0 &&
                    selectedItems.length < selectedPR.items.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <b>Product</b>
              </TableCell>
              <TableCell>
                <b>Details</b>
              </TableCell>
              <TableCell>
                <b>PR Qty</b>
              </TableCell>
              <TableCell>
                <b>Received Qty</b>
              </TableCell>
              <TableCell>
                <b>Estimated Delivery</b>
              </TableCell>
              <TableCell>
                <b>Supplier Name</b>
              </TableCell>
              <TableCell>
                <b>Supplier Number</b>
              </TableCell>
              <TableCell>
                <b>Actions</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody style={{ overflowY: "auto" }}>
            {selectedPR.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {/* <Checkbox
                    checked={selectedItems.includes(item._id)}
                    onChange={() => handleSelectItem(item._id)}
                  /> */}
                  <Checkbox
                    checked={selectedItems.includes(index)}
                    onChange={() => handleSelectItem(index)}
                  />
                </TableCell>
                <TableCell>{item.product}</TableCell>
                <TableCell>{item.details}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{receivedQty || item.received_qty}</TableCell>
                <TableCell>
                  {new Date(item.estimatedDelivery).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>{item.supplierName || "N/A"}</TableCell>
                <TableCell>{item.supplierNumber || "N/A"}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      console.log({ dagfa: item.estimatedDelivery });
                      setSelectedRowDetails(item);
                      setPrEditModalOpen(true);
                      setQty(item.qty);
                      setDeliveryDate(
                        item.estimatedDelivery == null
                          ? ""
                          : // : item.estimatedDelivery
                          formatDate(item.estimatedDelivery)
                      );
                      setSupplierName(item.supplierName);
                      setSupplierNumber(item.supplierNumber);
                      setSupplierId(item.supplier_id);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setSelectedRowDetails(item);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleReceivedClick(item)}
                    disabled={
                      item.qty <= 0 ||
                      item.tallied ||
                      item.qty === item.received_qty
                    }
                  >
                    Received
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile view */}
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
          <Checkbox
            checked={selectedItems.length === selectedPR.items.length}
            onChange={handleSelectAll}
          />
          <Typography sx={{ ml: 1 }}>Select All</Typography>
        </Box>
        {selectedPR.items.map((item, index) => (
          <MobileTableRow
            key={index}
            item={item}
            onReceivedClick={handleReceivedClick}
            isSelected={selectedItems.includes(index)}
            onSelectItem={handleSelectItem}
            tallied={item.tallied}
          />
        ))}
      </Box>
    </>
  );

  // Update the mainContent section
  const mainContent = (
    <Box
      sx={{
        p: 2,
        pt: { xs: 6, sm: 2 }, // Add extra top padding on mobile for menu button
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        height: "510px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        position: "relative", // Add this to ensure proper positioning context
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          textAlign: "center",
        }}
      >
        <b>PR Details</b>
      </Typography>

      <DrawerToggleButton handleDrawerToggle={handleDrawerToggle} />
      {showFormInTable ? (
        // Add PR List form content
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create PR List
          </Typography>
          <div style={{ display: "flex" }}>
            <TextField
              fullWidth
              margin="normal"
              label="PR Type"
              disabled
              name="prType"
              value={"MNPR"}
              onChange={handleInputChange}
              style={{ marginRight: "2%" }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Reference Name"
              name="referenceName"
              value={formData.referenceName}
              onChange={handleInputChange}
            />
          </div>
          <Typography variant="h6">Add Product</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Product</b>
                  </TableCell>
                  <TableCell>
                    <b>Details</b>
                  </TableCell>
                  <TableCell>
                    <b>Required Qty</b>
                  </TableCell>
                  <TableCell>
                    <b>Estimated Delivery</b>
                  </TableCell>
                  <TableCell>
                    <b>Supplier Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Supplier Number</b>
                  </TableCell>
                  <TableCell>
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        sx={{ width: "250px" }}
                        options={inventory.map((item) => item.part_name)}
                        freeSolo
                        value={item.product}
                        onInputChange={(event, newInputValue) => {
                          const updatedItems = [...formData.items];
                          updatedItems[index].product = newInputValue;
                          setFormData({ ...formData, items: updatedItems });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            margin="normal"
                            name={`item-product`}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        margin="normal"
                        name={`item-details`}
                        value={item.details}
                        onChange={(e) => handleInputChange(e, index)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        margin="normal"
                        sx={{ width: "80px" }}
                        inputProps={{ maxLength: 5 }}
                        name={`item-qty`}
                        value={item.qty}
                        onChange={(e) => handleInputChange(e, index)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        margin="normal"
                        name={`item-estimatedDelivery`}
                        type="date"
                        value={item.estimatedDelivery}
                        onChange={(e) => handleInputChange(e, index)}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().split("T")[0],
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        margin="normal"
                        name={`item-supplierName`}
                        value={item.supplierName || ""}
                        onChange={(e) => handleSelectSupplierChange(e, index)}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value=""></option>
                        {suppliers.map((supplier) => (
                          <option
                            key={supplier.supplier_id}
                            value={supplier.name}
                          >
                            {supplier.name}
                          </option>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        margin="normal"
                        sx={{ width: "150px" }}
                        name={`item-supplierNumber`}
                        value={item.supplierNumber || ""}
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="secondary"
                        onClick={() => removeItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={7}>
                    <Button onClick={addNewItem} variant="outlined">
                      Add Item
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      color="primary"
                      sx={{ marginLeft: "2%" }}
                    >
                      Submit
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : selectedPR ? (
        // Selected PR details content
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: "10px",
                marginRight: "10px",
              }}
            >
              <Typography variant="h5">PR No: {selectedPR.pr_no}</Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setOpenDeletePRDialog(true)}
              >
                Delete
              </Button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {/* Only show Update Selected button here */}
              {selectedItems.length > 0 && (
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginRight: "0px",
                  }}
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleUpdateSelectedItems}
                    sx={{ height: 36 }}
                  >
                    Updated
                  </Button>
                </Box>
              )}
            </div>
          </div>
          <Typography
            variant="h6"
            sx={{ backgroundColor: "lightblue", textAlign: "center" }}
          >
            {selectedPR.services ? "Services" : "Items"}
          </Typography>
          {/* Main content area that can scroll */}
          <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>{tableContent}</Box>

          {/* Fixed bottom buttons */}
          <Box
            sx={{
              mt: "auto", // Push to bottom
              pt: 2,
              borderTop: "1px solid rgba(0, 0, 0, 0.12)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            {/* {editingId === selectedPR._id ? (
              <div style={{ display: "flex", marginBottom: "100px" }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    marginRight: "10px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleUpdate(selectedPR.pr_no)}
                >
                  Update
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() =>
                    handleEditClick(selectedPR._id, selectedPR.status)
                  }
                >
                  Edit
                </Button>
                
              </div>
            )} */}
          </Box>
        </div>
      ) : (
        <Typography style={{ marginTop: "50px" }}>
          Select a PR from the list or click Add PR List to create a new one
        </Typography>
      )}
    </Box>
  );
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Purchase List" /> */}
      {pageType !== "tab" && <Navbar pageName="Purchase List" />  }
      <Box sx={{ paddingX: "1%", position: "relative" }}>
        {/* <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "75px",
            position: "relative",
          }}
        > */}
        {/* <div style={{ display: "flex", alignItems: 'center' }}>
            <BackButton />
            <h1 style={{ marginLeft: "10px", color: "white" }}>Purchase List</h1>
          </div> */}

        {/* </div> */}

        <Box sx={{ display: "flex", position: "relative" }}>
          {/* Mobile/Tablet drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "block", md: "block", lg: "block" }, // Show on xs and sm screens
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth.xs,
                top: "100px",
                height: "calc(100% - 125px)",
                position: "fixed",
                zIndex: 1000,
              },
            }}
          >
            {drawer}
          </Drawer>

          {/* Desktop drawer */}
          {/* <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" }, // Show only on medium and larger screens
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth.md,
                marginTop: "100px",
                marginLeft: "15px",
                height: "550px",
                borderRadius: "10px",
                zIndex: 1,
              },
            }}
            open
          >
            {drawer}
          </Drawer> */}

          {/* Main content area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              // marginLeft: { md: `${drawerWidth.md}px` }, // Only apply margin on medium and larger screens
              position: "relative",
              zIndex: 2,
              backgroundColor: "transparent",
              width: {
                xs: "100%",
                md: `calc(100% - ${drawerWidth.md}px)`,
              },
            }}
          >
            {mainContent}
          </Box>
        </Box>
      </Box>

      {/* Snackbar and Modal components */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Loading...</Typography>
        </div>
      )}

      <Dialog
        open={prEditModalOpen}
        onClose={() => setPrEditModalOpen(false)}
        fullWidth
        maxWidth="md"
        gap={5}
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            setPrEditModalOpen(false);
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

        {/* //? Edit PR Details Modal */}
        <Dialog
          open={prEditModalOpen}
          onClose={() => setPrEditModalOpen(false)}
          fullWidth
          maxWidth="md"
          gap={5}
        >
          <IconButton
            aria-label="close"
            onClick={() => {
              setPrEditModalOpen(false);
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
            <Typography variant="h6" paddingBottom={2}>
              Edit PR Details
            </Typography>

            <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
              <TextField
                label="Product Name"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={selectedRowDetails.product}
                disabled
              />

              <TextField
                label="Product Detail"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={selectedRowDetails.details || "N/A"}
                disabled
              />
            </Box>

            <Box display="flex" justifyContent="space-between" marginY="normal">
              <TextField
                label="PR Quantity"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                inputProps={{ maxLength: 5 }}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                sx={{ flex: 1, marginRight: "8px" }}
              />

              <TextField
                label="Expected Delivery Date"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                sx={{ flex: 1, marginRight: "8px" }}
                InputLabelProps={{
                  shrink: true, // Ensures the label stays above the input
                }}
                inputProps={{
                  min: new Date().toISOString().split("T")[0],
                }}
              />
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              marginY="normal"
              paddingBottom={2}
            >
              <TextField
                select
                fullWidth
                size="small"
                margin="normal"
                label="Supplier Name"
                name={`item-supplierName`}
                value={supplierName || ""}
                sx={{ flex: 1, marginRight: "8px" }}
                onChange={(e) => {
                  const selectedSupplierName = e.target.value;
                  setSupplierName(selectedSupplierName);
                  // setSupplierId();

                  // Find the selected supplier from the suppliers list
                  const selectedSupplier = suppliers.find(
                    (supplier) => supplier.name === selectedSupplierName
                  );
                  setSupplierId(selectedSupplier.supplier_id);
                  // Set the supplier number based on the selected supplier
                  setSupplierNumber(
                    selectedSupplier ? selectedSupplier.contact.phone : ""
                  );

                  // Update the form data with the selected supplier details
                  handleSelectSupplierChange(e, suppliers);
                }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value=""></option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplier_id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                margin="normal"
                label="Supplier Number"
                value={supplierNumber || ""}
                disabled
                sx={{ flex: 1, marginRight: "8px" }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setPrEditModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                let newData = {
                  product: selectedRowDetails.product,
                  details: selectedRowDetails.details,
                  qty: qty,
                  estimatedDelivery: deliveryDate,
                  supplierName: supplierName,
                  supplierNumber: supplierNumber,
                  item_id: selectedRowDetails.item_id,
                  supplier_id: supplierId,
                };

                const onlyNumbers = /^(?!0+$)(?!.*\.\..*)\d+(\.\d+)?$/;

                if (qty > 0 && onlyNumbers.test(qty)) {
                  updatePRItem(
                    token,
                    selectedPR.pr_no,
                    newData,
                    setSnackbarOpen,
                    setSnackbarMessage,
                    setSnackbarSeverity,
                    setPrEditModalOpen,
                    setUpdateKey
                  );
                } else {
                  setSnackbarOpen(true);
                  setSnackbarMessage("Quantity cannot be Zero");
                  setSnackbarSeverity("error");
                }
              }}
            >
              Update PR
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>

      {/* //? Delete PR Line conformation Dialogue */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lead? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() =>
              deletePRItem(
                token,
                selectedPR.pr_no,
                selectedRowDetails.item_id,
                setSnackbarOpen,
                setSnackbarMessage,
                setSnackbarSeverity,
                setOpenDeleteDialog,
                setUpdateKey
              )
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* //? Delete PR conformation Dialogue */}
      <Dialog
        open={openDeletePRDialog}
        onClose={() => setOpenDeletePRDialog(false)}
      >
        <DialogTitle>Confirm PR Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this Purchase Request? This action
          cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeletePRDialog(false)} color="primary">
            Cancel
          </Button>
          <Button color="error" onClick={() => handleDelete(selectedPR.pr_no)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!modalData}
        onClose={handleModalClose}
        sx={{ "& .MuiDialog-paper": { width: "20rem", maxWidth: "none" } }}
      >
        <DialogTitle>Receive Item</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Product: {modalData?.product}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Supplier: {modalData?.supplierName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            PR Quantity: {modalData?.qty}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Already Received: {modalData?.received_qty}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Received Quantity"
            value={receivedQuantity}
            onChange={(e) => setReceivedQuantity(e.target.value)}
            type="number"
            inputProps={{ min: 0, max: modalData?.qty }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Vendor Invoice Number"
            value={vendorInvoiceNumber}
            onChange={(e) => setVendorInvoiceNumber(e.target.value)}
            type="text"
            inputProps={{ min: 0, max: modalData?.qty }}
          />
          <TextField
            fullWidth
            margin="normal"
            value={vendorInvoiceDate}
            onChange={(e) => setVendorInvoiceDate(e.target.value)}
            type="date"
            inputProps={{ min: 0, max: modalData?.qty }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="secondary">
            Close
          </Button>
          <Button
            onClick={handleReceivedSubmit}
            color="primary"
            disabled={!receivedQuantity}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

