const getRevenueData = async (token, setRevenueData, startDate, endDate) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/salesReports/revenue?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    let res = await response.json();
    console.log({ res });
    let total = 0;

    let a = res.map((r) => {
      total = total + r.yAxis;
    });

    // Format the total with commas
    const formattedTotal = new Intl.NumberFormat("en-IN").format(total);

    let result = {
      total_revenue: formattedTotal,
      revenueSplitup: res,
    };

    setRevenueData(result);
  } catch (error) {
    console.log(error);
  }

  // // Format the total with commas
  // const formattedTotal = new Intl.NumberFormat("en-IN").format(total);

  // let result = {
  //   total_revenue: formattedTotal,
  //   revenueSplitup: revenueData,
  // };

  // setRevenueData(result);
};

const getAtvData = async (token, setAtv, startDate, endDate) => {
  let year = "2024";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/atv?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  let atvData = await response.json();
  // console.log({MessageChannel:atvData})
  setAtv(atvData);
};

const getRevenueByServiceData = async (
  token,
  setRevenueByService,
  startDate,
  endDate
) => {
  let year = "2024";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/revenueByServiceType?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  let revenueByService = await response.json();
  // console.log({ revenueByService: revenueByService });
  setRevenueByService(revenueByService);
};
export { getRevenueData, getAtvData, getRevenueByServiceData };
