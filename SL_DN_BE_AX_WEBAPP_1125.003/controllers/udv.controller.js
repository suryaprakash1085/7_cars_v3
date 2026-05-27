import XLSX from "xlsx";
import crypto from "crypto";
import knexLib from "knex";
import knexConfig from "../knexfile.js";
import jwt from "jsonwebtoken";
import * as udvModel from "../models/udv.model.js";
import * as customerModel from "../models/customer.model.js";
import { generateCustomId, generateInventoryId } from "../utils/idGenerator.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function uploadUDVFile(req, res) {
  try {
    const { entity } = req.body;
    const fileBuffer = req.file?.buffer;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!fileBuffer) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!entity) {
      return res.status(400).json({ error: "Entity type is required" });
    }

    const fileName = req.file.originalname;

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: "buffer", defval: "" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ error: "No sheets found in file" });
    }

    const sheet = workbook.Sheets[sheetName];

    // Read raw data with row indices - use header: 1 to get arrays instead of objects
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    console.log(`📊 Total rows read from Excel: ${rawRows.length}`);
    if (rawRows.length > 0) {
      console.log(`📏 First row length: ${rawRows[0].length} columns`);
      console.log(`📋 First 3 rows:`, JSON.stringify(rawRows.slice(0, 3), null, 2));
    }

    // Detect header row by looking for common patterns
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i];
      if (row && row.length > 1) { // Must have multiple columns
        // Check if this row contains header keywords
        const rowText = row.slice(0, 8).join(" ").toLowerCase(); // Check first 8 columns
        if (
          rowText.includes("type") ||
          rowText.includes("phone") ||
          rowText.includes("name") ||
          rowText.includes("street") ||
          rowText.includes("city")
        ) {
          headerRowIndex = i;
          console.log(`✅ Found header row at index ${i}`);
          console.log(`   Header row content:`, row);
          break;
        }
      }
    }

    // Fallback to common template structure if no headers detected
    if (headerRowIndex === -1) {
      headerRowIndex = 1; // Assume headers are in row 2 (index 1)
      console.log(`⚠️ No header row detected, using fallback index ${headerRowIndex}`);
    }

    // Convert raw rows to objects with proper headers
    let rawData = [];
    const headerRow = rawRows[headerRowIndex];

    if (!headerRow || headerRow.length === 0) {
      return res.status(400).json({ error: "Could not find headers in file" });
    }

    console.log(`📝 Processing data with headers:`, headerRow);

    // Process all rows after header row
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || (typeof row === 'object' && Object.keys(row).length === 0)) continue; // Skip completely empty rows

      const dataObj = {};
      headerRow.forEach((header, index) => {
        if (header && header.trim()) {
          dataObj[header] = row[index] || "";
        }
      });

      // Only add rows that have at least one non-empty cell (after headers)
      if (Object.values(dataObj).some(v => v && String(v).trim())) {
        rawData.push(dataObj);
      }
    }

    console.log(`✅ Extracted ${rawData.length} data rows`);
    if (rawData.length > 0) {
      console.log(`📄 First data row:`, JSON.stringify(rawData[0], null, 2));
    }

    if (rawData.length === 0) {
      return res.status(400).json({ error: "No data found in file after headers" });
    }

    // Process rows based on entity type
    let result;

    if (entity === "leads") {
      result = await processLeadsUpload(rawData, fileName, token);
    } else if (entity === "inventory") {
      result = await processInventoryUpload(rawData, fileName, token);
    } else {
      return res.status(400).json({ error: `Unknown entity type: ${entity}` });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error uploading UDV file:", error);
    return res.status(500).json({
      error: "Error processing file",
      details: error.message,
    });
  }
}

