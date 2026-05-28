import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";

export default function Bars({ chartData, name,datas }) {
  // console.log({ chartData });
  const labels = chartData?.map((item) => item.xAxis) || [
    "group A",
    "group B",
    "group C",
  ]; // X-axis labels

  const data = chartData?.map((item) => item.yAxis) || [0, 0, 0]; // Y-axis values

  
  return (
    <>
 {/* <button
        onClick={() => alert("Button clicked!")}
        style={{
          position: "absolute",
          justifyContent:'end',
          right: "20px",
          bottom: "-40px", // Position it below the gauge
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor:'red'
        }}
      >
        Click Me
      </button> */}

    <BarChart
      xAxis={[
        {
          scaleType: "band",
          data: labels, // X-axis labels
        },
      ]}
      series={[
        {
          id: "invoice-amount-series",
          data: data, // Y-axis data (array of numbers)
          label: name, // Series label
        },
      ]}
      height={350}
    />
    </>
  );
}
