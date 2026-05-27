import dayjs from "dayjs";



// helpers.js

export const fetchServicesHelper = async (storedToken, setServices) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`,
      {
        headers: {
          "Authorization": `Bearer ${storedToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const filteredData = data.filter(
      (item) => item.category === "Spares" || item.category === "Accessories"
    );
    
    setServices(filteredData);

  } catch (error) {
    console.log("Error fetching services:", error);
    // Note: Snackbar alert will need to be handled in the parent component
  }
};

//  phone number and name,type is get
export const getCustomer = async (storedToken, setCustomerData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/all/globalcustomers`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customer data');
    }

    const result = await response.json();
    console.log({result});
    setCustomerData(result);

    const customerDetails = result.map((customer) => {
      const { customer_name, contact, gst_number, street } = customer;
      const { phone, type } = contact || {};

      return {
        customer_name,
        phone,
        type,
        street,
        gst_number,
      };
    });
  } catch (error) {
    console.log('Error:', error);
    // Note: Snackbar alert will need to be handled in the parent component
  }
};




export const addLeadCustomer = async (storedToken, customerData, setCustomerData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/countertopsales/countertop`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${storedToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      throw new Error('Failed to add customer');
    }

    const result = await response.json();
    setCustomerData((prevData) => [...prevData, result]);
    return result;
  } catch (error) {
    console.log('Error:', error);
    throw error; // Re-throw to handle in parent component with Snackbar
  }
};

// Add a helper function for GST calculations
export const calculateGST = (amount, gstRate) => {
  // Calculate GST amount using reverse calculation
  const gstAmount = amount - (amount * (100 / (100 + gstRate)));
  return {
    baseAmount: amount - gstAmount,
    gstAmount: gstAmount,
    totalAmount: amount
  };
};

export const fetchVehicles = async (token, setModels, setMakes) => {
  try {
    if (!token) throw new Error("Token is missing");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/vehicles`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch vehicles");

    //  Convert response to JSON
    const data = await response.json();
console.log({data})
    //  Extract Makes and Models
    const makes = data.map((item) => ({
      id: item.id,
      make_name: item.make_name,
      models: item.models.split(","),
    }));

    //  Set Makes and Models
    setMakes(makes);
  } catch (error) {
    console.error("Error fetching vehicles:", error.message);
  }
};