async function processLeadsUpload(rawData, fileName, token) {
  const result = {
    total: rawData.length,
    success: 0,
    failed: 0,
    duplicates: 0,
    failedRecords: [],
    duplicateRecords: [],
    addedRecords: [],
  };

  let phoneNumbersInExcel = [];
  let trackingRecords = [];
  let rowIndex = 0;

  console.log(`🔍 Starting leads upload with ${rawData.length} rows`);
  if (rawData.length > 0) {
    console.log("📄 First row sample:", JSON.stringify(rawData[0], null, 2));
    console.log("📋 Column names in first row:", Object.keys(rawData[0]));
  }

  for (const row of rawData) {
    rowIndex++;
    try {
      // Find the column values by matching common patterns
      let type, customer_name, phone, street, city, state, gst_number, leads_owner;

      // Match columns by checking their values and column index
      // Try to map based on typical Excel structure
      const rowKeys = Object.keys(row);
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();
        const lowerValue = String(value || "").toLowerCase().trim();

        // Exact and flexible matching for common column names
        if (lowerKey === "customer type" || lowerKey === "type") {
          type = value;
        } else if (lowerKey === "customer name" || lowerKey === "name") {
          customer_name = value;
        } else if (lowerKey === "phone number" || lowerKey === "phone") {
          phone = value;
        } else if (lowerKey === "street" || lowerKey === "address") {
          street = value;
        } else if (lowerKey === "city") {
          city = value;
        } else if (lowerKey === "state") {
          state = value;
        } else if (lowerKey === "gst number" || lowerKey === "gst") {
          gst_number = value;
        } else if (lowerKey === "lead master" || (lowerKey.includes("lead") && lowerKey.includes("master"))) {
          leads_owner = value;
        }
        // Also handle positional mapping for __EMPTY columns from older templates
        else if (key === "Leads/Customer Template") {
          type = value;
        } else if (key === "__EMPTY") {
          customer_name = customer_name || value;
        } else if (key === "__EMPTY_1") {
          phone = phone || value;
        } else if (key === "__EMPTY_2") {
          street = street || value;
        } else if (key === "__EMPTY_3") {
          city = city || value;
        } else if (key === "__EMPTY_4") {
          state = state || value;
        } else if (key === "__EMPTY_5") {
          gst_number = gst_number || value;
        } else if (key === "__EMPTY_6") {
          leads_owner = leads_owner || value;
        }
      }

      console.log(`\n📍 Processing row ${rowIndex}...`);
      console.log(`  Type: ${type}, Name: ${customer_name}, Phone: ${phone}, Street: ${street}, City: ${city}`);

      // Skip empty or template rows
      if (!phone || (typeof phone === 'string' && phone.includes('Template'))) {
        console.log(`  ⏭️  Skipping row - phone: ${phone}`);
        continue;
      }

      // Ensure phone is a string and normalize phone number - remove spaces, dashes, country code, etc.
      let normalizedPhone = String(phone).trim();

      // Remove non-numeric characters first to see what we're working with
      const numericOnly = normalizedPhone.replace(/\D/g, "");

      // Remove country code (91 for India) and leading zero
      normalizedPhone = numericOnly.replace(/^(91|0)?/, "");

      // Handle the case where we over-removed
      if (normalizedPhone.length !== 10) {
        // Try the numeric-only version directly
        normalizedPhone = numericOnly;
      }

      // Validate phone number
      const phoneRegex = /^[6789]\d{9}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        result.failed++;
        const failedRecord = { ...row, error: `Invalid phone number format: ${phone}` };
        result.failedRecords.push(failedRecord);

        trackingRecords.push({
          entity: "leads",
          file_name: fileName,
          data_json: JSON.stringify(row),
          unique_key_hash: generateHash(String(phone) + fileName + rowIndex),
          status: "failed",
          failure_reason: `Invalid phone number format: ${phone}`,
        });

        continue;
      }

      phone = normalizedPhone;

      // Format GST number if provided
      if (gst_number) {
        gst_number = String(gst_number).toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[A-Z0-9A-Z]{1}$/;
        if (!gstRegex.test(gst_number)) {
          result.failed++;
          const failedRecord = { ...row, error: "Invalid GST number format" };
          result.failedRecords.push(failedRecord);

          trackingRecords.push({
            entity: "leads",
            file_name: fileName,
            data_json: JSON.stringify(row),
            unique_key_hash: generateHash(phone + fileName + rowIndex),
            status: "failed",
            failure_reason: "Invalid GST number format",
          });

          continue;
        }
      }

      // Format customer name
      if (customer_name) {
        customer_name = String(customer_name)
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }

      // Check for duplicates
      const existingCustomer = await customerModel.getCustomerByPhone(phone);

      if (existingCustomer || phoneNumbersInExcel.includes(phone)) {
        result.duplicates++;
        const duplicateRecord = {
          ...row,
          reason: "Phone number already exists in database",
        };
        result.duplicateRecords.push(duplicateRecord);

        trackingRecords.push({
          entity: "leads",
          file_name: fileName,
          data_json: JSON.stringify(row),
          unique_key_hash: generateHash(phone + fileName + rowIndex),
          status: "duplicate",
          failure_reason: "Phone number already exists",
        });

        continue;
      }

      phoneNumbersInExcel.push(phone);

      // Insert into customers table
      const customerId = await generateCustomId("CUST");
      const customerData = {
        customer_id: customerId,
        customer_name,
        phone,
        street,
        city,
        state,
        type: type || "Lead",
      };

      // Only add optional fields if they have values
      if (gst_number) {
        customerData.gst_number = gst_number;
      }
      if (leads_owner) {
        customerData.leads_owner = leads_owner;
      }

      console.log(`✅ Inserting customer: ${JSON.stringify(customerData)}`);
      await customerModel.createCustomer(customerData);
      console.log(`✅ Customer inserted successfully: ${customerId}`);

      // Log change to history
      if (token) {
        try {
          await logChange(token, "customers", "INSERT MANY", customerId, { ...row, customer_id: customerId });
        } catch (logError) {
          console.error("Error logging change to history:", logError.message);
        }
      }

      // Track in batch
      trackingRecords.push({
        entity: "leads",
        file_name: fileName,
        data_json: JSON.stringify(row),
        unique_key_hash: generateHash(phone + fileName + rowIndex),
        status: "added",
      });

      result.success++;
      result.addedRecords.push({ ...row, customer_id: customerId });

    } catch (error) {
      const errorMsg = error.message || String(error);
      console.error(`❌ Error processing row ${rowIndex}:`, errorMsg);
      console.error(`   Full error:`, error);
      result.failed++;
      const failedRecord = { ...row, error: errorMsg };
      result.failedRecords.push(failedRecord);

      trackingRecords.push({
        entity: "leads",
        file_name: fileName,
        data_json: JSON.stringify(row),
        unique_key_hash: generateHash(String(row.phone || "unknown") + fileName + rowIndex),
        status: "failed",
        failure_reason: errorMsg,
      });
    }
  }

  // Batch insert all tracking records with proper timestamps
  let insertedCount = 0;
  if (trackingRecords.length > 0) {
    try {
      const now = new Date();
      const recordsWithTimestamp = trackingRecords.map(record => ({
        ...record,
        created_at: now,
        updated_at: now,
      }));

      console.log(`📝 Inserting ${trackingRecords.length} tracking records into udv_items...`);
      console.log(`   Added: ${result.success}, Duplicates: ${result.duplicates}, Failed: ${result.failed}`);

      // Insert records in chunks to avoid duplicate key errors
      for (const record of recordsWithTimestamp) {
        try {
          // Check if this hash already exists
          const exists = await knex("udv_items")
            .where("unique_key_hash", record.unique_key_hash)
            .first();

          if (!exists) {
            await knex("udv_items").insert(record);
            insertedCount++;
          } else {
            console.log(`⚠️ Skipped duplicate hash: ${record.unique_key_hash}`);
          }
        } catch (recordError) {
          console.error(`Error inserting single record: ${recordError.message}`);
          // Continue with next record even if one fails
        }
      }

      console.log(`✅ Successfully tracked ${insertedCount}/${trackingRecords.length} records for leads upload`);
    } catch (trackError) {
      console.error("❌ Error in tracking batch process:", trackError.message);
      // Don't throw - we still want to return success with whatever was inserted
    }
  } else {
    console.warn("⚠️ No tracking records to insert");
  }

  console.log(`📊 Final counts - Added: ${result.success}, Duplicates: ${result.duplicates}, Failed: ${result.failed}`);

  return {
    fileName,
    entity: "leads",
    total: result.total,
    addedCount: result.success,
    duplicateCount: result.duplicates,
    failedCount: result.failed,
    addedRecords: result.addedRecords,
    duplicateRecords: result.duplicateRecords,
    failedRecords: result.failedRecords,
  };
}

