"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Typography,
  IconButton,
} from "@mui/material";
import Navbar from "@/components/navbar";
import AddIcon from "@mui/icons-material/Add";

const PrList = () => {
  const router = useRouter();
  const [prList, setPrList] = useState([]);
  const token = Cookies.get("token");
useEffect(() => {
  if (!token) return;

  const fetchPrList = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/procurement/mnpr`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setPrList(data);
  };

  fetchPrList();
}, [token]);


  const handleRowClick = (prNo) => {
    router.push(`/views/inventoryActivity/goodsreceipt/${prNo}`);
  };
  const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <Box sx={{ p: 2, backgroundColor: "transparent" }}>
      {/* <Navbar pageName="Goods Receipt List" /> */}
  {pageType !== "tab" && <Navbar pageName="Goods Receipt List" />}


      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginLeft: "95%",
          marginBottom: "10px",
        }}
      >
        <IconButton
          sx={{
            backgroundColor: "white",
            color: "black",
            "&:hover": { backgroundColor: "white", color: "black" },
          }}
          onClick={() => router.push("/views/inventoryActivity/goodsreceipt/new")}
        >
          <AddIcon />
        </IconButton>
      </div>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: "8px", overflow: "hidden" }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                GR No
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Reference No
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Supplier Name
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prList.map((pr) => (
              <TableRow
                key={pr._id}
                onClick={() => handleRowClick(pr.pr_no)}
                style={{
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#e0e0e0" },
                }}
              >
                <TableCell>{pr.pr_no}</TableCell>
                <TableCell>{pr.referenceName}</TableCell>
                <TableCell>{pr.items[0]?.supplierName || "--"}</TableCell>
                <TableCell>{pr.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PrList;
