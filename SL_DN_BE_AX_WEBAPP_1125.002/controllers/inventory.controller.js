import knexLib from "knex";
import knexConfig from "../knexfile.js";
import { generateInventoryId } from "../utils/idGenerator.js";
import logChange from "../middleware/changeLog.js";
import jwt from "jsonwebtoken";

const knex = knexLib(knexConfig);

export async function getAllInventory(req, res) {
  try {

  const { limit, offset } = req.query;

    //  get total count
    const [{ total }] = await knex("inventory")
      .where("is_deleted", false)
      .count("inventory_id as total");

    const inventoryItems = await knex("inventory")
      .where("is_deleted", false)
      .select("*")
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // const { limit = 10, offset = 0 } = req.query;

    // const inventoryItems = await knex("inventory")

    //   .select(
    //     "inventory.inventory_id",
    //     "inventory.part_name",
    //     "inventory.part_number",
    //     "inventory.description",
    //     "inventory.category",
    //     "inventory.quantity",
    //     "inventory.price",
    //     "inventory.uom",
    //     knex.raw("GROUP_CONCAT(DISTINCT orders.id) as order_ids"),
    //     knex.raw("GROUP_CONCAT(DISTINCT orders.date) as order_dates"),
    //     knex.raw(
    //       "GROUP_CONCAT(DISTINCT orders.supplier_id) as order_supplier_ids"
    //     ),
    //     knex.raw("GROUP_CONCAT(DISTINCT orders.quantity) as order_quantities"),
    //     knex.raw(
    //       "GROUP_CONCAT(DISTINCT inventory_suppliers.supplier_id) as supplier_ids"
    //     )
    //   )
    //   .leftJoin("orders", "inventory.inventory_id", "orders.inventory_id")
    //   .leftJoin(
    //     "inventory_suppliers",
    //     "inventory.inventory_id",
    //     "inventory_suppliers.inventory_id"
    //   )
    //   .whereNot("inventory.is_deleted", 1)
    //   .groupBy("inventory.inventory_id")
    //   .limit(parseInt(limit))
    //   .offset(parseInt(offset));

    const formattedItems = inventoryItems.map((item) => {
      const orderIds = item.order_ids ? item.order_ids.split(",") : [];
      const orderDates = item.order_dates ? item.order_dates.split(",") : [];
      const orderSupplierIds = item.order_supplier_ids
        ? item.order_supplier_ids.split(",")
        : [];
      const orderQuantities = item.order_quantities
        ? item.order_quantities.split(",")
        : [];
      const suppliers = item.supplier_ids ? item.supplier_ids.split(",") : [];

      const orders = orderIds.map((id, index) => ({
        _id: id,
        date: new Date(orderDates[index]).toISOString(),
        supplier_id: orderSupplierIds[index],
        quantity: parseInt(orderQuantities[index], 10),
      }));

      return {
        _id: item.inventory_id,
        inventory_id: item.inventory_id,
        part_name: item.part_name,
        part_number: item.part_number,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        uom: item.uom,
        orders,
        suppliers,
        price: parseFloat(item.price),
        buying_price: parseFloat(item.buying_price) || 0,
      };
    });

    // res.status(200).json(formattedItems);

// return with total
    res.status(200).json({
      total: parseInt(total),
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: formattedItems,
    });


  } catch (error) {
    res.status(500).json({
      error: "Error fetching inventory items",
      details: error.message,
    });
  }
}