async function processInventoryUpload(rawData, fileName, token) {
  const result = {
    total: rawData.length,
    newItemAdded: 0,
    existingItemUpdated: 0,
    failedCount: 0,
    failedRecords: [],
    addedRecords: [],
    updatedRecords: [],
  };

  let userRole = "User";
  let trackingRecords = [];
  let rowIndex = 0;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userRole = decoded.role;
    } catch (decodeError) {
      console.error("Error decoding token:", decodeError.message);
    }
  }

  for (const row of rawData) {
    rowIndex++;
    try {
      // Skip empty or template rows
      if (!row.part_name || (typeof row.part_name === 'string' && row.part_name.includes('Template'))) {
        continue;
      }

      const {
        part_name,
        part_number,
        description,
        category,
        quantity,
        price,
        uom,
        HSNCode,
        gst,
      } = row;

      // Validate required fields
      if (!part_name || !category) {
        result.failedCount++;
        const failedRecord = { ...row, error: "Part name and category are required" };
        result.failedRecords.push(failedRecord);

        trackingRecords.push({
          entity: "inventory",
          file_name: fileName,
          data_json: JSON.stringify(row),
          unique_key_hash: generateHash(String(part_name) + fileName + rowIndex),
          status: "failed",
          failure_reason: "Part name and category are required",
        });

        continue;
      }

      // Check if item exists
      const existingItem = await knex("inventory")
        .where({ part_name: part_name })
        .first();

      const isAdmin = userRole === "Admin" || userRole === "admin";
      const descriptionText = isAdmin
        ? `Initial Upload-${description || ""}`
        : `RE-${description || ""}`;

      const transData = {
        transaction_type: "Buy",
        transaction_date: req.tzHelpers ? req.tzHelpers.getCurrentDate() : new Date(),
        quantity: parseInt(quantity) || 0,
        description: descriptionText,
      };

      if (existingItem) {
        // Update existing item
        const updatedData = {
          quantity: existingItem.quantity + (parseInt(quantity) || 0),
          price: parseFloat(price) || existingItem.price,
          category,
          hsncode: HSNCode || existingItem.hsncode,
          gst: gst || existingItem.gst,
          uom: uom || existingItem.uom,
          description: description || existingItem.description,
        };

        await knex("inventory")
          .where("inventory_id", existingItem.inventory_id)
          .update(updatedData);

        transData.inventory_id = existingItem.inventory_id;
        await knex("transactions").insert(transData);

        // Log change to history
        if (token) {
          try {
            await logChange(token, "inventory", "UPDATE", existingItem.inventory_id, updatedData);
          } catch (logError) {
            console.error("Error logging change to history:", logError.message);
          }
        }

        result.existingItemUpdated++;
        result.updatedRecords.push({
          ...row,
          inventory_id: existingItem.inventory_id,
          action: "updated",
          newQuantity: updatedData.quantity,
          reason: "Quantity updated successfully",
        });

        trackingRecords.push({
          entity: "inventory",
          file_name: fileName,
          data_json: JSON.stringify({
            ...row,
            action: "updated",
            newQuantity: updatedData.quantity,
            reason: "Quantity updated successfully",
          }),
          unique_key_hash: generateHash(String(part_name) + fileName + rowIndex),
          status: "updated",
          failure_reason: "Quantity updated successfully",
        });

      } else {
        // Create new item
        const inventory_id = await generateInventoryId();
        await knex("inventory").insert({
          inventory_id,
          part_name,
          part_number: part_number || null,
          description: description || null,
          category,
          quantity: parseInt(quantity) || 0,
          price: parseFloat(price) || 0,
          uom: uom || null,
          hsncode: HSNCode || null,
          gst: gst || null,
          is_deleted: false,
        });

        transData.inventory_id = inventory_id;
        await knex("transactions").insert(transData);

        // Log change to history
        if (token) {
          try {
            await logChange(token, "inventory", "INSERT MANY", inventory_id, row);
          } catch (logError) {
            console.error("Error logging change to history:", logError.message);
          }
        }

        result.newItemAdded++;
        result.addedRecords.push({
          ...row,
          inventory_id,
          action: "added",
        });

        trackingRecords.push({
          entity: "inventory",
          file_name: fileName,
          data_json: JSON.stringify(row),
          unique_key_hash: generateHash(String(part_name) + fileName + rowIndex),
          status: "added",
        });
      }

    } catch (error) {
      const errorMsg = error.message || String(error);
      console.error(`❌ Error processing row ${rowIndex}:`, errorMsg);
      console.error(`   Full error:`, error);
      result.failedCount++;
      const failedRecord = { ...row, error: errorMsg };
      result.failedRecords.push(failedRecord);

      trackingRecords.push({
        entity: "inventory",
        file_name: fileName,
        data_json: JSON.stringify(row),
        unique_key_hash: generateHash(String(row.part_name || "unknown") + fileName + rowIndex),
        status: "failed",
        failure_reason: errorMsg,
      });
    }
  }

  // Batch insert all tracking records with proper timestamps
  let insertedCount = 0;
  if (trackingRecords.length > 0) {
    try {
      const now = new Date();
      const recordsWithTimestamp = trackingRecords.map(record => ({
        ...record,
        created_at: now,
        updated_at: now,
      }));

      console.log(`📝 Inserting ${trackingRecords.length} tracking records into udv_items...`);
      console.log(`   Added: ${result.newItemAdded}, Updated: ${result.existingItemUpdated}, Failed: ${result.failedCount}`);

      // Insert records in chunks to avoid duplicate key errors
      for (const record of recordsWithTimestamp) {
        try {
          // Check if this hash already exists
          const exists = await knex("udv_items")
            .where("unique_key_hash", record.unique_key_hash)
            .first();

          if (!exists) {
            await knex("udv_items").insert(record);
            insertedCount++;
          } else {
            console.log(`⚠️ Skipped duplicate hash: ${record.unique_key_hash}`);
          }
        } catch (recordError) {
          console.error(`Error inserting single record: ${recordError.message}`);
          // Continue with next record even if one fails
        }
      }

      console.log(`✅ Successfully tracked ${insertedCount}/${trackingRecords.length} records for inventory upload`);
    } catch (trackError) {
      console.error("❌ Error in tracking batch process:", trackError.message);
      // Don't throw - we still want to return success with whatever was inserted
    }
  } else {
    console.warn("⚠️ No tracking records to insert");
  }

  console.log(`📊 Final counts - Added: ${result.newItemAdded}, Updated: ${result.existingItemUpdated}, Failed: ${result.failedCount}`);

  return {
    fileName,
    entity: "inventory",
    total: result.total,
    addedCount: result.newItemAdded,
    duplicateCount: result.existingItemUpdated,
    failedCount: result.failedCount,
    addedRecords: result.addedRecords,
    duplicateRecords: result.updatedRecords,
    failedRecords: result.failedRecords,
  };
}

