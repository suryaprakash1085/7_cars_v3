import { Router } from "next/router";
import axios from "axios";
import Cookies from "js-cookie";
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "@/components/whatsapp";

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
    const [servicesResponse, inventoryResponse, appointmentResponse] =
      await Promise.all([
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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=10000`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ),
      ]);
    // const appointmentDataLog_date = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`, {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    // });
    const my_resp = await appointmentResponse.json()
    setAppointmentDataLog(my_resp);
    if (!servicesResponse.ok) throw new Error("Failed to fetch services");
    if (!inventoryResponse.ok) throw new Error("Failed to fetch inventory");
    if (!appointmentResponse.ok)
      throw new Error("Failed to fetch appointment details");

    const servicesData = await servicesResponse.json();
    const inventoryData = await inventoryResponse.json();
    const appointmentData = my_resp;

    let services = servicesData.services_actual || [];

    // If the item is of type "Service", automatically set the service_status to "Completed"
    services.map(async (service, index) => {
      let serviceIndex = index;
      let itemIndex;
      let serviceId = service.service_id;
      service.items_required.map(async (item, index) => {
        if (item.type == "Services") {
          itemIndex = index;
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_service_status/${serviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ service_status: "Completed" }),
            }
          );

          servicesData.services_actual[serviceIndex].items_required[
            itemIndex
          ].service_status = "Completed";
        }
      });
      console.log({ servicesData });
      setServices(servicesData.services_actual || []);
    });

    setInventory(inventoryData);

    const customerId = appointmentData.customer_id;
    const vehicleId = appointmentData.vehicle_id;
    setKm(appointmentData.km || "");
    // Ensure mechanic_id is always set as an array for multiple select
    const mechanicIds = appointmentData.mechanic_id;
    setSelectedMechanic(Array.isArray(mechanicIds) ? mechanicIds : []);

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
    setVehicleId(vehicleId);

    // Fetch mechanics
    const mechanicsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/mechanic `,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
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
  console.log(item);

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

const replacePlaceholders = (template, dynamicValues) => {
  return template.replace(
    /{{([^}]+)}}/g,
    (match, p1) => dynamicValues[p1] || match
  );
};

const assignMechanic = async (
  token,
  mechanicId,
  appointmentId,
  setSnackbarMessage,
  setOpenSnackbar,
  customer,
  vehicleId,
  km,
  mechanic_name
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
    const dynamicValues = {
      customer_name: customer.customer_name,
      order_id: appointmentId,
      vehicle_id: vehicleId,
      km: km,
      mechanic_name: mechanic_name,
    };
    if (checkWhatsappLoggedIn()) {
      const page = "serviceCenter";
      const template = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${page}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const fromNumber = Cookies.get("phone");
      const toNumber = customer.contact.phone;
      const message = replacePlaceholders(
        template.data.template_message,
        dynamicValues
      );
      const type = "text";
      const file = null;
      const caption = null;
      sendWhatsappMessage(fromNumber, toNumber, message, type, file, caption);
    }
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error assigning mechanic:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
  // console.log("send mechanic name",mechanic_name);
};

const updateServiceStatus = async (
  token,
  serviceId,
  currentStatus,
  setServices,
  setSnackbarMessage,
  setOpenSnackbar,
  appointmentId,
  itemId,
  itemQtyRequired,
  availableQty
) => {
  const newStatus = currentStatus === "Completed" ? "Not Started" : "Completed";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_service_status/${serviceId}`,
      ///:appointment_id/update_service_status/:service_id
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service_status: newStatus }),
      }
    );
    if (!response.ok) throw new Error("Failed to update service status");
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.service_id === serviceId
          ? { ...service, service_status: newStatus }
          : service
      )
    );

    let difference = 0.0;
    itemQtyRequired = parseInt(itemQtyRequired).toFixed(1);
    availableQty = parseInt(availableQty).toFixed(1);
    if (itemQtyRequired > availableQty) {
      difference = itemQtyRequired - availableQty;
    } else {
      difference = 0;
    }
    // Update the inventory quantity
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/updateQuantity/${itemId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ received_quantity: difference }),
      }
    );

    //Knock off existing PR if there is any
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/procurement/pr_knockoff/${serviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ received_quantity: itemQtyRequired }),
      }
    );

    if (difference != 0) {
      let transactionData = {
        transaction_type: "Received",
        transaction_date: new Date(),
        quantity: difference,
        inventory_id: itemId,
        description: "Received the item from the supplier",
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

    setSnackbarMessage(`Service ${serviceId} marked as ${newStatus}`);
    setOpenSnackbar(true);
  } catch (err) {
    console.log("Error updating service status:", err);
    setSnackbarMessage(err.message);
    setOpenSnackbar(true);
  }
};

const handleFinishJob = async (
  token,
  appointmentId,
  isJobCompleted,
  setSnackbarMessage,
  setOpenSnackbar,
  setIsJobCompleted,
  router,
  customer,
  vehicleId,
  km,
  selectedMechanic,
  users
) => {
  if (isJobCompleted) {
    router.push("/views/serviceCenter");
    return;
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/inspection/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to mark job as Inspection");
    setSnackbarMessage("Job marked as Inspection successfully!");
    setOpenSnackbar(true);
    setIsJobCompleted(true); // Set the job as completed

    // Convert selectedMechanic array to mechanic names
    const mechanicNames = Array.isArray(selectedMechanic)
      ? (users || [])
          .filter(user => selectedMechanic.includes(user.user_id))
          .map(user => `${user.firstName} ${user.lastName}`)
          .join(", ")
      : selectedMechanic || "";

    const dynamicValues = {
      customer_name: customer.customer_name,
      order_id: appointmentId,
      vehicle_id: vehicleId,
      km: km,
      mechanic_name: mechanicNames,
    };
    if (checkWhatsappLoggedIn()) {
      const page = "Sc_completed";
      const template = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${page}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const fromNumber = Cookies.get("phone");
      const toNumber = customer.contact.phone;
      const message = replacePlaceholders(
        template.data.template_message,
        dynamicValues
      );
      const type = "text";
      const file = null;
      const caption = null;
      sendWhatsappMessage(fromNumber, toNumber, message, type, file, caption);
    }
    setTimeout(() => {
      router.push("/views/serviceCenter");
    }, 2000);
  } catch (err) {
    console.log("Error marking job as Inspection:", err);
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
  handleFinishJob,
};
