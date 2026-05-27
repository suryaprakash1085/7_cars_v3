"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
  Typography,
  Button,
  Modal,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Autocomplete,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Navbar from "@/components/navbar";
import { Delete as DeleteIcon } from "@mui/icons-material";
import BackButton from "@/components/backButton";
import CloseIcon from "@mui/icons-material/Close";

export default function Purchase() {
  const [prList, setPrList] = useState([]);
  const [selectedPR, setSelectedPR] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    prType: "MNPR",
    referenceName: "",
    supplierName: "",
    supplierNumber: "",
    items: [{ product: "", details: "", qty: "", estimatedDelivery: "" }],
  });
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showFormInTable, setShowFormInTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [receivedQuantity, setReceivedQuantity] = useState('');

  useEffect(() => {

    const fetchData = async () => {
      const token = Cookies.get("token");
      if (!token) {
      throw new Error("No token found. Please log in.");
    }

    // Fetch data from the API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setPrList(data))
      .catch((error) => console.log("Error fetching data:", error));
    };

    fetchData();
  }, []);
  // console.log(prList);

  useEffect(() => {
    const fetchInventoryAndSuppliers = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const inventoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);

        const suppliersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/supplier`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      } catch (error) {
        console.log("Error fetching inventory or suppliers:", error);
      }
    };

    fetchInventoryAndSuppliers();
  }, []);

  // console.log(prList);

  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => {
    setModalData(null);
    setReceivedQuantity('');
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name.startsWith("item")) {
      const items = [...formData.items];
      if (name === `item-supplierName`) {
        const selectedSupplier = suppliers.find(supplier => supplier.name === value);
        items[index].supplierName = value;
        items[index].supplierNumber = selectedSupplier ? selectedSupplier.contact.phone : '';
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      console.log('Status updated successfully');
      setSnackbarMessage('Status updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditingId(null); // Exit edit mode
      // Optionally, refresh the procurement list or update the state
    } catch (error) {
      console.log('Error updating status:', error);
      setSnackbarMessage('Error updating status');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete procurement');
      }

      console.log('Procurement deleted successfully');
      setSnackbarMessage('Procurement deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Update the state to remove the deleted procurement
      setPrList(prList.filter(pr => pr._id !== id));
    } catch (error) {
      console.log('Error deleting procurement:', error);
      setSnackbarMessage('Error deleting procurement');
      setSnackbarSeverity('error');
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
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("No token found. Please log in.");
    }

    // Validation: Check for empty fields in the form and items
    if (
      !formData.referenceName.trim() ||
      formData.items.some(item => 
        !item.product.trim() || 
        !item.details.trim() || 
        !item.qty.trim() || 
        !item.estimatedDelivery.trim() || 
        !item.supplierName.trim() || 
        !item.supplierNumber.trim()
      )
    ) {
      setSnackbarMessage('Please fill in all required fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true); // Start loading

      // Prepare items with correct item_id and supplier_id
      const itemsWithIds = await Promise.all(formData.items.map(async (item) => {
        // Ensure product is a string
        const productString = item.product || '';
        const products = productString.split(', ').map(p => p.trim());

        const processedProducts = await Promise.all(products.map(async (product) => {
          let inventoryItem = inventory.find(inv => inv.part_name === product);

          // If the product doesn't exist in inventory, create it
          if (!inventoryItem) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                part_name: product,
                part_number: '',
                description: '.', // Ensure this is valid if required
                category: '', // Ensure this is valid if required
                quantity: 0,
                price: 0,
              }),
            });

            if (!response.ok) {
              const errorDetails = await response.json();
              throw new Error(`Failed to create new inventory item for ${product}: ${errorDetails.error}`);
            }

            inventoryItem = await response.json(); // Wait for the response to get the new inventory item
            // Add the new item to the local inventory list
            setInventory(prevInventory => [...prevInventory, inventoryItem]);
            setSnackbarMessage(`1 new inventory item created: ${product}`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          }

          const supplier = suppliers.find(supplier => supplier.name === item.supplierName);

          return {
            product,
            item_id: inventoryItem.inventory_id, // Use inventory_id as item_id
            supplierName: item.supplierName || '', // Ensure supplierName is not null
            supplierNumber: item.supplierNumber || '', // Ensure supplierNumber is not null
            supplier_id: supplier ? supplier.supplier_id : null // Map supplier name to supplier_id
          };
        }));

        return processedProducts.map(processedProduct => ({
          pr_no: formData.prNo, // Ensure pr_no is included
          product: processedProduct.product,
          details: item.details,
          qty: item.qty,
          estimatedDelivery: item.estimatedDelivery,
          item_id: processedProduct.item_id, // Use inventory_id as item_id
          supplierName: processedProduct.supplierName,
          supplierNumber: processedProduct.supplierNumber,
          supplier_id: processedProduct.supplier_id
        }));
      }));

      // Flatten the array of arrays into a single array
      const flattenedItems = itemsWithIds.flat();

      const formattedData = {
        pr_type: formData.prType,
        referenceName: formData.referenceName,
        supplierName: formData.supplierName,
        supplierNumber: formData.supplierNumber,
        items: flattenedItems,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit data');
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      setSnackbarMessage('Procurement created');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setModalOpen(false); // Close the modal on successful submission

      // Refresh the page after 4 seconds
      setTimeout(() => {
        window.location.reload();
      }, 4000);

    } catch (error) {
      console.log('Error submitting data:', error);
      setSnackbarMessage('Error submitting data');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(itemId)
        ? prevSelected.filter((id) => id !== itemId)
        : [...prevSelected, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === selectedPR.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectedPR.items.map((item) => item._id));
    }
  };

  const handleUpdateSelectedItems = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      setLoading(true); // Show loading indicator

      await Promise.all(selectedItems.map(async (itemId) => {
        const item = selectedPR.items.find((item) => item._id === itemId);
        const formattedData = {
          pr_no: selectedPR.pr_no,
          product: item.product,
          received_quantity: parseInt(item.qty, 10), // Use the item's current quantity
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/updateQuantity/${item.item_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
          throw new Error('Failed to update quantities');
        }
      }));

      console.log('Selected quantities updated successfully');
      setSnackbarMessage('Selected quantities updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.log('Error updating quantities:', error);
      setSnackbarMessage('Error updating quantities');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleReceivedClick = (item) => {
    setModalData(item);
  };

  const handleReceivedSubmit = async () => {
    if (parseInt(receivedQuantity, 10) > parseInt(modalData.qty, 10)) {
      setSnackbarMessage('Received quantity cannot exceed current quantity');
      setSnackbarSeverity('error');
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
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/updateQuantity/${modalData.item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantities');
      }

      console.log('Quantities updated successfully');
      setSnackbarMessage('Quantities updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleModalClose();

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.log('Error updating quantities:', error);
      setSnackbarMessage('Error updating quantities');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div>
      <Navbar />
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",
          minHeight: "89vh",
        }}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex" }}>
              <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>
                Purchase List
              </h1>
            </div>
            <div>
              <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddPRListClick}
                >
                  Add PR List
                </Button>
                {selectedItems.length > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleUpdateSelectedItems}
                  >
                    Update Selected
                  </Button>
                )}
              </Box>
            </div>
          </div>
          <Box
            sx={{
              padding: 2,
              backgroundColor: "white", // Add white background
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Optional: Add shadow for card effect
              borderRadius: "8px", // Optional: Add border radius for rounded corners
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box
                sx={{
                  width: "30%",
                  // border: "1px solid black",
                  borderRadius: "8px",
                  padding: 1,
                  backgroundColor: "white",
                  color: "black",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ backgroundColor: "lightgreen", textAlign: "center" }}
                >
                  PR List
                </Typography>
                <Box
                  sx={{
                    height: "500px",
                    overflowY: "auto",
                  }}
                >
                  {prList.map((pr) => (
                    <Box
                      key={pr._id}
                      sx={{
                        cursor: "pointer",
                        marginBottom: 1,
                        padding: 1,
                        backgroundColor:
                          selectedPR && selectedPR._id === pr._id
                            ? "lightblue"
                            : "transparent",
                        borderRadius: "5px",
                        transition: "background-color 0.3s",
                      }}
                      onClick={() => {
                        setSelectedPR(pr);
                        setShowFormInTable(false); // Hide form when a PR is selected
                      }}
                    >
                      <Typography variant="body2">
                        {pr.appointment_id ? `Appointment ID: ${pr.appointment_id}` : `Reference Name: ${pr.referenceName}`}
                      </Typography>
                      <Typography variant="body2">
                        {pr.pr_type ? `PR Type: ${pr.pr_type}` : `Supplier Name: ${pr.supplierName}`}
                      </Typography>
                      <Divider variant="middle" />
                    </Box>
                  ))}
                  {prList.length === 0 && <Typography>No PRs found</Typography>}
                </Box>
              </Box>
              <Box
                sx={{
                  width: "65%",
                  height: "550px",
                  border: "1px solid black",
                  padding: 1,
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "black",
                  overflowY: "auto",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                {selectedPR && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                    {editingId === selectedPR._id ? (
                      <>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          style={{
                            padding: '5px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginRight: '10px',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          {/* Add more status options as needed */}
                        </select>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleUpdate(selectedPR.pr_no)}
                        >
                          Update
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEditClick(selectedPR._id, selectedPR.status)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleDelete(selectedPR.pr_no)}
                          sx={{ marginLeft: 1 }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                )}
                <Typography
                  variant="h6"
                  sx={{ backgroundColor: "lightblue", textAlign: "center" }}
                >
                  {showFormInTable ? "Create PR List" : "PR Details"}
                </Typography>
                {showFormInTable ? (
                  // Render the form fields as table rows
                  <>
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
                            <TableCell><b>Product</b></TableCell>
                            <TableCell><b>Details</b></TableCell>
                            <TableCell><b>Quantity</b></TableCell>
                            <TableCell><b>Estimated Delivery</b></TableCell>
                            <TableCell><b>Supplier Name</b></TableCell>
                            <TableCell><b>Supplier Number</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {formData.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Autocomplete
                                  options={inventory.map((item) => item.part_name)}
                                  freeSolo
                                  value={item.product}
                                  onInputChange={(event, newInputValue) => {
                                    const items = [...formData.items];
                                    items[index].product = newInputValue;
                                    setFormData({ ...formData, items });
                                  }}
                                  onChange={(event, newValue) => {
                                    const items = [...formData.items];
                                    items[index].product = newValue || ''; // Handle case where newValue might be null
                                    setFormData({ ...formData, items });
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      fullWidth
                                      margin="normal"
                                      label="Product"
                                      name={`item-product`}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  label="Details"
                                  name={`item-details`}
                                  value={item.details}
                                  onChange={(e) => handleInputChange(e, index)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  label="Qty"
                                  name={`item-qty`}
                                  value={item.qty}
                                  onChange={(e) => handleInputChange(e, index)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  label="Estimated Delivery Date"
                                  name={`item-estimatedDelivery`}
                                  type="date"
                                  value={item.estimatedDelivery}
                                  onChange={(e) => handleInputChange(e, index)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  select
                                  fullWidth
                                  margin="normal"
                                  label="Supplier Name"
                                  name={`item-supplierName`}
                                  value={item.supplierName || ''}
                                  onChange={(e) => handleInputChange(e, index)}
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
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  label="Supplier Number"
                                  name={`item-supplierNumber`}
                                  value={item.supplierNumber || ''}
                                  disabled
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton color="secondary" onClick={() => removeItem(index)}>
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
                                // onClick={() => console.log(formData)}
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
                  <>
                    {selectedPR.vehicle_id && (
                      <Typography>Vehicle ID: {selectedPR.vehicle_id}</Typography>
                    )}
                    <Typography>Status: {selectedPR.status}</Typography>
                    <Typography>Notes: {selectedPR.notes || "No notes To Show"}</Typography>
                    <Typography
                      variant="h6"
                      sx={{ backgroundColor: "lightblue", textAlign: "center" }}
                    >
                      {selectedPR.services ? "Services" : "Items"}
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.length === selectedPR.items.length}
                                onChange={handleSelectAll}
                              />
                            </TableCell>
                            <TableCell><b>Product</b></TableCell>
                            <TableCell><b>Details</b></TableCell>
                            <TableCell><b>Quantity</b></TableCell>
                            <TableCell><b>Estimated Delivery</b></TableCell>
                            <TableCell><b>Supplier Name</b></TableCell>
                            <TableCell><b>Supplier Number</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPR.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.includes(item._id)}
                                  onChange={() => handleSelectItem(item._id)}
                                />
                              </TableCell>
                              <TableCell>{item.product}</TableCell>
                              <TableCell>{item.details}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{item.estimatedDelivery}</TableCell>
                              <TableCell>{item.supplierName || 'N/A'}</TableCell>
                              <TableCell>{item.supplierNumber || 'N/A'}</TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleReceivedClick(item)}
                                  disabled={item.qty <= 0 || item.tallied}
                                >
                                  Received
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <Typography>Select a PR to view details</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6">Loading...</Typography>
        </div>
      )}

      {/* Modal for receiving items */}
      <Dialog open={!!modalData} onClose={handleModalClose}>
        <DialogTitle>Receive Item</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Product: {modalData?.product}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Supplier: {modalData?.supplierName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Current Quantity: {modalData?.qty}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="secondary">
            Close
          </Button>
          <Button onClick={handleReceivedSubmit} color="primary" disabled={!receivedQuantity}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
