import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";

function addLabels(series) {
  return series.map((item) => ({
    ...item,
    label: item.dataKey,
    valueFormatter: (v) => (v ? `${v}` : "0"),
  }));
}

export default function StackedBars({ servicesByType }) {
  let serviceTypes = [];

  let label = [];

  // Extract unique service types
  servicesByType?.forEach((service) => {
    if (!serviceTypes.includes(service.service_type)) {
      serviceTypes.push(service.service_type);

      let lab = {
        dataKey: service.service_type,
        stack: "services",
      };
      label.push(lab);
    }
  });

  // console.log({ serviceTypes });

  const formattedData = servicesByType?.reduce((acc, item) => {
    const { month, service_type, total_services } = item;

    // Find if the current month already exists in the accumulator
    let monthData = acc.find((data) => data.month === month);

    if (!monthData) {
      // Initialize monthData with zero for all service types
      monthData = { month };
      serviceTypes.forEach((type) => {
        monthData[type] = 0;
      });
      acc.push(monthData);
    }

    // Add the total_services to the respective service type
    monthData[service_type] += total_services;

    return acc;
  }, []) || [
    // Default data in case `servicesByType` is null or undefined
    {
      month: "0",
      Services: 0,
      Spares: 0,
      Accessories: 0,
    },
  ];

  return (
    <BarChart
      dataset={formattedData}
      series={addLabels(label)}
      xAxis={[{ scaleType: "band", dataKey: "month" }]}
      width={600}
      height={350}
    />
    // <></>
  );
}
