"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Fab,
  Badge,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DataNotFound from "@/components/dataNotFound.js";
import Navbar from "@/components/navbar.js";

const filterStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f9f9f9",
  color: "black",
  height: "30px",
  width: "60px",
  padding: "10px",
  textAlign: "center",
  cursor: "pointer",
  borderRadius: "15px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

/**
 * DynamicListTable - A reusable table component for list views
 *
 * @param {Object} config - Configuration object
 * @param {string} config.title - Page title for navbar
 * @param {Array} config.columns - Array of column definitions
 *   Each column: { key, label, minWidth, format?, truncate? }
 * @param {Array} config.data - Array of data rows
 * @param {Array} config.filteredData - Array of filtered data rows (displayed)
 * @param {boolean} config.loading - Loading state
 * @param {boolean} config.showNavbar - Show navbar (checks pageType)
 * @param {string} config.searchText - Current search text
 * @param {Function} config.onSearchChange - Search input change handler
 * @param {Function} config.onSearchSubmit - Search submit handler
 * @param {Function} config.onRowClick - Row click handler
 * @param {Function} config.scrollToTopDisplay - Scroll to top FAB display handler
 * @param {Function} config.onScrollToTop - Scroll to top handler
 * @param {boolean} config.showScrollFab - Show scroll to top FAB
 * @param {Function} config.onScroll - Scroll event handler
 * @param {Object} config.snackbar - Snackbar config
 *   { open, message, severity, onClose }
 * @param {boolean} config.showLoadingSpinner - Show loading spinner
 * @param {Object} config.filterBadge - Filter badge config (optional)
 *   { count, label }
 * @param {Array} config.extraControls - Extra controls/buttons before search (optional)
 * @param {Array} config.dateFilters - Date filter fields (optional)
 *   [{ label, value, onChange }]
 * @param {Object} config.scrollableTableId - ID for the scrollable table element
 * @param {Function} config.customRowRenderer - Custom row renderer function (optional)
 *   Receives (row, rowIdx) and returns JSX
 */