export async function getUDVItems(req, res) {
  try {
    const { entity, status, limit = 50, offset = 0 } = req.query;

    const items = await udvModel.getUDVItems(
      entity,
      status,
      parseInt(limit),
      parseInt(offset)
    );

    // Get total count
    let countQuery = knex("udv_items");
    if (entity) countQuery = countQuery.where("entity", entity);
    if (status) countQuery = countQuery.where("status", status);
    const totalResult = await countQuery.count("* as count").first();
    const total = totalResult?.count || 0;

    return res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      items,
    });
  } catch (error) {
    console.error("Error fetching UDV items:", error);
    return res.status(500).json({
      error: "Error fetching items",
      details: error.message,
    });
  }
}

export async function getUDVStats(req, res) {
  try {
    const { entity } = req.query;

    const stats = await udvModel.getUDVStats(entity);

    const result = {
      added: 0,
      duplicates: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      if (stat.status === "added") result.added = stat.count;
      if (stat.status === "duplicate" || stat.status === "updated") result.duplicates = (result.duplicates || 0) + stat.count;
      if (stat.status === "failed") result.failed = stat.count;
    });

    return res.json(result);
  } catch (error) {
    console.error("Error fetching UDV stats:", error);
    return res.status(500).json({
      error: "Error fetching stats",
      details: error.message,
    });
  }
}

