import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";
import { generateSupplierId } from "../utils/idGenerator.js";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";

const knex = knexLib(knexConfig);

export async function createSupplier(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const updateData = {};

  if (req.body.supplier_name) updateData.name = req.body.supplier_name;
  if (req.body.gst_number) updateData.gst_number = req.body.gst_number;
  if (req.body.contact) {
    if (req.body.contact.phone) updateData.phone = req.body.contact.phone;
    if (req.body.contact.address) {
      if (req.body.contact.address.street)
        updateData.street = req.body.contact.address.street;
      if (req.body.contact.address.city)
        updateData.city = req.body.contact.address.city;
      if (req.body.contact.address.state)
        updateData.state = req.body.contact.address.state;
      if (req.body.contact.address.zip)
        updateData.zip = req.body.contact.address.zip;
    }
    if (req.body.contact.email) updateData.email = req.body.contact.email;
  }

  if (
    !updateData.name ||
    !updateData.phone ||
    !updateData.street ||
    !updateData.city ||
    !updateData.state
  ) {
    return res.status(400).json({
      error: "Supplier name, phone, street, city, and state are required",
    });
  }

  try {
    if (updateData.gst_number) {
      const existingSupplier = await knex("suppliers")
        .where({ gst_number: updateData.gst_number })
        .first();

      if (existingSupplier) {
        return res.status(400).json({
          error: "A supplier with this GST number already exists",
        });
      }
    }

    const existingPhone = await knex("suppliers")
      .where({ phone: updateData.phone })
      .first();

    if (existingPhone) {
      return res.status(400).json({
        error: "A supplier with this phone number already exists",
      });
    }

    const supplierId = await generateSupplierId();

    await knex("suppliers").insert({
      supplier_id: supplierId,
      ...updateData,
    });

    await logChange(token, "suppliers", "INSERT", supplierId, updateData);

    res.send({ supplier_id: supplierId });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error creating supplier",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

export async function searchSupplier(req, res) {
  const { search } = req.query;

  try {
    let query = knex("suppliers").select(
      "suppliers.supplier_id",
      "suppliers.gst_number",
      "suppliers.name",
      "suppliers.phone",
      "suppliers.email",
      "suppliers.street",
      "suppliers.city",
      "suppliers.state",
      "suppliers.zip"
    );

    if (search) {
      query = query.andWhere(function () {
        this.where("suppliers.name", "like", `%${search}%`).orWhere(
          "suppliers.phone",
          "like",
          `%${search}%`
        );
      });
    }

    const supplier = await query;

    if (supplier.length === 0) {
      return res.status(404).send({ error: "No matching suppliers found" });
    }

    res.status(200).send(supplier);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching suppliers",
      details: error.message,
    });
  }
}

export async function getAllSuppliers(req, res) {
  try {
    const suppliers = await knex("suppliers").select(
      "suppliers.supplier_id",
      "suppliers.name",
      "suppliers.gst_number",
      "suppliers.phone",
      "suppliers.street as supplier_street",
      "suppliers.city as supplier_city",
      "suppliers.state as supplier_state",
      "suppliers.zip as supplier_zip",
      "suppliers.email"
    );

    const formattedSuppliers = suppliers.reduce((acc, curr) => {
      let supplier = acc.find((c) => c.supplier_id === curr.supplier_id);
      if (!supplier) {
        supplier = {
          supplier_id: curr.supplier_id,
          name: curr.name,
          gst_number: curr.gst_number,
          contact: {
            email: curr.email,
            phone: curr.phone,
            address: {
              street: curr.supplier_street,
              city: curr.supplier_city,
              state: curr.supplier_state,
              zip: curr.supplier_zip,
            },
          },
        };
        acc.push(supplier);
      }
      return acc;
    }, []);

    res.status(200).send(formattedSuppliers);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching suppliers",
      details: error.message,
    });
  }
}

export async function getSupplierById(req, res) {
  try {
    const supplier = await knex("suppliers")
      .select(
        "suppliers.supplier_id",
        "suppliers.name",
        "suppliers.gst_number",
        "suppliers.phone",
        "suppliers.street as supplier_street",
        "suppliers.city as supplier_city",
        "suppliers.state as supplier_state",
        "suppliers.zip as supplier_zip",
        "suppliers.email"
      )
      .where("suppliers.supplier_id", req.params.id);

    if (supplier.length === 0) {
      return res.status(404).send({ error: "supplier not found" });
    }

    const formattedSupplier = {
      supplier_id: supplier[0].supplier_id,
      supplier_name: supplier[0].name,
      gst_number: supplier[0].gst_number,
      contact: {
        phone: supplier[0].phone,
        email: supplier[0].email,
        address: {
          street: supplier[0].supplier_street,
          city: supplier[0].supplier_city,
          state: supplier[0].supplier_state,
          zip: supplier[0].supplier_zip,
        },
      },
    };

    res.status(200).send(formattedSupplier);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching supplier",
      details: error.message,
    });
  }
}