export default function DynamicListTable(config) {
  const {
    title,
    columns,
    data,
    filteredData,
    loading,
    showNavbar = true,
    searchText,
    onSearchChange,
    onSearchSubmit,
    onRowClick,
    scrollToTopDisplay,
    onScrollToTop,
    showScrollFab,
    onScroll,
    snackbar = {},
    showLoadingSpinner = false,
    filterBadge = null,
    extraControls = [],
    dateFilters = [],
    scrollableTableId = "scrollable-table",
    customRowRenderer,
  } = config;

  const handleScrollEvent = (event) => {
    if (scrollToTopDisplay) scrollToTopDisplay(event, null);
    if (onScroll) onScroll(event);
  };

  const handleSearch = () => {
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      {showNavbar && <Navbar pageName={title} />}
      <Box
        sx={{
          color: "white",
          marginTop: "30px",
        }}
      >
        <Box paddingX="1%">
          {/* Header with filter badge and search controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            {/* Left side - filter badge */}
            <Box>
              {filterBadge && (
                <Badge
                  badgeContent={filterBadge.count}
                  max={99999}
                  color="primary"
                >
                  <div style={filterStyle}>{filterBadge.label || "All"}</div>
                </Badge>
              )}
            </Box>

            {/* Right side - controls and search */}
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {/* Extra controls */}
              {extraControls.map((control, idx) => (
                <div key={idx}>{control}</div>
              ))}

              {/* Date filters (optional) */}
              {dateFilters.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: "wrap" }}
                >
                  {dateFilters.map((filter, idx) => (
                    <TextField
                      key={idx}
                      label={filter.label}
                      type="date"
                      size="small"
                      value={filter.value}
                      onChange={filter.onChange}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: "white", borderRadius: 1 }}
                    />
                  ))}
                </Stack>
              )}

              {/* Search field */}
              <TextField
                placeholder="Search Job Cards..."
                variant="outlined"
                size="small"
                value={searchText}
                onChange={onSearchChange}
                onKeyUp={handleKeyPress}
                autoComplete="off"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  minWidth: 250,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1976d2",
                    },
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSearch}
                        sx={{
                          color: "#1976d2",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.08)",
                          },
                        }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </div>
        </Box>

        {/* Table */}
        <TableContainer
          id={scrollableTableId}
          component={Paper}
          sx={{
            maxHeight: {
              xs: "calc(100vh - 250px)",
              sm: "calc(100vh - 280px)",
              md: "70vh",
            },
            minHeight: "400px",
            overflowY: "auto",
            overflowX: "auto",
            marginX: { xs: 2, sm: "2%" },
            paddingX: { xs: 0, sm: "0%" },
            width: { xs: "100%", sm: "auto" },
            "& ::-webkit-scrollbar": {
              width: "8px",
            },
            "& ::-webkit-scrollbar-track": {
              background: "#f1f1f1",
            },
            "& ::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
              "&:hover": {
                background: "#555",
              },
            },
          }}
          onScroll={handleScrollEvent}
        >
          {loading ? (
            <Box sx={{ padding: 2 }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : filteredData?.length === 0 ? (
            <DataNotFound />
          ) : (
            <Table
              sx={{
                minWidth: { xs: 300, sm: 650 },
                tableLayout: { xs: "auto", sm: "auto" },
              }}
            >
              <TableHead
                sx={{
                  backgroundColor: "#f5f5f5",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{
                        fontWeight: "bold",
                        color: "#000",
                        fontSize: { xs: "12px", sm: "14px" },
                        padding: { xs: "8px", sm: "16px" },
                        minWidth: column.minWidth || "100px",
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData?.map((row, rowIdx) =>
                  customRowRenderer ? (
                    customRowRenderer(row, rowIdx)
                  ) : (
                    <TableRow
                      key={row._id || row.id || rowIdx}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        cursor: onRowClick ? "pointer" : "default",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                        "&:last-child td, &:last-child th": {
                          border: 0,
                        },
                      }}
                    >
                      {columns.map((column) => {
                        let cellValue = row[column.key];

                        // Apply custom format if provided
                        if (column.format) {
                          cellValue = column.format(cellValue, row);
                        }

                        // Check if cellValue is a React element (JSX)
                        const isReactElement = React.isValidElement(cellValue);

                        return (
                          <TableCell
                            key={column.key}
                            sx={{
                              fontSize: { xs: "11px", sm: "13px" },
                              padding: { xs: "8px", sm: "16px" },
                              maxWidth: column.minWidth || "100px",
                              wordBreak: "break-word",
                            }}
                          >
                            {isReactElement ? (
                              cellValue
                            ) : (
                              <Tooltip title={(cellValue || "N/A").toString()}>
                                <Typography
                                  sx={{
                                    fontSize: { xs: "11px", sm: "13px" },
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {column.truncate && cellValue && cellValue.length > column.truncate
                                    ? `${cellValue.substring(0, column.truncate)}...`
                                    : cellValue || "N/A"}
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Loading spinner */}
        {showLoadingSpinner && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              padding: 2,
              marginTop: 2,
            }}
          >
            <CircularProgress size={30} />
          </Box>
        )}

        {/* Snackbar */}
        {snackbar.open !== undefined && (
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={snackbar.onClose}
          >
            <Alert
              onClose={snackbar.onClose}
              severity={snackbar.severity || "info"}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}

        {/* Scroll to top FAB */}
        {showScrollFab && (
          <Fab
            size="small"
            onClick={onScrollToTop}
            style={{
              backgroundColor: "white",
              color: "primary",
              position: "absolute",
              bottom: 40,
              right: 40,
              zIndex: 10,
            }}
          >
            <ArrowUpwardIcon />
          </Fab>
        )}
      </Box>
    </div>
  );
}
