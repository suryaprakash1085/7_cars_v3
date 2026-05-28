"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Tree from "react-d3-tree";
import Navbar from "@/components/navbar";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



export default function CustomerReportTree() {
  const params = useParams();
  const appointmentId = params?.id;

  const [treeData, setTreeData] = useState(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTranslate({
      x: window.innerWidth / 2,
      y: 120,
    });
  }, []);

  // 🔹 ELITE NODE UI (NO OVERLAP + GLASS EFFECT)
  const renderNode = ({ nodeDatum }) => {
    const attrs = nodeDatum.attributes
      ? Object.entries(nodeDatum.attributes)
      : [];

    const rows = Math.ceil(attrs.length / 2); // 2 per row
    const height = 80 + rows * 26;

    return (
        <>
        
      <foreignObject width={320} height={height} x={-160} y={-height / 2}>
        <div
          style={{
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.7)", // 👈 glass effect
            borderRadius: "14px",
            padding: "14px",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {nodeDatum.type === "customer" && (
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#4f46e5",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                }}
              >
                👤
              </div>
            )}

            {nodeDatum.type === "vehicle" && <span>🚗</span>}
            {nodeDatum.type === "spares" && <span>📦</span>}
            {nodeDatum.type === "item" && <span>•</span>}

            <div style={{ fontSize: "14px", fontWeight: 600 }}>
              {nodeDatum.name}
            </div>
          </div>

          {/* ATTRIBUTES GRID (FIXED OVERLAP) */}
          {attrs.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr", // 👈 2 per row
                gap: "6px",
              }}
            >
              {attrs.map(([k, v], i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(243,244,246,0.8)",
                    padding: "5px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    color: "#374151",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <b>{k}:</b> {v}
                </div>
              ))}
            </div>
          )}
        </div>
      </foreignObject>
    </>
    );
  };

  const fetchData = async () => {
    if (!appointmentId) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    const data = await res.json();

    const balance =
      Number(data.invoice_amount || 0) - Number(data.paid_amount || 0);

    //  FLATTEN SPARES
    const allItems =
      data.services_actual?.flatMap((s) => s.items_required || []) || [];

    const uniqueItems = Array.from(
      new Map(allItems.map((i) => [i.item_name, i])).values()
    );

    //  FINAL STRUCTURE
    const formatted = {
      name: data.customer_name,
      type: "customer",
      attributes: {
        ID: data.appointment_id,
        Status: data.status,
        Payment: data.paid_status,
        Invoice: `₹${data.invoice_amount}`,
        Paid: `₹${data.paid_amount}`,
        Balance: `₹${balance}`,
      },

      children: [
        {
          name: "Vehicle",
          type: "vehicle",
          attributes: {
            Make: data.make,
            Model: data.model,
            KM: data.km,
          },

          children: [
            {
              name: "Spares Used",
              type: "spares",
              children:
                uniqueItems.length > 0
                  ? uniqueItems.map((item) => ({
                      name: item.item_name,
                      type: "item",
                      attributes: {
                        Qty: item.qty,
                        Price: `₹${item.price}`,
                      },
                    }))
                  : [{ name: "No spares used" }],
            },
          ],
        },
      ],
    };

    setTreeData(formatted);
  };


const handleDownloadExcel = () => {
  if (!treeData) return;

  const customer = treeData;
  const vehicle = customer.children?.[0];
  const spares = vehicle?.children?.[0]?.children || [];

  //  CUSTOMER SHEET
  const customerData = [
    {
      Customer_Name: customer.name,
      Appointment_ID: customer.attributes?.ID,
      Status: customer.attributes?.Status,
      Payment_Status: customer.attributes?.Payment,
      Invoice: customer.attributes?.Invoice,
      Paid: customer.attributes?.Paid,
      Balance: customer.attributes?.Balance,
    },
  ];

  //  VEHICLE SHEET
  const vehicleData = [
    {
      Make: vehicle?.attributes?.Make,
      Model: vehicle?.attributes?.Model,
      KM: vehicle?.attributes?.KM,
    },
  ];

  //  SPARES SHEET
  const sparesData =
    spares.length > 0
      ? spares.map((item) => ({
          Item_Name: item.name,
          Qty: item.attributes?.Qty || "-",
          Price: item.attributes?.Price || "-",
        }))
      : [
          {
            Item_Name: "No spares used",
            Qty: "-",
            Price: "-",
          },
        ];

  //  CREATE WORKBOOK
  const workbook = XLSX.utils.book_new();

  const customerSheet = XLSX.utils.json_to_sheet(customerData);
  const vehicleSheet = XLSX.utils.json_to_sheet(vehicleData);
  const sparesSheet = XLSX.utils.json_to_sheet(sparesData);

  XLSX.utils.book_append_sheet(workbook, customerSheet, "Customer");
  XLSX.utils.book_append_sheet(workbook, vehicleSheet, "Vehicle");
  XLSX.utils.book_append_sheet(workbook, sparesSheet, "Spares");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(blob, `Customer_Report_${customer.attributes?.ID}.xlsx`);
};



  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  if (!treeData) return <p>Loading...</p>;

  return (
    <div style={{ padding: "12px" }}>
        <Navbar pageName="customer-report details" />
      <div
        style={{
          width: "100%",
          height: "700px",
          background: "linear-gradient(135deg,#f8fafc,#eef2ff)", // 👈 soft bg
          borderRadius: "14px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          overflow: "auto",
        }}
      >
        <button
  onClick={handleDownloadExcel}
  style={{
    marginBottom: "10px",
    padding: "8px 14px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  }}
>
  ⬇ Download Excel
</button>
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          translate={translate}
          renderCustomNodeElement={renderNode}
          nodeSize={{ x: 380, y: 180 }}
          separation={{ siblings: 1.5, nonSiblings: 1.8 }}
          zoomable
          draggable
          collapsible
          initialDepth={3}
        />
      </div>
    </div>
  );
}