export async function getInventoryExcelDownload(req, res) {
  try {
    const inventoryItems = await knex("inventory")
      .select(
        "inventory.inventory_id",
        "inventory.part_name",
        "inventory.part_number",
        "inventory.description",
        "inventory.category",
        "inventory.quantity",
        "inventory.price",
        "inventory.uom",
        knex.raw("GROUP_CONCAT(DISTINCT orders.id) as order_ids"),
        knex.raw("GROUP_CONCAT(DISTINCT orders.date) as order_dates"),
        knex.raw(
          "GROUP_CONCAT(DISTINCT orders.supplier_id) as order_supplier_ids"
        ),
        knex.raw("GROUP_CONCAT(DISTINCT orders.quantity) as order_quantities"),
        knex.raw(
          "GROUP_CONCAT(DISTINCT inventory_suppliers.supplier_id) as supplier_ids"
        )
      )
      .leftJoin("orders", "inventory.inventory_id", "orders.inventory_id")
      .leftJoin(
        "inventory_suppliers",
        "inventory.inventory_id",
        "inventory_suppliers.inventory_id"
      )
      .whereNot("inventory.is_deleted", 1)
      .groupBy("inventory.inventory_id");

    const formattedItems = inventoryItems.map((item) => {
      const orderIds = item.order_ids ? item.order_ids.split(",") : [];
      const orderDates = item.order_dates ? item.order_dates.split(",") : [];
      const orderSupplierIds = item.order_supplier_ids
        ? item.order_supplier_ids.split(",")
        : [];
      const orderQuantities = item.order_quantities
        ? item.order_quantities.split(",")
        : [];
      const suppliers = item.supplier_ids ? item.supplier_ids.split(",") : [];

      const orders = orderIds.map((id, index) => ({
        _id: id,
        date: new Date(orderDates[index]).toISOString(),
        supplier_id: orderSupplierIds[index],
        quantity: parseInt(orderQuantities[index], 10),
      }));

      return {
        _id: item.inventory_id,
        inventory_id: item.inventory_id,
        part_name: item.part_name,
        part_number: item.part_number,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        uom: item.uom,
        orders,
        suppliers,
        price: parseFloat(item.price),
        buying_price: parseFloat(item.buying_price) || 0,
      };
    });

    res.status(200).json(formattedItems);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching inventory items",
      details: error.message,
    });
  }
}

export async function searchInventory(req, res) {
  try {
    const { limit = 50, offset = 0, search, filter } = req.query;

    const inventoryQuery = knex("inventory")
      .where("inventory.is_deleted", false)
      .select(
        "inventory.inventory_id",
        "inventory.part_name",
        "inventory.part_number",
        "inventory.description",
        "inventory.category",
        "inventory.quantity",
        "inventory.price",
        "inventory.buying_price",
        "inventory.gst",
        "inventory.uom",
        knex.raw("GROUP_CONCAT(DISTINCT orders.id) as order_ids"),
        knex.raw("GROUP_CONCAT(DISTINCT orders.date) as order_dates"),
        knex.raw(
          "GROUP_CONCAT(DISTINCT orders.supplier_id) as order_supplier_ids"
        ),
        knex.raw("GROUP_CONCAT(DISTINCT orders.quantity) as order_quantities"),
        knex.raw(
          "GROUP_CONCAT(DISTINCT inventory_suppliers.supplier_id) as supplier_ids"
        )
      )
      .leftJoin("orders", "inventory.inventory_id", "orders.inventory_id")
      .leftJoin(
        "inventory_suppliers",
        "inventory.inventory_id",
        "inventory_suppliers.inventory_id"
      )
      .groupBy("inventory.inventory_id")
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (search && search !== "All") {
      inventoryQuery.where((builder) => {
        builder
          .where("inventory.inventory_id", "like", search)
          .orWhere("inventory.description", "like", `%${search}%`)
          .orWhere("inventory.part_name", "like", `%${search}%`)
          .orWhere("inventory.part_number", "like", `%${search}%`);
      });
    }

    if (filter && filter !== "All") {
      inventoryQuery.andWhere("inventory.category", filter);
    }

    const inventoryItems = await inventoryQuery;

    const formattedItems = inventoryItems.map((item) => {
      const orderIds = item.order_ids ? item.order_ids.split(",") : [];
      const orderDates = item.order_dates ? item.order_dates.split(",") : [];
      const orderSupplierIds = item.order_supplier_ids
        ? item.order_supplier_ids.split(",")
        : [];
      const orderQuantities = item.order_quantities
        ? item.order_quantities.split(",")
        : [];
      const suppliers = item.supplier_ids ? item.supplier_ids.split(",") : [];

      const orders = orderIds.map((id, index) => ({
        _id: id,
        date: new Date(orderDates[index]).toISOString(),
        supplier_id: orderSupplierIds[index],
        quantity: parseInt(orderQuantities[index], 10),
      }));

      return {
        _id: item.inventory_id,
        inventory_id: item.inventory_id,
        part_name: item.part_name,
        part_number: item.part_number,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        gst: item.gst,
        uom: item.uom,
        orders,
        suppliers,
        price: parseFloat(item.price),
        buying_price: parseFloat(item.buying_price) || 0,
      };
    });

    res.status(200).json(formattedItems);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    res.status(500).json({
      error: "Error fetching inventory items",
      details: error.message,
    });
  }
}

