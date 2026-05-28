import { request } from "axios";
import { Document, Page, View, Text, Image, pdf } from "@react-pdf/renderer";
import delivery_challan_pdf from "../src/components/PDFGenerator_delivery";
const handleCloseSnackbar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

const handleOpenModal = (setIsModalOpen) => {
  setIsModalOpen(true);
};

const handleCloseModal = (setIsModalOpen) => {
  setIsModalOpen(false);
};

const addEstimateItem = (setEstimateItems) => {
  setEstimateItems((prevItems) => [
    ...prevItems,
    { type: "", spareList: "", reportedIssue: "", qty: 0, saved: false },
  ]);
};

const getFilteredInventory = (type, inventory) => {
  return inventory.filter((item) => item.category === type.toLowerCase());
};

const getActualStock = (itemId, inventory) => {
  const item = inventory.find((invItem) => invItem.inventory_id === itemId);
  return item ? item.quantity : 0;
};

const removeEstimateItem = (index, setEstimateItems) => {
  setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
};

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
};

const fetchDetails = async (
  token,
  appointmentId,
  setServices,
  setInventory,
  setKm,
  setCustomer,
  setVehicleId,
  setMechanics,
  setSnackbarMessage,
  setOpenSnackbar,
  setLoading,
  setSelectedMechanic,
  setAppointmentDataLog
) => {
  try {
    const [
      apmtDataLog,
      servicesResponse,
      inventoryResponse,
      appointmentResponse,
    ] = await Promise.all([
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/services_actual`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=100000`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    ]);

    if (!servicesResponse.ok) throw new Error("Failed to fetch services");
    if (!inventoryResponse.ok) throw new Error("Failed to fetch inventory");
    if (!appointmentResponse.ok)
      throw new Error("Failed to fetch appointment details");

    const apmtDta = await apmtDataLog.json();
    setAppointmentDataLog(apmtDta);
    const servicesData = await servicesResponse.json();
    console.log(servicesData);
    const inventoryData = await inventoryResponse.json();
    const appointmentData = await appointmentResponse.json();

    setServices(servicesData.services_actual || []);
    console.log("sa", servicesData.services_actual);
    setInventory(inventoryData);

    const customerId = appointmentData.customer_id;
    const vehicleId = appointmentData.vehicle_id;
    setKm(appointmentData.km || "");
    setSelectedMechanic(appointmentData.mechanic_id || "");

    const customerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!customerResponse.ok)
      throw new Error("Failed to fetch customer details");
    const customerData = await customerResponse.json();
    setCustomer(customerData);
    console.log("customerData", customerData);
    setVehicleId(vehicleId);

    // Fetch mechanics
    const mechanicsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/mechanic `,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!mechanicsResponse.ok) throw new Error("Failed to fetch mechanics");
    const mechanicsData = await mechanicsResponse.json();
    setMechanics(mechanicsData);
  } catch (err) {
    console.log("Error fetching details:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  } finally {
    setLoading(false);
  }
};

const saveEstimateItem = async (
  token,
  index,
  estimateItems,
  inventory,
  appointmentId,
  setSnackbarMessage,
  setOpenSnackbar,
  updateEstimateItem
) => {
  const item = estimateItems[index];

  // Find the inventory item that matches the spareList name
  const inventoryItem = inventory.find(
    (invItem) => invItem.part_name === item.spareList
  );

  if (!inventoryItem) {
    setSnackbarMessage("Item not found in inventory");
    setOpenSnackbar(true);
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/services_actual`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            service_id: item.service_id || "",
            service_description: item.reportedIssue, // Assuming this is the description
            service_type: item.type, // Assuming this is the service type
            status: "approved", // Set the status as "approved"
            price: inventoryItem.price, // assign respective price from inventory
            items_required: [
              {
                item_id: inventoryItem.inventory_id, // Use the actual item_id
                item_name: item.spareList, // Assuming spareList is the item name
                qty: item.qty.toString(), // Convert to string if needed
                tax: "0", // Set default or get from item
                discount: "0", // Set default or get from item
              },
            ],
          },
        ]),
      }
    );
    if (!response.ok) throw new Error("Failed to save service entry");
    updateEstimateItem(index, "saved", true);
    setSnackbarMessage("Service entry saved!");
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error saving service entry:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const assignMechanic = async (
  token,
  mechanicId,
  appointmentId,
  setSnackbarMessage,
  setOpenSnackbar
) => {
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
    setSnackbarMessage(`Mechanic assigned successfully`);
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error assigning mechanic:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const updateServiceStatus = async (
  token,
  serviceId,
  currentStatus,
  setServices,
  setSnackbarMessage,
  setOpenSnackbar,
  appointmentId
) => {
  const newStatus = currentStatus === "Completed" ? "Rework" : "Completed";
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_service_status/${serviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service_status: newStatus }),
      }
    );
    // if the status is rework, then call the inspection route
    console.log("newStatus", newStatus);
    if (newStatus === "Rework") {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/released/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    if (!response.ok) throw new Error("Failed to update service status");

    setServices((prevServices) =>
      prevServices.map((service) =>
        service.service_id === serviceId
          ? { ...service, service_status: newStatus }
          : service
      )
    );
    setSnackbarMessage(`Service ${serviceId} marked as ${newStatus}`);
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error updating service status:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const updateInspectionStatus = async (
  token,
  serviceId,
  currentStatus,
  setServices,
  setSnackbarMessage,
  setOpenSnackbar,
  appointmentId,
  itemId,
  itemQtyConsumed,
  newStatus
) => {
  // const newStatus = currentStatus === "Completed" ? "pending" : "Completed";
  console.log({ newStatus });
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_inspection_status/${serviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspection_status: newStatus,
          service_id: serviceId,
        }),
      }
    );
    if (!response.ok) throw new Error("Failed to update inspection status");

    // Update the inventory quantity
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/decreaseQuantity/${itemId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ received_quantity: itemQtyConsumed }),
      }
    );

    let transactionData = {
      transaction_type: "Consumed",
      transaction_date: new Date(),
      quantity: itemQtyConsumed,
      inventory_id: itemId,
      description: `Item Consumed for ${appointmentId}`,
    };

    // Update the transaction table for the received item
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transaction/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });

    setServices((prevServices) =>
      prevServices.map((service) =>
        service.service_id === serviceId
          ? { ...service, inspection_status: newStatus }
          : service
      )
    );
    setSnackbarMessage(
      `Service ${serviceId} inspection marked as ${newStatus}`
    );
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error updating inspection status:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const reverseUpdatedQuantity = async (
  token,
  currentStatus,
  serviceId,
  appointmentId,
  setServices,
  itemId,
  itemQtyDecreased,
  newStatus
) => {
  // const newStatus = currentStatus === "Completed" ? "pending" : "Completed";
  console.log({ newStatus });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_inspection_status/${serviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspection_status: newStatus,
        service_id: serviceId,
      }),
    }
  );

  if (newStatus == "notcompleted") {
    console.log("Hitting before");
    const response2 = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_appmt_status/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "released" }),
      }
    );
  }

  // Update the inventory quantity
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_service_status/${serviceId}`,
      ///:appointment_id/update_service_status/:service_id
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service_status: "Rework" }),
      }
    );

    setServices((prevServices) =>
      prevServices.map((service) =>
        service.service_id === serviceId
          ? { ...service, service_status: "Rework" }
          : service
      )
    );

    if (currentStatus === "completed" && newStatus === "notcompleted") {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/decreaseQuantity/${itemId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ received_quantity: itemQtyDecreased }),
        }
      );

      let transactionData = {
        transaction_type: "Reversed",
        transaction_date: new Date(),
        quantity: itemQtyDecreased,
        inventory_id: itemId,
        description: "Reversed the item quantity",
      };

      // Update the transaction table for the received item
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transaction/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });
    }
    // return isChecked;
  } catch (err) {
    console.log("Error updating inspection status:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const handleFinishJob = async (
  token,
  appointmentId,
  setSnackbarMessage,
  setOpenSnackbar,
  router,
  customer,
  services,
  vehicleId,
  km,
  inventory,
  user,
  PdfHeaderImage,
  pdfFooterImage,
  pdfLogo,
  estimateItems
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/invoice/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to mark job as completed");
    setSnackbarMessage("Job marked as completed successfully!");
    setOpenSnackbar(true);

    // Add this console.log to verify comments are present
    console.log("Services with comments:", services);

    // generatePDF(
    //   customer,
    //   services,
    //   appointmentId,
    //   vehicleId,
    //   km,
    //   inventory,
    //   user
    // );

    delivery_challan_pdf({
      customer,
      services,
      appointmentId,
      vehicleId,
      km,
      inventory,
      user,
      // grandTotal,
      PdfHeaderImage,
      pdfFooterImage,
      pdfLogo,
      services,
    });

    setTimeout(() => {
      router.push("/views/serviceCenter");
    }, 2000);
  } catch (err) {
    console.log("Error marking job as completed:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const toggleChat = () => {
  setIsChatOpen(!isChatOpen);
};

const handleSendMessage = () => {
  if (newMessage.trim() !== "") {
    setMessages([...messages, { sender: "Garage Owner", text: newMessage }]);
    setNewMessage("");
  }
};

const postComments = async (
  token,
  serviceId,
  comments,
  setComments,
  setSnackbarMessage,
  setOpenSnackbar,
  setServiceComments
) => {
  // Get current date and time
  const now = new Date();
  const currentDate = `${now.getDate()}/${
    now.getMonth() + 1
  }/${now.getFullYear()}`;
  const currentTime = `${now.getHours()}:${now.getMinutes()}`;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_comments/${serviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comments: comments,
          current_date: currentDate,
          current_time: currentTime,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to update comments status");

    // Clear the comments input
    setComments("");

    // Update the serviceComments state to reflect the new comment
    setServiceComments((prev) => ({
      ...prev,
      [serviceId]: comments, // Update the specific service's comments
    }));

    // Show success message in snackbar
    setSnackbarMessage("Comment updated successfully!");
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error updating comments:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const generatePDF = async (
  customer,
  services,
  appointmentId,
  vehicleId,
  km,
  inventory,
  user
) => {
  const MyDocument = () => {
    const itemsPerPage = 20; // Set the number of items per page
    const totalPages = Math.ceil(services.length / itemsPerPage); // Calculate total pages
    // console.log(item)

    // Add null check and default value for items_required
    const getItemName = (service) => {
      if (!service.items_required || !service.items_required[0]) {
        return "No items";
      }
      return service.items_required[0].item_name || "Unnamed item";
    };

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
            <Image
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
                <Image
                  src="/icons/pdf_head.png"
                  style={{ height: 75, width: 75 }}
                />
                <Image
                  src="/icons/Arg_s7Cars Logo.png"
                  style={{ height: 100, width: 150 }}
                />
                <View style={{ textAlign: "center", flexGrow: 1 }}>
                  <Image
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
                  <Text style={{ marginLeft: 80 }}>GSTIN: 33BGFPA9032E1ZY</Text>
                </View>
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                Delivery Challan
              </Text>
            </View>

            {/* Patron and Vehicle Details */}
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
                  <Text>Patron: </Text>
                  <Text>
                    {customer.prefix}
                    {customer.customer_name}
                  </Text>
                  <Text>Address:</Text>
                  <Text>
                    {customer.contact.address.street},{" "}
                    {customer.contact.address.city}
                  </Text>
                  <Text>Phone: {customer.contact.phone}</Text>
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
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text>Appointment No :</Text>
                    <Text style={{ textAlign: "left" }}>{appointmentId}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text>Delivery Date :</Text>
                    <Text style={{ textAlign: "left" }}>
                      {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text>Vehicle No :</Text>
                    <Text style={{ textAlign: "left" }}>{vehicleId}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text>Vehicle Kms :</Text>
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

            {/* Items Table */}
            <View
              style={{ border: "1px solid #000", marginBottom: 10, flex: 1 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid #000",
                  backgroundColor: "#f0f0f0",
                  padding: 5,
                }}
              >
                <Text style={{ width: "10%", textAlign: "center" }}>S.No</Text>
                <Text style={{ width: "40%", textAlign: "left" }}>
                  Particulars
                </Text>
                <Text
                  style={{
                    marginLeft: "10px",
                    width: "30%",
                    textAlign: "left",
                  }}
                >
                  Inspection Status
                </Text>
                <Text style={{ width: "50%", textAlign: "left" }}>
                  Comments
                </Text>
              </View>

              {/* Render items for the current page */}
              {services
                .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                .map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      padding: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ width: "10%", textAlign: "center" }}>
                      {index + 1 + pageIndex * itemsPerPage}
                    </Text>

                    <Text style={{ width: "40%", textAlign: "left" }}>
                      {`${getItemName(item)} - ${item.service_description}`}
                    </Text>

                    <Text
                      style={{
                        marginLeft: "10px",
                        width: "30%",
                        textAlign: "left",
                      }}
                    >
                      {`${
                        item.inspection_status === "completed"
                          ? "Checked Ok"
                          : "Deffered"
                      }`}
                    </Text>

                    <Text style={{ width: "50%", textAlign: "left" }}>
                      {`${item.comments || "-"}`}
                    </Text>
                  </View>
                ))}
            </View>

            {/* Signature section */}
            <View
              style={{
                border: "1px solid #000",
                padding: "50 30 10 30",
                marginBottom: 10,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text>Prepared By</Text>
              </View>

              <View>
                <Text>Received By</Text>
              </View>
            </View>

            {/* Footer Section */}
            <View style={{ width: "100%", textAlign: "right" }}>
              <Text>
                Printed by : {user.userId} - {user.userName}
              </Text>
            </View>
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
  link.download = `Delivery_Challan_${appointmentId}_${Timestamp}.pdf`;
  document.body.appendChild(link);
  // Open the file in a new tab
  // window.open(url, `Estimate_${appointmentId}_${Timestamp}.pdf`);
  link.click();
  document.body.removeChild(link);
};

export {
  handleScrollToTop,
  scrollToTopButtonDisplay,
  fetchDetails,
  handleCloseSnackbar,
  handleOpenModal,
  handleCloseModal,
  addEstimateItem,
  getFilteredInventory,
  getActualStock,
  saveEstimateItem,
  assignMechanic,
  updateServiceStatus,
  updateInspectionStatus,
  handleFinishJob,
  postComments,
  reverseUpdatedQuantity,
};
