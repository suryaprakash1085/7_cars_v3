import * as React from "react";
import { Gauge } from "@mui/x-charts/Gauge";

export default function GaugeCh({ chartData }) {
  let score = chartData && chartData[0]?.performanceScore;

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
     {/* <button
        onClick={() => alert("Button clicked!")}
        style={{
          // position: "absolute",
           justifyContent: "flex-end",
          // right: "20px",
          // bottom: "-40px", // Position it below the gauge
          // padding: "10px 20px",
          // fontSize: "16px",
          cursor: "pointer",
          borderRadius:'10px',
          backgroundColor:'red'
        }}
      >
        Click Me
      </button> */}
      <Gauge
        width={400}
        height={350}
        value={score}
        startAngle={-110}
        endAngle={110}
        sx={{

          fontSize: 30,
          transform: "translate(0px, 0px)",
        }}
        text={({ value }) => `${value} / 100`}
      />

      
    </div>
  );
}