export async function getInventoryById(req, res) {
  try {
    const { id } = req.params;
    const item = await knex("inventory").where({ inventory_id: id, is_deleted: false }).first();

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const responseItem = {
      _id: item.inventory_id,
      inventory_id: item.inventory_id,
      part_name: item.part_name,
      part_number: item.part_number,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      uom: item.uom,
      price: parseFloat(item.price),
      buying_price: parseFloat(item.buying_price) || 0,
    };

    res.status(200).json(responseItem);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching inventory item",
      details: error.message,
    });
  }
}

export async function createInventory(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const newItem = req.body;
    const existingItem = await knex("inventory")
      .where("part_name", newItem.part_name)
      .first();

    if (existingItem) {
      // Return existing item instead of throwing error (idempotent behavior)
      // This allows the frontend to reuse items that already exist in inventory
      return res.status(200).json({
        inventory_id: existingItem.inventory_id,
        part_name: existingItem.part_name,
        part_number: existingItem.part_number,
        description: existingItem.description,
        category: existingItem.category,
        quantity: existingItem.quantity,
        price: existingItem.price,
        buying_price: existingItem.buying_price || 0,
        uom: existingItem.uom,
        gst: existingItem.gst,
      });
    }

    const inventory_id = await generateInventoryId();
    await knex("inventory").insert({
      inventory_id,
      ...newItem,
      uom: newItem.uom,
      buying_price: newItem.buying_price || 0,
      is_deleted: false,
      gst: newItem.gst,
    });

    await logChange(token, "inventory", "INSERT", inventory_id, newItem);

    res.status(201).send({ inventory_id, ...newItem });
  } catch (error) {
    res.status(500).json({
      error: "Error creating inventory item",
      details: error.message,
    });
  }
}

export async function bulkUploadInventory(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let result = {
    newItemAdded: 0,
    existingItemUpdated: 0,
    failedInventory: [],
  };

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userRole = decoded.role;
    const items = req.body.items;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Expected an array of items" });
    }

    const inventoryIds = await Promise.all(
      items.map(async (item) => {
        const existingItem = await knex("inventory")
          .where("part_name", item.part_name)
          .first();

        const isAdmin = userRole === "Admin" || userRole === "admin";
        const description = isAdmin
          ? `Initial Upload-${item.description}`
          : `RE-${item.description || ""}`;

        const transData = {
          transaction_type: "Buy",
          transaction_date: req.tzHelpers ? req.tzHelpers.getCurrentDate() : new Date(),
          quantity: item.quantity,
          description,
        };

        if (existingItem) {
          const updatedData = {
            quantity: existingItem.quantity + item.quantity,
            price: item.price,
            buying_price: item.buying_price || existingItem.buying_price || 0,
            category: item.category,
            hsncode: item.HSNCode,
            gst: item.gst,
            uom: item.uom,
            description: item.description || existingItem.description,
          };

          await knex("inventory")
            .where("inventory_id", existingItem.inventory_id)
            .update(updatedData);

          result.existingItemUpdated++;
          transData.inventory_id = existingItem.inventory_id;

          await knex("transactions").insert(transData);
          return existingItem.inventory_id;
        } else if (!existingItem) {
          const inventory_id = await generateInventoryId();
          await knex("inventory").insert({
            inventory_id,
            ...item,
            is_deleted: false,
          });

          result.newItemAdded++;
          transData.inventory_id = inventory_id;

          await knex("transactions").insert(transData);
          await logChange(token, "inventory", "INSERT MANY", inventory_id, item);

          return inventory_id;
        } else {
          result.failedInventory.push(item);
          return null;
        }
      })
    );

    res.status(201).json({ message: "Items processed successfully", result });
  } catch (error) {
    console.error("Error processing bulk upload:", error.message);
    res.status(500).json({
      error: "Error processing inventory items",
      details: error.message,
    });
  }
}

