import express from "express";
import knexLib from "knex"; // Import the Knex library
import { generatePrNo } from "../utils/idGenerator.js";
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

function getTzNow(req) {
  if (req?.tzHelpers) return req.tzHelpers.getCurrentDate();
  return new Date();
}

const router = express.Router();

router.use(express.json());

// Create a new procurement
router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const {
      pr_type,
      referenceName = "",
      items = [],
      telecaller,
      status = "pending",
      appointment_time,
      appointment_date,
    } = req.body;

    // Only generate a new pr_no if it is not provided
    let pr_no = req.body.pr_no;
    if (!pr_no) {
      pr_no = await generatePrNo();
    }

    if (pr_type === "SRPR" || pr_type === "MNPR") {
      // Insert procurement data
      await knex("procurements").insert({
        pr_no,
        pr_type,
        referenceName,
        status,
        telecaller,
        appointment_date,
        appointment_time,
        notes: req.body.notes || "",
      });

      // Create Purchase transactions for all items
      const purchaseTransactions = items.map(item => {
        const transaction = {
          quantity: item.qty,
          transaction_type: "Purchase",
          transaction_date: getTzNow(req),
          description: `Purchase ${item.qty} units of ${item.product} (PR: ${pr_no})`,
          inventory_id: item.item_id,
        };
        // Only include service_id if it's provided
        if (req.body.service_id) {
          transaction.service_id = req.body.service_id;
        }
        return transaction;
      });
      await knex("transactions").insert(purchaseTransactions);

      // Handle procurement items
      for (let item of items) {
        // Append supplierName and supplierNumber to each item
        item.supplierName = item.supplierName || req.body.supplierName; // Use the supplierName from the request body
        item.supplierNumber = item.supplierNumber || req.body.supplierNumber; // Use the supplierNumber from the request body

        await knex("procurement_items").insert({
          pr_no,
          product: item.product,
          details: item.details,
          qty: item.qty,
          estimatedDelivery: item.estimatedDelivery,
          item_id: item.item_id,
          supplier_id: item.supplier_id,
          supplierName: item.supplierName,
          supplierNumber: item.supplierNumber,
          received_qty: status === "Completed" ? item.qty : 0, // Auto-receive if status is Completed
        });
      }

      // If status is "Completed", also create Received transactions and update inventory
      if (status === "Completed") {
        //   FIXED: Check for Received transactions PER ITEM to prevent duplicates
        // This prevents creating multiple Received txns for the same item in the same PR
        for (let item of items) {
          // Check if a Received transaction already exists for this specific item and PR
          const existingReceivedTxn = await knex("transactions")
            .where("inventory_id", item.item_id)
            .andWhere("transaction_type", "Received")
            .andWhere("description", "like", `%PR: ${pr_no}%`)
            .first();

          if (!existingReceivedTxn) {
            // Create Received transaction for this item
            const receivedTransaction = {
              quantity: item.qty,
              transaction_type: "Received",
              transaction_date: getTzNow(req),
              description: `Received ${item.qty} units of ${item.product} (PR: ${pr_no})`,
              inventory_id: item.item_id,
            };
            // Only include service_id if it's provided
            if (req.body.service_id) {
              receivedTransaction.service_id = req.body.service_id;
            }
            await knex("transactions").insert(receivedTransaction);

            // Update inventory quantity
            const currentInventory = await knex("inventory")
              .where({ inventory_id: item.item_id })
              .first();

            if (currentInventory) {
              const newQuantity = parseInt(currentInventory.quantity) + parseInt(item.qty);
              await knex("inventory")
                .where({ inventory_id: item.item_id })
                .update({ quantity: newQuantity });
            }
          } else {
            console.warn(`Received transaction already exists for item ${item.item_id} in PR ${pr_no}, skipping to prevent duplicates`);
          }
        }
      }
      // insert pr_no into items_required where service_id is provided
      if (pr_type === "SRPR") {
        const { service_id } = req.body;

        if (!service_id) {
          return res
            .status(400)
            .json({ message: "service_id is required for SRPR type" });
        }

        const existingRecord = await knex("items_required")
          .where("service_id", service_id)
          .first();

        if (existingRecord) {
          // Update the existing record
          await knex("items_required")
            .where("service_id", service_id)
            .update({ pr_no: pr_no });
        } else {
          // Insert a new record
          await knex("items_required").insert({
            service_id: service_id,
            pr_no: pr_no,
          });
        }
      }
    } else {
      return res.status(400).json({ message: "Invalid pr_type" });
    }

    const logMessage = { message: `PR ${pr_no} created` };

    await logChange(token, "procurement_items", "INSERT", pr_no, logMessage);

    res.status(201).json({ message: "Procurement inserted successfully", pr_no });
  } catch (error) {
    console.error("Error creating procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// new route to update received_qty for all items after insertion

// new route to update received_qty for all items after insertion

router.post("/received_qty", async (req, res) => {
  console.log("hitting received_qty route", req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const {
      pr_type,
      referenceName = "",
      items = [],
      supplier_id = "",
      telecaller,
      status = "Completed",
      appointment_time,
      appointment_date,
    } = req.body;

    // Only generate a new pr_no if it is not provided
    let pr_no = req.body.pr_no;
    if (!pr_no) {
      pr_no = await generatePrNo();
    }

    if (pr_type === "SRPR" || pr_type === "MNPR") {
      // Insert procurement data
      await knex("procurements").insert({
        pr_no,
        pr_type,
        referenceName,
        status,
        telecaller,
        appointment_date,
        appointment_time,
        notes: req.body.notes || "",
      });

      // Handle procurement items
      for (let item of items) {
        // Append supplierName and supplierNumber to each item
        item.supplierName = item.supplierName || req.body.supplierName || ""; // Use the supplierName from the request body
        item.supplierNumber =
          item.supplierNumber || req.body.supplierNumber || ""; // Use the supplierNumber from the request body
        await knex("procurement_items").insert({
          pr_no,
          product: item.product,
          details: item.details,
          vendor_invoice_number: pr_no,
          qty: item.qty,
          uom: item.uom,
          // estimatedDelivery: item.estimatedDelivery,
          estimatedDelivery: item.estimatedDelivery
            ? new Date(item.estimatedDelivery)
            : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Next day
          item_id: item.item_id, // Ensure this field is being inserted
          supplier_id: supplier_id || null, // Ensure this field is being inserted
          supplierName: item.supplierName,
          supplierNumber: item.supplierNumber,
          purchase_price: item.purchase_price || null, // Store purchase price
          selling_price: item.selling_price || null, // Store selling price
        });
      }

      // Iterate over each item to check for selling_price and purchase_price
      for (let item of items) {
        if (item.selling_price || item.purchase_price) {
          console.log(`Updating inventory for item ${item.item_id}:`, {
            selling_price: item.selling_price,
            purchase_price: item.purchase_price,
          });

          // Update the price in the transactions table
          const transaction_data = {
            transaction_type: "Change Price",
            transaction_date: getTzNow(req),
            quantity: item.qty,
            inventory_id: item.item_id,
            description: `Price updated - selling: ${item.selling_price}, buying: ${item.purchase_price}`,
          };

          // Update the price in the inventory table for the specific item
          const updateData = {};
          if (item.selling_price) updateData.price = parseFloat(item.selling_price);
          if (item.purchase_price) updateData.buying_price = parseFloat(item.purchase_price);

          console.log(`Update payload for inventory:`, updateData);

          // First, check if the inventory record exists
          const inventoryBefore = await knex("inventory")
            .where("inventory_id", item.item_id)
            .first();

          console.log(`Inventory BEFORE update for ${item.item_id}:`, {
            price: inventoryBefore?.price,
            buying_price: inventoryBefore?.buying_price
          });

          if (inventoryBefore) {
            // Ensure proper number conversion
            const updatePayload = {};
            if (item.selling_price !== undefined && item.selling_price !== null) {
              updatePayload.price = parseFloat(item.selling_price);
            }
            if (item.purchase_price !== undefined && item.purchase_price !== null) {
              updatePayload.buying_price = parseFloat(item.purchase_price);
            }

            console.log(`Updating with payload:`, updatePayload);

            const updateResult = await knex("inventory")
              .where("inventory_id", item.item_id)
              .update(updatePayload);

            console.log(`Inventory update result for ${item.item_id}: ${updateResult} rows updated`);

            // Verify the update
            const inventoryAfter = await knex("inventory")
              .where("inventory_id", item.item_id)
              .first();
            console.log(`Inventory AFTER update for ${item.item_id}:`, {
              price: inventoryAfter.price,
              buying_price: inventoryAfter.buying_price
            });
          } else {
            console.warn(`Inventory record not found for item ${item.item_id}. Skipping price update.`);
          }

          await knex("transactions").insert(transaction_data);
        } else {
          console.log(`Skipping inventory update for ${item.item_id}: no price data provided`);
        }
      }

      // const transaction_data = {
      //   quantity: items.reduce((acc, item) => acc + item.qty, 0),
      //   transaction_type: "Company Purchase",
      //   transaction_date: new Date(new Date().getTime()),
      //   description: "Company placed the purchase order for the items",
      //   inventory_id: items[0].item_id,
      // }
      // await knex("transactions").insert(transaction_data);

      // Update received_qty for all items after insertion
      for (let item of items) {
        const newReceivedQty = item.qty; // Set received_qty to the quantity of the item
        // Log the change for each item
        const currentItem = await knex("procurement_items")
          .where({ pr_no, product: item.product })
          .first();

        if (currentItem) {
          const oldReceivedQty = currentItem.received_qty || 0; // Default to 0 if not set

          // Log the change
          const itemChanges = {
            received_qty: {
              old: oldReceivedQty,
              new: newReceivedQty,
            },
          };
          await logChange(
            token,
            "procurement_items",
            "UPDATE",
            `${pr_no}-${item.product}`,
            itemChanges
          );

          // Update the received_qty in the database
          await knex("procurement_items")
            .where({ pr_no, product: item.product })
            .update({ received_qty: newReceivedQty });
        }
      }

      // const transactions_data = {
      //   quantity: items.reduce((acc, item) => acc + item.qty, 0),
      //   transaction_type: "Received",
      //   transaction_date: new Date(new Date().getTime()),
      //   description: "Received the item from the supplier",
      //   inventory_id: items[0].item_id,
      // };
      //   FIXED: Check for Received transactions PER ITEM to prevent duplicates
      for (let item of items) {
        // Check if Received transaction already exists for this specific item and PR
        const existingReceivedTxn = await knex("transactions")
          .where("inventory_id", item.item_id)
          .andWhere("transaction_type", "Received")
          .andWhere("description", "like", `%PR: ${pr_no}%`)
          .first();

        // Only process if no existing Received transaction found for this item
        if (!existingReceivedTxn) {
          const transactionData = {
            quantity: item.qty,
            transaction_type: "Received",
            transaction_date: getTzNow(req),
            description: `Received ${item.qty} units of ${item.product} (PR: ${pr_no})`,
            inventory_id: item.item_id,
          };

          console.log("transaction_data", transactionData);
          await knex("transactions").insert(transactionData);

          // Update inventory quantity for this item
          try {
            const currentInventory = await knex("inventory")
              .where({ inventory_id: item.item_id })
              .first();

            if (currentInventory) {
              const newQuantity =
                parseInt(currentInventory.quantity) + parseInt(item.qty);

              await knex("inventory")
                .where({ inventory_id: item.item_id })
                .update({ quantity: newQuantity });
            }
          } catch (err) {
            console.error(`Failed to update inventory for item ${item.item_id}:`, err);
          }
        } else {
          console.warn(`Received transaction already exists for item ${item.item_id} in PR ${pr_no}, skipping to prevent duplicates`);
        }
      }


      // Insert pr_no into items_required where service_id is provided
      if (pr_type === "SRPR") {
        const { service_id } = req.body;

        if (!service_id) {
          return res
            .status(400)
            .json({ message: "service_id is required for SRPR type" });
        }

        const existingRecord = await knex("items_required")
          .where("service_id", service_id)
          .first();

        if (existingRecord) {
          // Update the existing record
          await knex("items_required")
            .where("service_id", service_id)
            .update({ pr_no: pr_no });
        } else {
          // Insert a new record
          await knex("items_required").insert({
            service_id: service_id,
            pr_no: pr_no,
          });
        }
      }
    } else {
      return res.status(400).json({ message: "Invalid pr_type" });
    }

    const logMessage = { message: `PR ${pr_no} created` };

    await logChange(token, "procurement_items", "INSERT", pr_no, logMessage);

    res.status(201).json({ message: "Procurement inserted successfully" });
  } catch (error) {
    console.error("Error creating procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/pr_knockoff/:serviceID", async (req, res) => {
  console.log("Hitting pr_knockoff route", req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let rcveQty = req.body.received_quantity;

  try {
    const { serviceID } = req.params;
    console.log("Service ID:", serviceID);

    // Fetch the first PR number
    const prNoRecord = await knex("procurement_items")
      .where({ service_id: serviceID })
      .select("pr_no")
      .first();

    const prNo = prNoRecord?.pr_no;
    console.log("First PR Number:", prNo);

    // Update received quantity
    await knex("procurement_items")
      .where({ service_id: serviceID })
      .update({ received_qty: rcveQty });

    // Check if any incomplete services exist
    let incompleteServices = await knex("procurement_items")
      .where({ pr_no: prNo })
      .andWhere("received_qty", "<", knex.raw("qty"));

    console.log("Incomplete Services:", incompleteServices);

    // If all services are completed, update the procurement status
    if (incompleteServices.length === 0) {
      await knex("procurements")
        .where({ pr_no: prNo })
        .update({ status: "Completed" });
    }

    const logMessage = {
      message: `Automatic - PR ${prNo} knockoff based on service status`,
    };

    await logChange(token, "procurement_items", "INSERT", prNo, logMessage);

    res.status(201).json({ message: "Procurement updated successfully" });
  } catch (error) {
    console.error("Error updating procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//* LK: Backup Code - Update inventory quantity and procurement_items quantity
// router.put("/updateQuantity/:id", async (req, res) => {
//   const { id } = req.params;
//   const { received_quantity, pr_no, product } = req.body;

//   // Check if pr_no and product are provided
//   if (!pr_no || !product) {
//     return res.status(400).json({ error: "pr_no and product are required" });
//   }

//   if (received_quantity === undefined) {
//     return res.status(400).json({ error: "Received quantity is required" });
//   }

//   try {
//     await knex.transaction(async (trx) => {
//       // Update inventory
//       const currentInventory = await trx("inventory")
//         .where({ inventory_id: id })
//         .first();
//       if (!currentInventory) {
//         throw new Error("Inventory item not found");
//       }
//       const newInventoryQuantity =
//         currentInventory.quantity + received_quantity;
//       await trx("inventory")
//         .where({ inventory_id: id })
//         .update({ quantity: newInventoryQuantity });
//       const transaction_data = {
//         quantity: received_quantity,
//         transaction_type: "Purchase",
//         transaction_date: new Date(new Date().getTime()),
//         description: "--",
//         inventory_id: id,
//       };
//       const transaction = await knex("transactions").insert(transaction_data);
//       console.log("transaction", transaction);
//       // Update procurement_items
//       const currentProcurementItem = await trx("procurement_items")
//         .where({ pr_no, product })
//         .first();

//       if (!currentProcurementItem) {
//         throw new Error("Procurement item not found");
//       }

//       const newProcurementQuantity =
//         currentProcurementItem.qty - received_quantity;
//       if (newProcurementQuantity < 0) {
//         throw new Error("Received quantity exceeds available quantity");
//       }

//       await trx("procurement_items")
//         .where({ pr_no, product })
//         .update({ qty: newProcurementQuantity });
//     });

//     res.status(200).json({ message: "Quantities updated successfully" });
//   } catch (error) {
//     console.error("Error updating quantities:", error.message);
//     res.status(500).json({
//       error: "Error updating quantities",
//       details: error.message,
//     });
//   }
// });

// Update inventory quantity and procurement_items quantity
//! LK: If this code works fine delete the one above.
router.put("/updateQuantity/:id", async (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const { received_quantity, pr_no, product } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  // console.log({ received_quantity, pr_no, product });
  const others = {
    vendor_invoice_number: req.body.vendor_invoice_number,
    vendor_invoice_date: req.body.vendor_invoice_date,
  };

  // updated data into db only if others contains data exists
  if (others.vendor_invoice_number || others.vendor_invoice_date) {
    const vendor_invoice_date = others.vendor_invoice_date
      ? new Date(others.vendor_invoice_date)
      : null;
    await knex("procurement_items").where({ pr_no, product }).update({
      vendor_invoice_number: others.vendor_invoice_number,
      vendor_invoice_date,
    });
  }

  // Validate input
  if (!pr_no || !product) {
    return res.status(400).json({ error: "pr_no and product are required" });
  }

  if (received_quantity === undefined) {
    return res.status(400).json({ error: "Received quantity is required" });
  }

  try {
    await knex.transaction(async (trx) => {
      // Fetch current inventory item
      const currentInventory = await trx("inventory")
        .where({ inventory_id: id })
        .first();
      if (!currentInventory) {
        throw new Error("Inventory item not found");
      }

      // Calculate new inventory quantity
      const newInventoryQuantity =
        currentInventory.quantity + received_quantity;

      // Log inventory change if modified
      if (currentInventory.quantity !== newInventoryQuantity) {
        const inventoryChanges = {
          quantity: {
            old: currentInventory.quantity,
            new: newInventoryQuantity,
          },
        };
        await logChange(token, "inventory", "UPDATE", id, inventoryChanges);
      }

      // Update inventory
      await trx("inventory")
        .where({ inventory_id: id })
        .update({ quantity: newInventoryQuantity });

      // Log the transaction - Create Received transaction, not Purchase
      // Check if a Received transaction already exists for this procurement item
      const existingReceivedTxn = await trx("transactions")
        .where("inventory_id", id)
        .andWhere("transaction_type", "Received")
        .andWhere("description", "like", `%PR: ${pr_no}%`)
        .first();

      if (!existingReceivedTxn) {
        const transactionData = {
          quantity: received_quantity,
          transaction_type: "Received",
          transaction_date: getTzNow(req),
          description: `Received ${received_quantity} units (PR: ${pr_no})`,
          inventory_id: id,
        };
        await trx("transactions").insert(transactionData);
      } else {
        console.warn(`Received transaction already exists for PR ${pr_no}, skipping to prevent duplicates`);
      }

      // Fetch current procurement item
      const currentProcurementItem = await trx("procurement_items")
        .where({ pr_no, product })
        .first();

      if (!currentProcurementItem) {
        throw new Error("Procurement item not found");
      }

      // Calculate new procurement quantity
      const newProcurementQuantity =
        currentProcurementItem.received_qty + received_quantity;
      if (newProcurementQuantity < 0) {
        throw new Error("Received quantity exceeds available quantity");
      }

      // Log procurement item change if modified
      if (currentProcurementItem.qty !== newProcurementQuantity) {
        const procurementChanges = {
          qty: {
            old: currentProcurementItem.qty,
            new: newProcurementQuantity,
          },
        };
        await logChange(
          token,
          "procurement_items",
          "UPDATE",
          `${pr_no}-${product}`,
          procurementChanges
        );
      }

      // Update procurement items
      await trx("procurement_items")
        .where({ pr_no, product, item_id: id })
        .update({ received_qty: newProcurementQuantity });
    });

    res.status(200).json({ message: "Quantities updated successfully" });
  } catch (error) {
    console.error("Error updating quantities:", error.message);
    res.status(500).json({
      error: "Error updating quantities",
      details: error.message,
    });
  }
});

//* LK: Backup - Update a procurement by ID
// router.put("/:pr_no", async (req, res) => {
//   try {
//     const { pr_no } = req.params;
//     const { pr_type, referenceName, items, status } = req.body;

//     if (pr_type === "SRPR" || pr_type === "MNPR") {
//       // Update procurement data
//       const updated = await knex("procurements")
//         .where("pr_no", pr_no)
//         .update({
//           referenceName,
//           status,
//           notes: req.body.notes || "",
//         });

//       if (!updated) {
//         return res.status(404).json({ message: "Procurement not found" });
//       }

//       // Handle items update
//       if (items) {
//         for (let item of items) {
//           await knex("procurement_items")
//             .where({ pr_no, product: item.product })
//             .update({
//               details: item.details,
//               qty: item.qty,
//               estimatedDelivery: item.estimatedDelivery,
//               supplierName: item.supplierName,
//               supplierNumber: item.supplierNumber,
//             });
//         }
//       }
//     } else {
//       return res.status(400).json({ message: "Invalid pr_type" });
//     }

//     res.json({ message: "Procurement updated successfully" });
//   } catch (error) {
//     console.error("Error updating procurement:", error);
//     res
//       .status(400)
//       .json({ message: "Error updating procurement", details: error.message });
//   }
// });

// Update a procurement by ID
//! LK: If this code works fine delete the one above.
router.put("/:pr_no", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { pr_no } = req.params;
    const { pr_type, referenceName, items, status } = req.body;

    if (pr_type !== "SRPR" && pr_type !== "MNPR") {
      return res.status(400).json({ message: "Invalid pr_type" });
    }

    // Fetch existing procurement data
    const currentProcurement = await knex("procurements")
      .where("pr_no", pr_no)
      .first();

    if (!currentProcurement) {
      return res.status(404).json({ message: "Procurement not found" });
    }

    // Prepare new procurement data for update
    const newProcurementData = {
      referenceName,
      status,
      notes: req.body.notes || "",
    };

    // Log changes in procurement data
    const procurementChanges = {};
    for (let key in newProcurementData) {
      if (currentProcurement[key] !== newProcurementData[key]) {
        procurementChanges[key] = {
          old: currentProcurement[key],
          new: newProcurementData[key],
        };
      }
    }

    // Update procurement table
    const updated = await knex("procurements")
      .where("pr_no", pr_no)
      .update(newProcurementData);

    if (!updated) {
      return res.status(404).json({ message: "Procurement not found" });
    }

    if (Object.keys(procurementChanges).length > 0) {
      await logChange(
        token,
        "procurements",
        "UPDATE",
        pr_no,
        procurementChanges
      );
    }

    // Handle items update
    if (items) {
      for (let item of items) {
        // Fetch existing item data
        const currentItem = await knex("procurement_items")
          .where({ pr_no, product: item.product })
          .first();

        if (!currentItem) {
          throw new Error(
            `Procurement item not found for product: ${item.product}`
          );
        }

        const newItemData = {
          details: item.details,
          qty: item.qty,
          estimatedDelivery: item.estimatedDelivery,
          supplierName: item.supplierName,
          supplierNumber: item.supplierNumber,
        };

        // Log changes in procurement items
        const itemChanges = {};
        for (let key in newItemData) {
          if (currentItem[key] !== newItemData[key]) {
            itemChanges[key] = {
              old: currentItem[key],
              new: newItemData[key],
            };
          }
        }

        // Update procurement items table
        await knex("procurement_items")
          .where({ pr_no, product: item.product })
          .update(newItemData);

        if (Object.keys(itemChanges).length > 0) {
          await logChange(
            token,
            "procurement_items",
            "UPDATE",
            `${pr_no}-${item.product}`,
            itemChanges
          );
        }
      }
    }

    res.json({ message: "Procurement updated successfully" });
  } catch (error) {
    console.error("Error updating procurement:", error.message);
    res.status(400).json({
      message: "Error updating procurement",
      details: error.message,
    });
  }
});

//* LK: Backupupdate procurement status
// router.put("/status/:pr_no", async (req, res) => {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];
//   const { pr_no } = req.params;
//   const { status } = req.body;
//   const updated = await knex("procurements")
//     .where("pr_no", pr_no)
//     .update({ status });

//     await logChange(token, "procurements", "UPDATE", pr_no, status);

//   res.json({ message: "Procurement status updated successfully" });
// });

// Update procurement status
//! LK: If this code works fine delete the one above.
router.put("/status/:pr_no", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { pr_no } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Fetch the current status
    const currentProcurement = await knex("procurements")
      .select("status")
      .where("pr_no", pr_no)
      .first();

    if (!currentProcurement) {
      return res.status(404).json({ error: "Procurement not found" });
    }

    const currentStatus = currentProcurement.status;

    // Check if the status is actually changing
    if (currentStatus === status) {
      return res
        .status(400)
        .json({ error: "New status is the same as the current status" });
    }

    // Update the status
    await knex("procurements").where("pr_no", pr_no).update({ status });

    // Log the change
    const changeLog = {
      field: "status",
      old: currentStatus,
      new: status,
    };
    await logChange(token, "procurements", "UPDATE", pr_no, changeLog);

    res.json({ message: "Procurement status updated successfully" });
  } catch (error) {
    console.error("Error updating procurement status:", error.message);
    res.status(500).json({
      error: "Failed to update procurement status",
      details: error.message,
    });
  }
});

// Get all procurements
// router.get("/:pr_type", async (req, res) => {
//   const { pr_type } = req.params;

//   let procurement;

//   try {
//     if (pr_type == "both") {
//       const res = await knex("procurements")
//         .select(
//           "procurements.pr_no",
//           "procurements.pr_type",
//           "procurements.referenceName",
//           "procurements.status",
//           "procurements.telecaller",
//           "procurements.notes",
//           "procurement_items.product",
//           "procurement_items.details",
//           "procurement_items.created_at",
//           "procurement_items.updated_at",
//           "procurement_items.qty",
//           "procurement_items.received_qty",
//           "procurement_items.estimatedDelivery",
//           "procurement_items.supplierName",
//           "procurement_items.supplierNumber",
//           "procurement_items.item_id",
//           "procurement_items.supplier_id"
//         )
//         .leftJoin(
//           "procurement_items",
//           "procurements.pr_no",
//           "procurement_items.pr_no"
//         );
//       procurement = res;
//     } else {
//       const res = await knex("procurements")
//         .select(
//           "procurements.pr_no",
//           "procurements.pr_type",
//           "procurements.referenceName",
//           "procurements.status",
//           "procurements.telecaller",
//           "procurements.notes",
//           "procurement_items.product",
//           "procurement_items.details",
//           "procurement_items.created_at",
//           "procurement_items.updated_at",
//           "procurement_items.qty",
//           "procurement_items.received_qty",
//           "procurement_items.estimatedDelivery",
//           "procurement_items.supplierName",
//           "procurement_items.supplierNumber",
//           "procurement_items.item_id",
//           "procurement_items.supplier_id"
//         )
//         .leftJoin(
//           "procurement_items",
//           "procurements.pr_no",
//           "procurement_items.pr_no"
//         )
//         .where("procurements.pr_type", pr_type || "SRPR");
//       procurement = res;
//     }

//     const procurementMap = {};

//     procurements.forEach((row) => {
//       if (!procurementMap[row.pr_no]) {
//         procurementMap[row.pr_no] = {
//           _id: `procurement-${row.pr_no}`,
//           pr_no: row.pr_no,
//           pr_type: row.pr_type,
//           referenceName: row.referenceName,
//           status: row.status,
//           telecaller: row.telecaller,
//           notes: row.notes,
//           items: [],
//         };
//       }

//       const procurement = procurementMap[row.pr_no];

//       if (row.product) {
//         procurement.items.push({
//           product: row.product,
//           details: row.details,
//           qty: row.qty,
//           received_qty: row.received_qty,
//           estimatedDelivery: row.estimatedDelivery,
//           supplierName: row.supplierName,
//           supplierNumber: row.supplierNumber,
//           item_id: row.item_id,
//           supplier_id: row.supplier_id,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//         });
//       }
//     });

//     res.json(Object.values(procurementMap));
//   } catch (error) {
//     console.error("Error fetching procurements:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.get("/:pr_type", async (req, res) => {
  const { pr_type } = req.params;

  let procurement;

  try {
    if (pr_type === "both") {
      procurement = await knex("procurements")
        .select(
          "procurements.pr_no",
          "procurements.pr_type",
          "procurements.referenceName",
          "procurements.status",
          "procurements.telecaller",
          "procurements.notes",
          "procurement_items.product",
          "procurement_items.details",
          "procurement_items.created_at",
          "procurement_items.updated_at",
          "procurement_items.qty",
          "procurement_items.received_qty",
          "procurement_items.estimatedDelivery",
          "procurement_items.supplierName",
          "procurement_items.supplierNumber",
          "procurement_items.item_id",
          "procurement_items.supplier_id"
        )
        .leftJoin(
          "procurement_items",
          "procurements.pr_no",
          "procurement_items.pr_no"
        );
    } else {
      procurement = await knex("procurements")
        .select(
          "procurements.pr_no",
          "procurements.pr_type",
          "procurements.referenceName",
          "procurements.status",
          "procurements.telecaller",
          "procurements.notes",
          "procurement_items.product",
          "procurement_items.details",
          "procurement_items.created_at",
          "procurement_items.updated_at",
          "procurement_items.qty",
          "procurement_items.received_qty",
          "procurement_items.estimatedDelivery",
          "procurement_items.supplierName",
          "procurement_items.supplierNumber",
          "procurement_items.item_id",
          "procurement_items.supplier_id"
        )
        .leftJoin(
          "procurement_items",
          "procurements.pr_no",
          "procurement_items.pr_no"
        )
        .whereIn("procurements.pr_type", [pr_type]); // Ensuring "SRPR" is included
    }

    const procurementMap = {};

    procurement.forEach((row) => {
      if (!procurementMap[row.pr_no]) {
        procurementMap[row.pr_no] = {
          _id: `procurement-${row.pr_no}`,
          pr_no: row.pr_no,
          pr_type: row.pr_type,
          referenceName: row.referenceName,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          items: [],
        };
      }

      if (row.product) {
        procurementMap[row.pr_no].items.push({
          product: row.product,
          details: row.details,
          qty: row.qty,
          received_qty: row.received_qty,
          estimatedDelivery: row.estimatedDelivery,
          supplierName: row.supplierName,
          supplierNumber: row.supplierNumber,
          item_id: row.item_id,
          supplier_id: row.supplier_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    });

    res.json(Object.values(procurementMap));
  } catch (error) {
    console.error("Error fetching procurements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific procurement by pr_no only (without requiring pr_type)
router.get("/single/:pr_no", async (req, res) => {
  try {
    const { pr_no } = req.params;

    const procurementData = await knex("procurements")
      .select(
        "procurements.pr_no",
        "procurements.pr_type",
        "procurements.referenceName",
        "procurements.status",
        "procurements.telecaller",
        "procurements.notes",
        "procurement_items.product",
        "procurement_items.details",
        "procurement_items.qty",
        "procurement_items.estimatedDelivery",
        "procurement_items.supplierName",
        "procurement_items.supplierNumber",
        "procurement_items.item_id",
        "procurement_items.supplier_id",
        "procurement_items.created_at",
        "procurement_items.updated_at",
        "procurement_items.received_qty",
        "procurement_items.uom"
      )
      .leftJoin(
        "procurement_items",
        "procurements.pr_no",
        "procurement_items.pr_no"
      )
      .where("procurements.pr_no", pr_no);

    if (procurementData.length > 0) {
      const procurement = {
        _id: `procurement-${procurementData[0].pr_no}`,
        pr_no: procurementData[0].pr_no,
        pr_type: procurementData[0].pr_type,
        referenceName: procurementData[0].referenceName,
        status: procurementData[0].status,
        telecaller: procurementData[0].telecaller,
        notes: procurementData[0].notes,
        items: [],
      };

      procurementData.forEach((row) => {
        if (row.product) {
          procurement.items.push({
            product: row.product,
            details: row.details,
            qty: row.qty,
            uom: row.uom,
            received_qty: row.received_qty,
            estimatedDelivery: row.estimatedDelivery,
            supplierName: row.supplierName,
            supplierNumber: row.supplierNumber,
            item_id: row.item_id,
            supplier_id: row.supplier_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      });

      return res.json(procurement);
    }

    res.status(404).json({ message: "Procurement not found" });
  } catch (error) {
    console.error("Error fetching procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a procurement by pr_no
router.get("/:pr_type/:pr_no", async (req, res) => {
  console.log("req.params", req.params);
  try {
    const { pr_no } = req.params;

    const procurementData = await knex("procurements")
      .select(
        "procurements.pr_no",
        "procurements.pr_type",
        "procurements.referenceName",
        "procurements.status",
        "procurements.telecaller",
        "procurements.notes",
        "procurement_items.product",
        "procurement_items.details",
        "procurement_items.qty",
        "procurement_items.estimatedDelivery",
        "procurement_items.supplierName",
        "procurement_items.supplierNumber",
        "procurement_items.item_id",
        "procurement_items.supplier_id",
        "procurement_items.created_at",
        "procurement_items.updated_at",
        "procurement_items.received_qty",
        "procurement_items.uom"
      )
      .leftJoin(
        "procurement_items",
        "procurements.pr_no",
        "procurement_items.pr_no"
      )
      .where("procurements.pr_no", pr_no);

    if (procurementData.length > 0) {
      const procurement = {
        _id: `procurement-${procurementData[0].pr_no}`,
        pr_no: procurementData[0].pr_no,
        pr_type: procurementData[0].pr_type,
        referenceName: procurementData[0].referenceName,
        status: procurementData[0].status,
        telecaller: procurementData[0].telecaller,
        notes: procurementData[0].notes,
        items: [],
      };

      procurementData.forEach((row) => {
        if (row.product) {
          procurement.items.push({
            product: row.product,
            details: row.details,
            qty: row.qty,
            uom: row.uom,
            received_qty: row.received_qty,
            estimatedDelivery: row.estimatedDelivery,
            supplierName: row.supplierName,
            supplierNumber: row.supplierNumber,
            item_id: row.item_id,
            supplier_id: row.supplier_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      });
      console.log("procurement", procurement);
      return res.json(procurement);
    }

    res.status(404).json({ message: "Procurement not found" });
  } catch (error) {
    console.error("Error fetching procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Delete procurement item by pr_no and item_id (MUST be before generic /:pr_no delete route)
router.delete("/deleteItem/:pr_no/:item_id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { pr_no, item_id } = req.params;

    // Fetch procurement item details before deletion for logging purposes
    const procurementItemDetails = await knex("procurement_items")
      .where({ pr_no, item_id })
      .first();

    if (!procurementItemDetails) {
      return res.status(404).json({ error: "Procurement item not found" });
    }

    // Delete the procurement item
    const deletedCount = await knex("procurement_items")
      .where({ pr_no, item_id })
      .del();

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Procurement item could not be deleted." });
    }

    // Log the deletion
    const changes = {
      deleted_procurement_item: procurementItemDetails,
    };
    await logChange(
      token,
      "procurement_items",
      "DELETE",
      `${pr_no}-${item_id}`,
      changes
    );

    // Respond with success message
    res.status(200).json({ message: "Procurement item deleted successfully." });
  } catch (error) {
    console.error("Error deleting procurement item:", error);
    res.status(500).json({
      error: "Error deleting procurement item.",
      details: error.message,
    });
  }
});

//get all procurement items by supplier_id
router.get("/supplier/prDetails/:supplier_id", async (req, res) => {
  console.log("hitting");
  const { supplier_id } = req.params;
  console.log({ supplier_id });
  const procurementItems = await knex("procurement_items")
    .select("*")
    .where("supplier_id", supplier_id);

  console.log({ supplier_id, procurementItems });

  res.json(procurementItems);
});

// Create or update a procurement for SRPR type
//   SRPR Route: Service-based Purchase Request with shortage-based PR creation
// Supports auto-receipt when status = "Completed"
// Each item can include:
//   - qty: required quantity for consumption
//   - shortage_qty: shortage quantity for PR (optional, uses qty if not provided)
router.post("/srpr", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const {
      pr_type,
      referenceName = "",
      items = [],
      telecaller,
      status = "pending",
      appointment_time,
      appointment_date,
      service_id,
    } = req.body;

    console.log("SRPR Route - Incoming request:", {
      service_id,
      status,
      itemsCount: items.length,
      items: items.map(i => ({
        product: i.product,
        qty: i.qty,
        shortage_qty: i.shortage_qty,
        item_id: i.item_id,
      })),
    });

    if (!service_id) {
      return res
        .status(400)
        .json({ message: "service_id is required for SRPR type" });
    }

    // Check if a procurement already exists for the given service_id in procurement_items
    let existingProcurementItem = await knex("procurement_items")
      .where("service_id", service_id)
      .first();

    if (existingProcurementItem) {
      // Get the associated procurement using the pr_no from the existing procurement item
      let existingProcurement = await knex("procurements")
        .where("pr_no", existingProcurementItem.pr_no)
        .first();

      // Update existing procurement
      await knex("procurements")
        .where("pr_no", existingProcurement.pr_no)
        .update({
          referenceName,
          status,
          telecaller,
          appointment_date,
          appointment_time,
          notes: req.body.notes || "",
        });

      // Handle procurement items
      for (let item of items) {
        // Check inventory stock for transaction logging
        let inventoryItem = null;
        if (item.item_id) {
          inventoryItem = await knex("inventory")
            .where({ inventory_id: item.item_id })
            .first();
        }

        // Use shortage_qty if provided (for shortage-based PR), otherwise use qty
        const prQty = item.shortage_qty !== undefined ? item.shortage_qty : item.qty;

        // Check if the item already exists
        let existingItem = await knex("procurement_items")
          .where({ pr_no: existingProcurement.pr_no, product: item.product })
          .first();

        if (existingItem) {
          // Update existing item
          await knex("procurement_items")
            .where({ pr_no: existingProcurement.pr_no, product: item.product })
            .update({
              details: item.details || "", // Default to empty string if not provided
              qty: prQty,
              estimatedDelivery: item.estimatedDelivery || null, // Default to null if not provided
              supplierName: item.supplierName || "", // Default to empty string if not provided
              supplierNumber: item.supplierNumber || "", // Default to empty string if not provided
              item_id: item.item_id || null, // Ensure item_id is included
              service_id: item.service_id, // Ensure service_id is included
            });

          // Log transaction for existing item update
          //   FIX: Check if Purchase transaction already exists to prevent duplicates
          if (item.item_id && prQty > 0) {
            const existingPurchaseTxn = await knex("transactions")
              .where("inventory_id", item.item_id)
              .andWhere("transaction_type", "Purchase")
              .andWhere("description", "like", `%PR: ${existingProcurement.pr_no}%`)
              .first();

            if (!existingPurchaseTxn) {
              const transactionData = {
                transaction_type: "Purchase",
                transaction_date: getTzNow(req),
                quantity: prQty,
                inventory_id: item.item_id,
                description: `PR ${existingProcurement.pr_no} updated - Item: ${item.product}, PR qty: ${prQty}`,
              };
              await knex("transactions").insert(transactionData);
            }
          }
        } else {
          // Insert new item
          await knex("procurement_items").insert({
            pr_no: existingProcurement.pr_no,
            product: item.product,
            details: item.details || "", // Default to empty string if not provided
            qty: prQty,
            estimatedDelivery: item.estimatedDelivery || null, // Default to null if not provided
            item_id: item.item_id || null, // Ensure item_id is included
            supplier_id: item.supplier_id || null, // Ensure supplier_id is included
            supplierName: item.supplierName || "", // Default to empty string if not provided
            supplierNumber: item.supplierNumber || "", // Default to empty string if not provided
            service_id: item.service_id, // Store service_id in procurement_items
          });

          // Log transaction for new item in existing PR
          //   FIX: Check if Purchase transaction already exists to prevent duplicates
          if (item.item_id && prQty > 0) {
            const existingPurchaseTxn = await knex("transactions")
              .where("inventory_id", item.item_id)
              .andWhere("transaction_type", "Purchase")
              .andWhere("service_id", item.service_id)
              .first();

            if (!existingPurchaseTxn) {
              const transactionData = {
                transaction_type: "Purchase",
                transaction_date: getTzNow(req),
                quantity: prQty,
                inventory_id: item.item_id,
                description: `PR ${existingProcurement.pr_no} updated - Item: ${item.product}, Adding qty: ${prQty}`,
                service_id: item.service_id,
              };
              await knex("transactions").insert(transactionData);
            }
          }
        }
      }

      // Update items_required for each item
      for (let item of items) {
        await knex("items_required")
          .where("service_id", item.service_id)
          .update({ pr_no: existingProcurement.pr_no });

        await logChange(
          token,
          "items_required",
          "INSERT",
          item.service_id,
          item
        );
      }

      // Handle auto-receipt if status is "Completed"
      if (status === "Completed") {
        for (let item of items) {
          const prQty = item.shortage_qty !== undefined ? item.shortage_qty : item.qty;

          // Check if Received transaction already exists for this item and PR
          const existingReceivedTxn = await knex("transactions")
            .where("inventory_id", item.item_id)
            .andWhere("transaction_type", "Received")
            .andWhere("description", "like", `%PR: ${existingProcurement.pr_no}%`)
            .first();

          if (!existingReceivedTxn && item.item_id && prQty > 0) {
            // Create Received transaction
            await knex("transactions").insert({
              quantity: prQty,
              transaction_type: "Received",
              transaction_date: getTzNow(req),
              description: `Received ${prQty} units of ${item.product} (PR: ${existingProcurement.pr_no})`,
              inventory_id: item.item_id,
              service_id: service_id,
            });

            // Update inventory quantity
            const currentInventory = await knex("inventory")
              .where({ inventory_id: item.item_id })
              .first();

            if (currentInventory) {
              const newQuantity = parseInt(currentInventory.quantity) + parseInt(prQty);
              await knex("inventory")
                .where({ inventory_id: item.item_id })
                .update({ quantity: newQuantity });
            }

            //   FIX: Auto-consume received qty to fulfill remaining requirement
            // This ensures the flow: Consumed available → Purchase shortage → Received → Consumed received
            const consumedTxn = await knex("transactions")
              .where("service_id", service_id)
              .andWhere("inventory_id", item.item_id)
              .andWhere("transaction_type", "Consumed")
              .first();

            if (consumedTxn) {
              // Item was already partially consumed, now consume the received qty
              await knex("transactions").insert({
                quantity: prQty,
                transaction_type: "Consumed",
                transaction_date: getTzNow(req),
                description: `Consumed qty ${prQty} from received stock (PR: ${existingProcurement.pr_no}) for appointment ${service_id}`,
                inventory_id: item.item_id,
                service_id: service_id,
              });

              // Decrement inventory to reflect consumption of received stock
              const afterReceiptInventory = await knex("inventory")
                .where({ inventory_id: item.item_id })
                .first();

              if (afterReceiptInventory) {
                const finalQuantity = Math.max(0, parseInt(afterReceiptInventory.quantity) - parseInt(prQty));
                await knex("inventory")
                  .where({ inventory_id: item.item_id })
                  .update({ quantity: finalQuantity });
              }
            }

            // Update received_qty in procurement_items
            await knex("procurement_items")
              .where({ pr_no: existingProcurement.pr_no, product: item.product })
              .update({ received_qty: prQty });
          }
        }
      }

      return res
        .status(200)
        .json({ message: "Procurement updated successfully" });
    } else {
      // Create new procurement
      let pr_no = await generatePrNo();
      await knex("procurements").insert({
        pr_no,
        pr_type,
        referenceName,
        status,
        telecaller,
        appointment_date,
        appointment_time,
        notes: req.body.notes || "",
      });

      // Handle procurement items
      for (let item of items) {
        // Check inventory stock
        let inventoryItem = null;
        if (item.item_id) {
          inventoryItem = await knex("inventory")
            .where({ inventory_id: item.item_id })
            .first();
        }

        // Use shortage_qty if provided (for shortage-based PR), otherwise use qty
        const prQty = item.shortage_qty !== undefined ? item.shortage_qty : item.qty;

        // Log transaction for procurement - log PR qty, not required qty
        //   FIX: Check if Purchase transaction already exists to prevent duplicates
        if (item.item_id && prQty > 0) {
          const existingPurchaseTxn = await knex("transactions")
            .where("inventory_id", item.item_id)
            .andWhere("transaction_type", "Purchase")
            .andWhere("service_id", item.service_id)
            .first();

          if (!existingPurchaseTxn) {
            const shortageInfo = item.shortage_qty !== undefined ? `, Shortage qty: ${prQty}` : "";
            const transactionData = {
              transaction_type: "Purchase",
              transaction_date: getTzNow(req),
              quantity: prQty,
              inventory_id: item.item_id,
              description: `PR ${pr_no} created - Item: ${item.product}, PR qty: ${prQty}${shortageInfo}`,
              service_id: item.service_id,
            };
            await knex("transactions").insert(transactionData);
          }
        }

        const itemData = {
          pr_no,
          product: item.product,
          details: item.details || "", // Default to empty string if not provided
          qty: prQty,
          estimatedDelivery: item.estimatedDelivery || null, // Default to null if not provided
          item_id: item.item_id || null, // Ensure item_id is included
          supplier_id: item.supplier_id || null, // Ensure supplier_id is included
          supplierName: item.supplierName || "", // Default to empty string if not provided
          supplierNumber: item.supplierNumber || "", // Default to empty string if not provided
          service_id: item.service_id, // Store service_id in procurement_items
          received_qty: status === "Completed" ? prQty : 0, // Set received_qty if auto-completing
        };
        // Insert new item
        await knex("procurement_items").insert(itemData);

        await logChange(token, "procurements", "INSERT", pr_no, itemData);

        let itemRequired = {
          service_id: item.service_id,
          pr_no: pr_no,
        };
        // Insert pr_no into items_required for each service_id
        await knex("items_required").insert(itemRequired);

        await logChange(
          token,
          "items_required",
          "INSERT",
          item.service_id,
          itemRequired
        );
      }

      // Handle auto-receipt if status is "Completed"
      if (status === "Completed") {
        for (let item of items) {
          const prQty = item.shortage_qty !== undefined ? item.shortage_qty : item.qty;

          if (item.item_id && prQty > 0) {
            //   FIX: Check if Received transaction already exists to prevent duplicates
            const existingReceivedTxn = await knex("transactions")
              .where("inventory_id", item.item_id)
              .andWhere("transaction_type", "Received")
              .andWhere("service_id", service_id)
              .first();

            if (!existingReceivedTxn) {
              // Create Received transaction
              await knex("transactions").insert({
                quantity: prQty,
                transaction_type: "Received",
                transaction_date: getTzNow(req),
                description: `Received ${prQty} units of ${item.product} (PR: ${pr_no})`,
                inventory_id: item.item_id,
                service_id: service_id,
              });

              // Update inventory quantity
              const currentInventory = await knex("inventory")
                .where({ inventory_id: item.item_id })
                .first();

              if (currentInventory) {
                const newQuantity = parseInt(currentInventory.quantity) + parseInt(prQty);
                await knex("inventory")
                  .where({ inventory_id: item.item_id })
                  .update({ quantity: newQuantity });
              }

              //   FIX: Auto-consume received qty to fulfill remaining requirement
              // This ensures the flow: Consumed available → Purchase shortage → Received → Consumed received
              const consumedTxn = await knex("transactions")
                .where("service_id", service_id)
                .andWhere("inventory_id", item.item_id)
                .andWhere("transaction_type", "Consumed")
                .first();

              if (consumedTxn) {
                // Check if consumed-from-received transaction already exists
                const existingConsumedFromReceivedTxn = await knex("transactions")
                  .where("service_id", service_id)
                  .andWhere("inventory_id", item.item_id)
                  .andWhere("transaction_type", "Consumed")
                  .andWhere("description", "like", `%from received stock (PR: ${pr_no})%`)
                  .first();

                if (!existingConsumedFromReceivedTxn) {
                  // Item was already partially consumed, now consume the received qty
                  await knex("transactions").insert({
                    quantity: prQty,
                    transaction_type: "Consumed",
                    transaction_date: getTzNow(req),
                    description: `Consumed qty ${prQty} from received stock (PR: ${pr_no}) for appointment ${service_id}`,
                    inventory_id: item.item_id,
                    service_id: service_id,
                  });

                  // Decrement inventory to reflect consumption of received stock
                  const afterReceiptInventory = await knex("inventory")
                    .where({ inventory_id: item.item_id })
                    .first();

                  if (afterReceiptInventory) {
                    const finalQuantity = Math.max(0, parseInt(afterReceiptInventory.quantity) - parseInt(prQty));
                    await knex("inventory")
                      .where({ inventory_id: item.item_id })
                      .update({ quantity: finalQuantity });
                  }
                }
              }
            }
          }
        }
      }

      return res
        .status(201)
        .json({ message: "Procurement inserted successfully", pr_no });
    }
  } catch (error) {
    console.error("Error creating/updating procurement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/updateItem/:pr_no/:item_id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { pr_no, item_id } = req.params;
    const { details, qty, estimatedDelivery, supplierName, supplierNumber, supplier_id } =
      req.body;

    // Fetch the current procurement item
    const currentItem = await knex("procurement_items")
      .where({ pr_no, item_id })
      .first();

    if (!currentItem) {
      return res.status(404).json({ message: "Procurement item not found" });
    }

    // Prepare new item data for update
    const newItemData = {
      details,
      qty,
      estimatedDelivery,
      supplierName,
      supplierNumber,
      supplier_id,
    };

    // Log changes in procurement item data
    const itemChanges = {};
    for (let key in newItemData) {
      if (currentItem[key] !== newItemData[key]) {
        itemChanges[key] = {
          old: currentItem[key],
          new: newItemData[key],
        };
      }
    }

    // Update procurement items table
    await knex("procurement_items")
      .where({ pr_no, item_id })
      .update(newItemData);

    if (Object.keys(itemChanges).length > 0) {
      await logChange(
        token,
        "procurement_items",
        "UPDATE",
        `${pr_no}-${item_id}`,
        itemChanges
      );
    }

    res.json({ message: "Procurement item updated successfully" });
  } catch (error) {
    console.error("Error updating procurement item:", error.message);
    res.status(500).json({
      message: "Error updating procurement item",
      details: error.message,
    });
  }
});

// Delete a procurement by pr_no (MUST be after all more specific delete routes)
router.delete("/:pr_no", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { pr_no } = req.params;

    // Fetch procurement details before deletion for logging purposes
    const procurementDetails = await knex("procurements")
      .where("pr_no", pr_no)
      .first();

    if (!procurementDetails) {
      return res.status(404).json({ error: "Procurement not found" });
    }

    // Delete all items associated with this procurement
    await knex("procurement_items").where("pr_no", pr_no).del();

    // Delete the procurement
    const deletedCount = await knex("procurements").where("pr_no", pr_no).del();

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Procurement could not be deleted." });
    }

    // Log the deletion
    const changes = {
      deleted_procurement: procurementDetails,
    };
    await logChange(token, "procurements", "DELETE", pr_no, changes);

    // Respond with success message
    res.status(200).json({ message: "Procurement deleted successfully." });
  } catch (error) {
    console.error("Error deleting procurement:", error);
    res.status(500).json({
      error: "Error deleting procurement.",
      details: error.message,
    });
  }
});

export default router;