export async function updateSupplier(req, res) {
  const { id } = req.params;
  const updateData = req.body;
  const finalData = {
    gst_number: updateData.gst_number || "",
    name: updateData.supplier_name,
    phone: updateData.contact.phone,
    email: updateData.contact.email || "",
    street: updateData.contact.address.street || "",
    city: updateData.contact.address.city || "",
    state: updateData.contact.address.state || "",
    zip: updateData.contact.address.zip || "",
  };

  try {
    const currentSupplier = await knex("suppliers")
      .where({ supplier_id: id })
      .first();

    if (!currentSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await knex("suppliers").where({ supplier_id: id }).update(finalData);

    if (updateData.outstanding > 0) {
      await knex("finance")
        .where({ customer_id: id })
        .update({ credit: updateData.outstanding });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    await logChange(token, "suppliers", "UPDATE", id, finalData);

    res.status(200).json({ message: "Supplier updated successfully" });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({
      error: "Error updating supplier",
      details: error.message,
    });
  }
}

export async function bulkUploadSuppliers(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const userRole = decoded.role;

  let successCount = 0;
  let failureCount = 0;
  let duplicatePhoneCount = 0;
  let duplicateGstCount = 0;
  let failedSuppliers = [];

  try {
    const suppliers = req.body.suppliers;
    if (!Array.isArray(suppliers)) {
      return res.status(400).json({ error: "Expected an array of suppliers" });
    }

    await Promise.all(
      suppliers.map(async (supplier) => {
        const updateData = {};

        if (supplier["Supplier Name"])
          updateData.name = supplier["Supplier Name"];
        if (supplier["GST Number"])
          updateData.gst_number = supplier["GST Number"];
        if (supplier.Phone) updateData.phone = supplier.Phone;
        if (supplier.Email) updateData.email = supplier.Email;
        if (supplier["Street Address"])
          updateData.street = supplier["Street Address"];
        if (supplier.City) updateData.city = supplier.City;
        if (supplier.State) updateData.state = supplier.State;
        if (supplier["Zip Code"]) updateData.zip = supplier["Zip Code"];

        if (
          !updateData.name ||
          !updateData.phone ||
          !updateData.street ||
          !updateData.city ||
          !updateData.state
        ) {
          failureCount++;
          const missingFields = [];
          if (!updateData.name) missingFields.push("name");
          if (!updateData.phone) missingFields.push("phone");
          if (!updateData.street) missingFields.push("street");
          if (!updateData.city) missingFields.push("city");
          if (!updateData.state) missingFields.push("state");

          failedSuppliers.push({
            ...supplier,
            reason: `Missing required field(s): ${missingFields.join(", ")}`,
          });
          return;
        }

        if (updateData.gst_number) {
          const existingSupplier = await knex("suppliers")
            .where({ gst_number: updateData.gst_number })
            .first();
          if (existingSupplier) {
            duplicateGstCount++;
            failureCount++;
            failedSuppliers.push({
              ...supplier,
              reason: "Duplicate GST number",
            });
            return;
          }
        }

        const existingPhone = await knex("suppliers")
          .where({ phone: updateData.phone })
          .first();
        if (existingPhone) {
          duplicatePhoneCount++;
          failureCount++;
          failedSuppliers.push({
            ...supplier,
            reason: "Duplicate phone number",
          });
          return;
        }

        const supplierId = await generateSupplierId();
        await knex("suppliers").insert({
          supplier_id: supplierId,
          ...updateData,
        });

        let outstanding_amount = supplier["Outstanding Amount"] || "";
        if (outstanding_amount && typeof outstanding_amount != "number") {
          let description = `Outstanding amount for supplier ${supplierId} (Upload from excel)`;
          await knex("finance").insert({
            customer_id: supplierId,
            status: "pending",
            expense_type: "credit",
            description: description,
            credit: outstanding_amount,
            creation_date: new Date(new Date().setHours(0, 0, 0, 0))
              .toISOString()
              .split("T")[0],
          });
        }

        await logChange(token, "suppliers", "INSERT", supplierId, updateData);
        successCount++;
      })
    );

    res.status(201).json({
      message: "Suppliers processed successfully",
      summary: {
        success: successCount,
        failed: failureCount,
        duplicatePhone: duplicatePhoneCount,
        duplicateGst: duplicateGstCount,
        failedSuppliers: failedSuppliers,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Error processing suppliers",
      details: error.message,
    });
  }
}

export async function deleteSupplier(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    const supplierDetails = await knex("suppliers")
      .where("supplier_id", id)
      .first();

    if (!supplierDetails) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const deletedCount = await knex("suppliers").where("supplier_id", id).del();

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Supplier could not be deleted" });
    }

    const changes = {
      deleted_supplier: supplierDetails,
    };
    await logChange(token, "suppliers", "DELETE", id, changes);

    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({
      error: "Error deleting supplier.",
      details: error.message,
    });
  }
}

export async function addVehicleToSupplier(req, res) {
  const supplier_id = req.params.supplier_id;
  const vehicleData = req.body.vehicles[0];

  if (!vehicleData.vin || !vehicleData.plate_number) {
    return res.status(400).json({ error: "VIN and plate number are required" });
  }

  let plateNumber = vehicleData.plate_number;
  if (plateNumber === "For Registration") {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    plateNumber = `For-Regn-${randomNum}`;
  }

  try {
    const newVehicle = await knex("vehicles").insert({
      make: vehicleData.make,
      vehicle_id: plateNumber,
      model: vehicleData.model,
      year: vehicleData.year,
      fuel_type: vehicleData.fuelType,
      vin: vehicleData.vin,
      plate_number: plateNumber,
      supplier_id,
    });

    res.status(201).json({ message: "Vehicle added successfully", newVehicle });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({
      error: "Error adding vehicle",
      details: error.message,
    });
  }
}

export async function downloadSupplierTemplate(req, res) {
  try {
    const templateData = [
      {
        "Supplier Name": "ABC Suppliers Ltd",
        "GST Number": "27AAFCU5055K1Z0",
        Phone: "9876543210",
        Email: "contact@abcsuppliers.com",
        "Street Address": "123 Business Street",
        City: "Mumbai",
        State: "Maharashtra",
        "Zip Code": "400001",
        "Outstanding Amount": "",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    const columnWidths = [
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Auto_Doc_Cockpit_Supplier-Template.xlsx"
    );

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    res.send(buffer);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({
      error: "Error generating supplier template",
      details: error.message,
    });
  }
}