export async function updateInventory(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  let userRole;
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    userRole = decoded.role;
    userId = decoded.user_id;
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  try {
    const { id } = req.params;
    const updatedItem = req.body;

    if (!updatedItem || Object.keys(updatedItem).length === 0) {
      return res.status(400).json({ error: "No data provided for update" });
    }

    const existingItem = await knex("inventory")
      .where({ inventory_id: id })
      .first();

    if (!existingItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const quantityChange =
      parseInt(updatedItem.quantity) - parseInt(existingItem.quantity);
    const transactionData = {
      transaction_type: quantityChange > 0 ? "Buy" : "Sell",
      transaction_date: req.tzHelpers ? req.tzHelpers.getCurrentDate() : new Date(),
      quantity: Math.abs(quantityChange),
      inventory_id: id,
      description: userId + "-" + existingItem.description,
    };

    await knex.transaction(async (trx) => {
      if (quantityChange !== 0) {
        await trx("transactions").insert(transactionData);
      }
      await trx("inventory")
        .where({ inventory_id: id })
        .update({
          ...updatedItem,
          uom: updatedItem.uom,
        });
    });

    res.status(200).json({ inventory_id: id, ...updatedItem });
  } catch (error) {
    res.status(500).json({
      error: "Error updating inventory item",
      details: error.message,
    });
  }
}

export async function deleteInventory(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;
    const isUsed = await knex("items_required").where({ item_id: id }).first();


    // if (isUsed) {
    //   return res
    //     .status(404)
    //     .json({ error: "Inventory item is used in a service." });
    //     console.log("Attempted to delete inventory item used in a service:", error);
    // } else {


    // if (isUsed) {
    //   return res
    //     .status(404)
    //     .json({ error: "Inventory item is used in a service." });
    // } else {

    const inventoryDetails = await knex("inventory")
      .where({ inventory_id: id })
      .first();

    if (!inventoryDetails) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const deletedCount = await knex("inventory")
      .where({ inventory_id: id })
      .update({ is_deleted: true });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Inventory item could not be deleted." });
    }

    const changes = {
      deleted_inventory_item: inventoryDetails,
    };
    await logChange(token, "inventory", "DELETE", id, changes);

    res.status(200).json({ message: "Inventory item deleted successfully." });
  }
  // }
  catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({
      error: "Error deleting inventory item.",
      details: error.message,
    });
  }
}

export async function updateInventoryQuantity(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { id } = req.params;
    const { received_quantity } = req.body;

    if (received_quantity === undefined) {
      return res.status(400).json({ error: "Received quantity is required" });
    }

    const currentInventory = await knex("inventory")
      .where({ inventory_id: id })
      .first();

    if (!currentInventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const newQuantity = parseInt(currentInventory.quantity) + received_quantity;

    await knex("inventory")
      .where({ inventory_id: id })
      .update({ quantity: newQuantity });

    res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Error updating inventory quantity",
      details: error.message,
    });
  }
}

export async function decreaseInventoryQuantity(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { id } = req.params;
    const { received_quantity } = req.body;

    if (received_quantity === undefined) {
      return res.status(400).json({ error: "Received quantity is required" });
    }

    const currentInventory = await knex("inventory")
      .where({ inventory_id: id })
      .first();

    if (!currentInventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const newQuantity =
      currentInventory.qty != 0
        ? parseInt(currentInventory.quantity) - received_quantity
        : 0;

    await knex("inventory")
      .where({ inventory_id: id })
      .update({ quantity: newQuantity });

    res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Error updating inventory quantity",
      details: error.message,
    });
  }
}