export async function getUDVUploadHistory(req, res) {
  try {
    const { entity, limit = 50, offset = 0 } = req.query;

    console.log(`📋 Fetching upload history for entity: ${entity}`);

    // Get distinct file uploads with their stats
    let query = knex("udv_items");

    if (entity) {
      query = query.where("entity", entity);
    }

    const uploads = await query
      .select("file_name", "entity", "created_at")
      .select(
        knex.raw(
          "SUM(CASE WHEN status = 'added' THEN 1 ELSE 0 END) as added_count"
        ),
        knex.raw(
          "SUM(CASE WHEN status IN ('duplicate', 'updated') THEN 1 ELSE 0 END) as duplicate_count"
        ),
        knex.raw(
          "SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count"
        )
      )
      .groupBy("file_name", "entity", "created_at")
      .orderBy("created_at", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    console.log(`✅ Found ${uploads.length} uploads`);

    // Fetch detailed records for each upload
    const uploadsWithDetails = await Promise.all(
      uploads.map(async (u) => {
        const addedRecords = await knex("udv_items")
          .where({
            file_name: u.file_name,
            entity: u.entity,
            status: "added",
          })
          .select("data_json", "status");

        const duplicateRecords = await knex("udv_items")
          .where({
            file_name: u.file_name,
            entity: u.entity,
          })
          .whereIn("status", ["duplicate", "updated"])
          .select("data_json", "failure_reason", "status");

        const failedRecords = await knex("udv_items")
          .where({
            file_name: u.file_name,
            entity: u.entity,
            status: "failed",
          })
          .select("data_json", "failure_reason");

        // Parse and enrich added records
        const parsedAddedRecords = addedRecords.map(r => {
          try {
            const data = JSON.parse(r.data_json);
            return {
              ...data,
              _status: "added",
            };
          } catch (e) {
            console.error("Error parsing added record:", e.message);
            return {
              ...r.data_json,
              _status: "added",
            };
          }
        });

        // Parse and enrich duplicate/updated records with reason field
        const parsedDuplicateRecords = duplicateRecords.map(r => {
          try {
            const data = JSON.parse(r.data_json);
            let reason = data.reason || "Already exists";

            if (r.failure_reason) {
              reason = r.failure_reason;
            } else if (r.status === "updated" && data.reason) {
              reason = data.reason;
            } else if (r.status === "updated") {
              reason = "Quantity updated successfully";
            }

            const parsedRecord = {
              ...data,
              reason,
              _status: r.status,
              action: data.action || (r.status === "updated" ? "updated" : "duplicate"),
            };

            // Preserve newQuantity if it exists
            if (data.newQuantity !== undefined) {
              parsedRecord.newQuantity = data.newQuantity;
            }

            return parsedRecord;
          } catch (e) {
            console.error("Error parsing duplicate record:", e.message);
            return {
              ...r.data_json,
              reason: r.failure_reason || "Already exists",
              _status: r.status,
            };
          }
        });

        // Parse and enrich failed records with error field
        const parsedFailedRecords = failedRecords.map(r => {
          try {
            const data = JSON.parse(r.data_json);
            return {
              ...data,
              error: r.failure_reason || "Unknown error",
              _status: "failed",
            };
          } catch (e) {
            console.error("Error parsing failed record:", e.message);
            return {
              ...r.data_json,
              error: r.failure_reason || "Unknown error",
              _status: "failed",
            };
          }
        });

        const uploadRecord = {
          fileName: u.file_name,
          entity: u.entity,
          timestamp: u.created_at,
          added: u.added_count,
          duplicates: u.duplicate_count,
          failed: u.failed_count,
          addedRecords: parsedAddedRecords,
          duplicateRecords: parsedDuplicateRecords,
          failedRecords: parsedFailedRecords,
        };

        console.log(`📊 Upload: ${u.file_name} - Added: ${u.added_count}, Duplicates: ${u.duplicate_count}, Failed: ${u.failed_count}`);

        return uploadRecord;
      })
    );

    return res.json({
      uploads: uploadsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching upload history:", error);
    return res.status(500).json({
      error: "Error fetching upload history",
      details: error.message,
    });
  }
}

export async function clearUDVHistory(req, res) {
  try {
    const { entity } = req.query;

    if (entity) {
      // Clear history for specific entity
      const result = await knex("udv_items")
        .where("entity", entity)
        .del();

      console.log(`🗑️ Deleted ${result} records for entity: ${entity}`);

      return res.json({
        message: `Upload history cleared for ${entity}`,
        entity,
        deletedCount: result,
      });
    } else {
      // Clear all history
      const result = await knex("udv_items").del();

      console.log(`🗑️ Deleted ${result} total records from history`);

      return res.json({
        message: "All upload history cleared",
        deletedCount: result,
      });
    }
  } catch (error) {
    console.error("Error clearing upload history:", error);
    return res.status(500).json({
      error: "Error clearing upload history",
      details: error.message,
    });
  }
}

// Helper function to generate SHA256 hash
function generateHash(str) {
  return crypto.createHash("sha256").update(String(str)).digest("hex");
}
