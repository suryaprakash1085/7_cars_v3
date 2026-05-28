// import { clearScreenDown } from "readline";

const getCustomersServiced = async (
  token,
  setCustomersServiceData,
  startDate,
  endDate
) => {
  // console.log(customersServiceData)

  let year = "2024";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/customersPerMonth?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  let customersServiceData = await response.json();
  let total = 0;
  customersServiceData.map((item) => {
    total = total + item.yAxis;
  });

  // Format the total with commas

  const formattedTotal = new Intl.NumberFormat("en-IN").format(total);

  let result = {
    total_customers_serviced: formattedTotal,
    customerSplitup: customersServiceData,
  };

  setCustomersServiceData(result);
};

const getVehiclesServiced = async (
  token,
  setVehiclesServiceData,
  startDate,
  endDate
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/noOfCarsServiced?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  let vehicleServiceData = await response.json();

  let total = 0;

  vehicleServiceData.map((item) => {
    total = total + item.yAxis;
  });

  // Format the total with commas
  const formattedTotal = new Intl.NumberFormat("en-IN").format(total);

  let result = {
    total_vehicles_serviced: formattedTotal,
    vehicleSplitup: vehicleServiceData,
  };
  // console.log({result:result})
  setVehiclesServiceData(result);
};

const getServicesCount = async (
  token,
  setServicesByType,
  startDate,
  endDate
) => {
  let year = "2024";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/servicesPerMonth?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  let vehicleServiceData = await response.json();
  setServicesByType(vehicleServiceData);
  //  console.log(vehicleServiceData)
};

export { getCustomersServiced, getVehiclesServiced, getServicesCount };