//   ENHANCED: Reconcile inventory balance from transactions
// This endpoint recalculates inventory.quantity based on transactions
// Formula: SUM(Received + Buy) - SUM(Consumed) for each inventory item
// Transaction types considered:
//   - Received: items received/purchased
//   - Buy/Purchase: items ordered (now treated as received when purchased)
//   - Consumed: items used/consumed
//   - Added: items added back to stock
//   - Reverse: items returned to inventory
export async function reconcileInventoryBalance(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    // Get all inventory items
    const inventoryItems = await knex("inventory")
      .select("inventory_id")
      .whereNot("is_deleted", 1);

    const reconciliationResults = [];

    for (const item of inventoryItems) {
      const itemId = item.inventory_id;

      // Calculate sum of Received transactions
      const receivedSum = await knex("transactions")
        .where("inventory_id", itemId)
        .andWhere("transaction_type", "Received")
        .sum("quantity as total")
        .first();

      // Calculate sum of Purchase/Buy transactions
      const purchaseSum = await knex("transactions")
        .where("inventory_id", itemId)
        .whereIn("transaction_type", ["Purchase", "Buy"])
        .sum("quantity as total")
        .first();

      // Calculate sum of Added/Reverse transactions (items added back to stock)
      const addedSum = await knex("transactions")
        .where("inventory_id", itemId)
        .whereIn("transaction_type", ["Added", "Reverse"])
        .sum("quantity as total")
        .first();

      // Calculate sum of Consumed transactions
      const consumedSum = await knex("transactions")
        .where("inventory_id", itemId)
        .andWhere("transaction_type", "Consumed")
        .sum("quantity as total")
        .first();

      // Calculate net available quantity
      const receivedQty = receivedSum?.total || 0;
      const purchaseQty = purchaseSum?.total || 0;
      const addedQty = addedSum?.total || 0;
      const consumedQty = consumedSum?.total || 0;

      // Formula: (Received + Purchase + Added) - Consumed
      // Note: In modern flow, Purchase + Received can both exist for shortage scenarios
      const calculatedQuantity = Math.max(0, (receivedQty + purchaseQty + addedQty) - consumedQty);

      // Get current inventory quantity
      const currentInventory = await knex("inventory")
        .where("inventory_id", itemId)
        .first();

      const oldQuantity = currentInventory.quantity;

      // Update inventory if mismatch exists
      if (oldQuantity !== calculatedQuantity) {
        await knex("inventory")
          .where("inventory_id", itemId)
          .update({ quantity: calculatedQuantity });

        // Log the reconciliation
        const changes = {
          reconciliation: {
            old_quantity: oldQuantity,
            new_quantity: calculatedQuantity,
            received_total: receivedQty,
            purchase_total: purchaseQty,
            added_total: addedQty,
            consumed_total: consumedQty,
            formula: "SUM(Received + Purchase + Added) - SUM(Consumed)",
          },
        };
        await logChange(
          token,
          "inventory",
          "RECONCILE",
          itemId,
          changes
        );

        reconciliationResults.push({
          inventory_id: itemId,
          part_name: currentInventory.part_name,
          old_quantity: oldQuantity,
          new_quantity: calculatedQuantity,
          received_total: receivedQty,
          purchase_total: purchaseQty,
          added_total: addedQty,
          consumed_total: consumedQty,
          status: "reconciled",
        });
      } else {
        reconciliationResults.push({
          inventory_id: itemId,
          part_name: currentInventory.part_name,
          quantity: calculatedQuantity,
          received_total: receivedQty,
          purchase_total: purchaseQty,
          added_total: addedQty,
          consumed_total: consumedQty,
          status: "correct",
        });
      }
    }

    res.status(200).json({
      message: "Inventory reconciliation completed",
      results: reconciliationResults,
      total_items: reconciliationResults.length,
      reconciled_items: reconciliationResults.filter(r => r.status === "reconciled").length,
    });
  } catch (error) {
    console.error("Error reconciling inventory balance:", error);
    res.status(500).json({
      error: "Error reconciling inventory balance",
      details: error.message,
    });
  }
}
