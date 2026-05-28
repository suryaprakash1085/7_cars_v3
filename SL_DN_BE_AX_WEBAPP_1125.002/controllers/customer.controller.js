import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";
import { body, validationResult } from "express-validator";
import { generateCustomId } from "../utils/idGenerator.js";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import * as customerModel from "../models/customer.model.js";

const knex = knexLib(knexConfig);

export async function addLeads(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  console.log(req.body);

  const duplicate = await customerModel.getCustomerByPhone(req.body.phone);
  if (duplicate) {
    return res.status(400).send({ error: "Phone Number Already Exists" });
  }

  const {
    customer_name,
    phone,
    street,
    city,
    state,
    type,
    prefix,
    reference,
    referred_by,
    leads_owner,
  } = req.body;

  const customerId = await generateCustomId("CUST");

  await customerModel.createCustomer({
    customer_id: customerId,
    customer_name: customer_name,
    phone: phone,
    street,
    city,
    state,
    type,
    prefix,
    reference,
    referred_by,
    leads_owner,
  });

  const newCustomer = {
    customer_id: customerId,
    customer_name,
    phone,
    street,
    city,
    prefix,
    state,
    type,
    reference,
    referred_by,
    leads_owner,
  };

  console.log({ custId: newCustomer });

  await logChange(token, "customers", "INSERT", customerId, newCustomer);

  res.status(201).send({ customer_id: customerId });
}

export async function deleteCustomer(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { customer_id } = req.params;

    // Fetch the customer details before deletion for logging purposes
    const customerDetails = await customerModel.getCustomerDetails(customer_id);

    if (!customerDetails) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Delete the customer
    const deletedCustomer = await customerModel.deleteCustomerById(customer_id);

    if (!deletedCustomer) {
      return res.status(404).json({ error: "Customer could not be deleted" });
    }

    // Log the deletion
    const changes = {
      deleted_customer: customerDetails,
    };
    await logChange(token, "customers", "DELETE", customer_id, changes);

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      error: "Error deleting customer",
      details: error.message,
    });
  }
}

export async function bulkUploadLeads(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const fileBuffer = req.file.buffer;
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    const customerSheet = workbook.Sheets[workbook.SheetNames[0]];
    const vehicleSheet = workbook.Sheets[workbook.SheetNames[1]];

    const rawCustomers = XLSX.utils.sheet_to_json(customerSheet, { header: 1 });
    const rawVehicles = XLSX.utils.sheet_to_json(vehicleSheet, { header: 1 });

    const customers = rawCustomers
      .slice(5)
      .map((row) => ({
        customer_name: row[1],
        phone: row[2],
        street: row[3],
        city: row[4],
        state: row[5],
        type: row[0],
        gst_number: row[6],
        leads_owner: row[7],
      }))
      .filter((customer) => customer.phone);

    const vehicles = rawVehicles
      .slice(4)
      .map((row) => ({
        phone: row[0],
        plate_number: row[1],
        vehicle_id: row[1],
        make: row[2],
        model: row[3],
        vin: row[4],
        year: row[5],
        fuel_type: row[6],
        engine_number: row[7],
        chassis_number: row[8],
        registration_date: row[9],
      }))
      .filter((vehicle) => vehicle.phone);

    let result = {
      success: 0,
      failed: 0,
      duplicate: 0,
      insufficient: 0,
      failedDetails: {},
    };

    let phoneNumbersInExcel = [];
    let failedCustomers = [];
    let failedVehicles = [];

    const customerIds = await Promise.all(
      customers.map(async (item) => {
        let {
          customer_name,
          phone,
          street,
          city,
          state,
          type,
          gst_number,
          leads_owner,
        } = item;

        const phoneRegex = /^[6789]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          failedCustomers.push({ ...item, error: "Invalid phone number" });
          result.failed++;
          return null;
        }

        gst_number = gst_number ? String(gst_number).toUpperCase() : null;

        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[A-Z0-9A-Z]{1}$/;
        if (gst_number && !gstRegex.test(gst_number)) {
          failedCustomers.push({ ...item, error: "Invalid GST number" });
          result.failed++;
          return null;
        }

        customer_name = customer_name
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());

        const existingCustomer = await customerModel.getCustomerByPhone(phone);

        console.log({ existingCustomer });

        if (existingCustomer || phoneNumbersInExcel.includes(phone)) {
          failedCustomers.push({ ...item, error: "Duplicate phone number" });
          result.failed++;
          result.duplicate++;
          return null;
        }

        phoneNumbersInExcel.push(phone);

        result.success++;

        const customerId = await generateCustomId("CUST");
        await customerModel.createCustomer({
          customer_id: customerId,
          customer_name,
          phone,
          street,
          city,
          state,
          type,
          gst_number,
          leads_owner,
        });

        await logChange(token, "customers", "INSERT MANY", customerId);
        return customerId;
      })
    );

    const currentYear = req.tzHelpers
      ? parseInt(req.tzHelpers.format(new Date(), "YYYY"), 10)
      : new Date().getFullYear();

    await Promise.all(
      vehicles.map(async (vehicle) => {
        let { phone, plate_number, engine_number, chassis_number, year } =
          vehicle;

        plate_number = plate_number?.toUpperCase();
        console.log({ plate_number });

        const plateRegex = /^[A-Z]{2}\d{2,3}[A-Z]{0,2}\d{4}$/;
        if (!plateRegex.test(plate_number)) {
          failedVehicles.push({ ...vehicle, error: "Invalid plate number" });
          console.log(`Invalid plate number: ${plate_number}`);
          return null;
        }

        if (year > currentYear) {
          failedVehicles.push({ ...vehicle, error: "Invalid year" });
          console.log(
            `Invalid year: ${year} (Year should not be greater than ${currentYear})`
          );
          return null;
        }

        const existingCustomer = await customerModel.getCustomerByPhone(phone);

        if (existingCustomer) {
          const vehicleExists = await knex("vehicles")
            .where({ vehicle_id: vehicle.vehicle_id })
            .first();

          if (!vehicleExists) {
            await knex("vehicles").insert({
              customer_id: existingCustomer.customer_id,
              vehicle_id: vehicle.vehicle_id,
              plate_number,
              make: vehicle.make,
              model: vehicle.model,
              vin: vehicle.vin,
              year,
              fuel_type: vehicle.fuel_type,
              registration_date: vehicle.registration_date,
              engine_number,
              chassis_number,
            });
          } else {
            failedVehicles.push({
              ...vehicle,
              error: "Vehicle already exists",
            });
          }
        } else {
          failedVehicles.push({ ...vehicle, error: "No matching customer" });
        }
      })
    );

    result.failedDetails = { failedCustomers, failedVehicles };
    console.log({ result: result.failedDetails });

    res.status(201).send(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: "Error creating customers and vehicles",
      details: error.message,
    });
  }
}

export async function createCustomer(req, res) {
  console.log({ req: req.body });
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.body.one_time == false) {
    const duplicate = await customerModel.getCustomerByPhone(req.body.contact.phone);
    if (duplicate) {
      return res.status(400).send({ error: "Phone Number Already Exists" });
    }
  }

  try {
    const customerId = await generateCustomId("CUST");

    const addCustomer = {
      leads_owner: req.body.leads_owner,
      customer_id: customerId,
      customer_name: req.body.customer_name,
      gst_number: req.body.gst_number || "",
      email: req.body.contact.email || "",
      phone: req.body.contact.phone,
      street: req.body.contact.address.street,
      city: req.body.contact.address.city,
      state: req.body.contact.address.state,
      reference: req.body.reference || "",
      referred_by: req.body.referred_by || "",
      prefix: req.body.prefix || "",
    };

    let vehid = null;

    await knex.transaction(async (trx) => {

      //   Only require vehicle for non-counterSales
      if (req.body.sales_type !== "counterSales") {
        if (!req.body.vehicles || req.body.vehicles.length === 0) {
          throw new Error("At least one vehicle is required");
        }
      }

      // 1️⃣ Insert Customer
      await trx("customers").insert(addCustomer);

      // 2️⃣ Insert Vehicles only if provided
      if (req.body.vehicles && req.body.vehicles.length > 0) {
        await Promise.all(
          req.body.vehicles.map(async (vehicle) => {
            let plateNumber = vehicle.plate_number;
            if (plateNumber === "For Registration") {
              const randomNum = Math.floor(1000 + Math.random() * 9000);
              plateNumber = `For-Regn-${randomNum}`;
            }

            let makeModelEntry = await trx("vehiclesmake")
              .where({ make_name: vehicle.make })
              .first();

            let make_id;

            if (!makeModelEntry) {
              const [insertedMakeModel] = await trx("vehiclesmake")
                .insert({ make_name: vehicle.make, models: vehicle.model })
                .returning(["make_id"]);
              make_id = insertedMakeModel.make_id;
            } else {
              make_id = makeModelEntry.make_id;
              let existingModels = makeModelEntry.models
                ? makeModelEntry.models.split(",")
                : [];

              if (!existingModels.includes(vehicle.model)) {
                existingModels.push(vehicle.model);
                await trx("vehiclesmake")
                  .where({ make_name: vehicle.make })
                  .update({ models: existingModels.join(",") });
              }
            }

            const addVehicle = {
              vehicle_id: plateNumber,
              customer_id: customerId,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              fuel_Type: vehicle.fuelType,
              vin: vehicle.vin,
              plate_number: plateNumber,
              chassis_number: vehicle.chassis_number,
              engine_number: vehicle.engine_number,
              registration_date: vehicle.registration_date,
            };

            vehid = plateNumber;

            await trx("vehicles").insert(addVehicle);

            return addVehicle;
          })
        );
      }

    });

    // Log AFTER transaction succeeds
    await logChange(token, "customers", "INSERT", customerId, addCustomer);

    res.status(201).send({ customer_id: customerId, vehicle_id: vehid });

  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).send({ error: "Error creating customer", details: error.message });
  }
}




export async function getTotal(req, res) {
  try {
    const totalCount = await knex("customers").count("* as count").first(); // Count all customers
    const leadCount = await knex("customers")
      .where("type", "Lead")
      .count("* as count")
      .first(); // Count customers of type Lead
    const customerCount = await knex("customers")
      .where("type", "Customer")
      .count("* as count")
      .first();
    const blacklistedcount = await knex("customers")
      .where("type", "BlackList")
      .count("* as count")
      .first();

    res.status(200).send({
      total: parseInt(totalCount.count),
      leads: parseInt(leadCount.count),
      customer: parseInt(customerCount.count),
      blacklistedcount: parseInt(blacklistedcount.count),
    });
  } catch (error) {
    res.status(500).send({
      error: "Error fetching total count",
      details: error.message,
    });
  }
};



export async function getLeads(req, res) {
  try {
    const { limit = 10, offset = 0, type } = req.query;

    console.log({ type });

    const customers = await customerModel.getLeads(limit, offset, type);

    console.log({ customers });

    res.status(200).send(customers);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Error fetching customers", details: error.message });
  }
}

export async function getTelecallerLeads(req, res) {
  try {
    const { limit = 10, offset = 0, userId } = req.query;

    if (!userId) {
      return res.status(400).send({ error: "userId is required" });
    }

    console.log({ userId });

    const customers = await customerModel.getTelecallerLeads(limit, offset, userId);

    res.status(200).send(customers);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Error fetching customers", details: error.message });
  }
}

export async function getAllCustomers(req, res) {
  try {
    const { limit, offset } = req.query;

    const paginatedCustomers = await customerModel.getPaginatedCustomers(limit, offset);
    const customerIds = paginatedCustomers.map((c) => c.customer_id);

    if (customerIds.length === 0) {
      return res.status(200).send([]);
    }

    const customers = await customerModel.getCustomerWithVehicles(customerIds);

    const formattedCustomers = customers.reduce((acc, curr) => {
      let customer = acc.find((c) => c.customer_id === curr.customer_id);
      if (!customer) {
        customer = {
          customer_id: curr.customer_id,
          customer_name: curr.customer_name,
          advance_payment: curr.advance_payment,
          created_at: curr.created_at,
          updated_at: curr.updated_at,
          leads_owner: curr.leads_owner,
          contact: {
            phone: curr.phone,
            type: curr.type,
            address: {
              street: curr.customer_street,
              city: curr.customer_city,
              state: curr.customer_state,
              pin: curr.pin_code,
            },
          },
          vehicles: [],
        };
        acc.push(customer);
      }
      if (curr.vehicle_id) {
        customer.vehicles.push({
          vehicle_id: curr.vehicle_id,
          make: curr.make,
          model: curr.model,
          year: curr.year,
          vin: curr.vin,
          fuelType: curr.fuel_type,
        });
      }
      return acc;
    }, []);

    res.status(200).send(formattedCustomers);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching customers",
      details: error.message,
    });
  }
}

export async function updateAdvancePayment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const { advance_payment } = req.body;
  const customerId = req.params.id;

  if (typeof advance_payment !== "number" || advance_payment < 0) {
    return res
      .status(400)
      .json({ error: "Advance payment must be a non-negative number" });
  }

  try {
    const current = await customerModel.getCustomerAdvancePayment(customerId);

    if (!current) {
      return res.status(404).send({ error: "Customer not found" });
    }

    const newAdvancePayment = advance_payment + parseFloat(current.advance_payment);

    await customerModel.updateAdvancePayment(customerId, newAdvancePayment);

    let change = {
      message: `Changed Advanced Payment from ${current.advance_payment} to ${newAdvancePayment}`,
    };

    await logChange(token, "customers", "UPDATE", customerId, change);

    res.status(200).send({ message: "Advance payment updated successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      error: "Error updating advance payment",
      details: error.message,
    });
  }
}

export async function updateAdvancePaymentDirect(req, res) {
  const { advance_payment } = req.body;

  try {
    const updated = await customerModel.updateAdvancePayment(req.params.id, advance_payment);

    res.status(200).send({ message: "Advance payment updated successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      error: "Error updating advance payment",
      details: error.message,
    });
  }
}

export async function searchCustomers(req, res) {
  const { search, filter } = req.query;

  try {
    console.log("Search query:", search, "Filter applied:", filter);

    const customers = await customerModel.searchCustomers(search, filter);

    if (customers.length === 0) {
      return res.status(404).send({ error: "No matching customers found" });
    }

    // Fetch vehicles for each customer
    const customersWithVehicles = await Promise.all(
      customers.map(async (customer) => {
        const vehicles = await knex("vehicles")
          .where("customer_id", customer.customer_id)
          .select("vehicle_id", "plate_number", "make", "model", "year");

        return {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          contact: {
            phone: customer.phone,
            email: customer.email || "",
            address: {
              street: customer.street,
              city: customer.city,
              state: customer.state,
              pinCode: customer.pin_code,
            },
          },
          type: customer.type,
          prefix: customer.prefix,
          reference: customer.reference,
          leads_owner: customer.leads_owner,
          gst_number: customer.gst_number,
          vehicles: vehicles || [],
        };
      })
    );

    res.status(200).send(customersWithVehicles);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).send({
      error: "Error fetching customers",
      details: error.message,
    });
  }
}

export async function searchLeads(req, res) {
  const { search, filter, limit = 10, offset = 0 } = req.query;
  console.log(req.query);

  try {
    const results = await customerModel.searchLeads(search, filter, limit, offset);

    console.log(results);

    if (results.length === 0) {
      return res.status(404).send({ error: "No matching records found" });
    }

    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching records",
      details: error.message,
    });
  }
}

export async function searchTelecallerLeads(req, res) {
  const { search, filter } = req.query;
  console.log({ data: req.query });

  try {
    const customers = await customerModel.searchTelecallerLeads(search, filter);

    const formattedCustomers = customers.map((customer) => {
      const telecallArray = JSON.parse(customer.telecall || "[]");
      const latestTelecall =
        telecallArray.length > 0 ? telecallArray[telecallArray.length - 1] : {};
      return {
        ...customer,
        telecall: latestTelecall,
      };
    });

    if (formattedCustomers.length === 0) {
      return res.status(404).send({ error: "No matching customers found" });
    }

    res.status(200).send(formattedCustomers);
  } catch (error) {
    res.status(500).send({
      error: "Error fetching customers",
      details: error.message,
    });
  }
}

export async function getCustomerById(req, res) {
  try {
    const customer = await customerModel.getCustomerById(req.params.id);

    if (customer.length === 0) {
      return res.status(404).send({ error: "Customer not found" });
    }

    const formattedCustomer = {
      customer_id: customer[0].customer_id,
      customer_name: customer[0].customer_name,
      leads_owner: customer[0].leads_owner,
      gst_number: customer[0].gst_number,
      advance_payment: customer[0].advance_payment,
      created_at: customer[0].created_at,
      updated_at: customer[0].updated_at,
      contact: {
        phone: customer[0].phone,
        email: customer[0].email,
        address: {
          street: customer[0].customer_street,
          city: customer[0].customer_city,
          state: customer[0].customer_state,
          pinCode: customer[0].pin_code,
        },
      },
      prefix: customer[0].prefix,
      reference: customer[0].reference,
      referred_by: customer[0].referred_by,
      vehicles: customer.map((vehicle) => ({
        vehicle_id: vehicle.vehicle_id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        fuelType: vehicle.fuel_type,
        plateNumber: vehicle.plate_number,
        registrationDate: vehicle.registration_date,
        engineNumber: vehicle.engine_number,
        chassisNumber: vehicle.chassis_number,
      })),
    };

    console.log({ formattedCustomer });

    res.status(200).send(formattedCustomer);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Error fetching customer", details: error.message });
  }
}

export async function updateCustomer(req, res) {
  try {
    console.log({ editReq: req.body });

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    const customerId = req.params.id;
    const newData = req.body;

    // Fetch current customer data
    const currentData = await customerModel.getCustomerDetails(customerId);
    if (!currentData) {
      return res.status(404).send({ error: "Customer not found" });
    }

    // Determine what has changed
    const changes = {};
    for (const key in newData) {
      if (currentData[key] !== newData[key]) {
        changes[key] = {
          old: currentData[key],
          new: newData[key],
        };
      }
    }

    // Log changes if any
    if (Object.keys(changes).length > 0) {
      await logChange(token, "customers", "UPDATE", customerId, changes);
    }

    // Update customer data
    const updated = await customerModel.updateCustomer(customerId, newData);
    if (!updated) {
      return res.status(500).send({ error: "Customer update failed" });
    }

    // Handle convert_to_customer table safely
    const isConverted = await customerModel.getConvertToCustomer(customerId);
    if (!isConverted) {
      // Only create conversion if leads_ownerId exists
      if (!newData.leads_ownerId) {
        console.warn("leads_ownerId missing, skipping conversion");
      } else {
        await customerModel.createConvertToCustomer({
          customer_id: customerId,
          customer_name: newData.customer_name || currentData.customer_name,
          leads_owner: newData.leads_ownerId,
          convert_date: req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().split("T")[0],
        });
      }
    }

    // Send response with changes
    res.status(200).send({
      message: "Customer updated successfully",
      changes,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}


export async function updateCustomerName(req, res) {
  try {
    console.log({ editReq: req.body });

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    const customerId = req.params.id;
    const newData = req.body;

    // Fetch current customer data
    const currentData = await customerModel.getCustomerDetails(customerId);
    if (!currentData) {
      return res.status(404).send({ error: "Customer not found" });
    }

    // Determine what has changed
    const changes = {};
    for (const key in newData) {
      if (currentData[key] !== newData[key]) {
        changes[key] = {
          old: currentData[key],
          new: newData[key]
        };
      }
    }

    // Log changes if any
    if (Object.keys(changes).length > 0) {
      await logChange(token, "customers", "UPDATE", customerId, changes);
    }

    // Update customer data in the database
    const updated = await customerModel.updateCustomer(customerId, newData);
    if (!updated) {
      return res.status(500).send({ error: "Customer update failed" });
    }

    // Handle convert_to_customer table safely
    const isConverted = await customerModel.getConvertToCustomer(customerId);
    if (!isConverted) {
      // Only create conversion if leads_ownerId exists
      if (!newData.leads_ownerId) {
        console.warn("leads_ownerId missing, skipping conversion");
      } else {
        await customerModel.createConvertToCustomer({
          customer_id: customerId,
          customer_name: newData.customer_name || currentData.customer_name,
          gst_number: newData.gst_number || currentData.gst_number,
          leads_owner: newData.leads_ownerId,
          convert_date: req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().split("T")[0]
        });
      }
    }

    // Send response with changes
    res.status(200).send({
      message: "Customer updated successfully",
      changes
    });

  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}


// export async function updateVehicle(req, res) {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];

//   try {
//     const vehicleId = req.params.id; // vehicle_id from URL
//     const { customer_id, vehicles } = req.body;

//     if (!vehicles || vehicles.length === 0) {
//       return res.status(400).json({ error: "Vehicle data is required" });
//     }

//     const vehicle = vehicles[0];

//     // Check if vehicle exists for this customer
//     const existingVehicle = await knex("vehicles")
//       .where({ vehicle_id: vehicleId, customer_id })
//       .first();

//     if (!existingVehicle) {
//       return res.status(404).json({
//         error: "Vehicle not found for this customer"
//       });
//     }

//     // Prepare updated data (do not overwrite vehicle_id)
//     const newData = {
//       customer_id,
//       make: vehicle.make,
//       model: vehicle.model,
//       year: vehicle.year,
//       vin: vehicle.vin,
//       plate_number: vehicle.plate_number,
//       fuel_type: vehicle.fuel_type || vehicle.fuelType,
//       registration_date: vehicle.registration_date || existingVehicle.registration_date,
//       chassis_number: vehicle.chassis_number ?? existingVehicle.chassis_number,
//       engine_number: vehicle.engine_number ?? existingVehicle.engine_number
//     };

//     // Update the database
//     await knex("vehicles")
//       .where({ vehicle_id: vehicleId, customer_id })
//       .update(newData);

//     // Log the update
//     await logChange(token, "vehicles", "UPDATE", vehicleId, newData);

//     res.status(200).json({
//       message: "Vehicle updated successfully",
//       updated: newData
//     });

//   } catch (error) {
//     console.error("Error updating vehicle:", error);
//     res.status(500).json({
//       error: "Error updating vehicle",
//       details: error.message
//     });
//   }
// }


export async function updateVehicle(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const trx = await knex.transaction();

  try {
    const vehicleId = req.params.id; // OLD plate_number
    const { customer_id, vehicles } = req.body;

    if (!vehicles || vehicles.length === 0) {
      await trx.rollback();
      return res.status(400).json({ error: "Vehicle data is required" });
    }

    const vehicle = vehicles[0];

    // 🔍 Get existing vehicle
    const existingVehicle = await trx("vehicles")
      .where({ vehicle_id: vehicleId, customer_id })
      .first();

    if (!existingVehicle) {
      await trx.rollback();
      return res.status(404).json({
        error: "Vehicle not found"
      });
    }

    const oldVehicleId = existingVehicle.vehicle_id;

    //   IMPORTANT: plate_number = vehicle_id
    const newVehicleId = vehicle.plate_number || oldVehicleId;

    console.log("OLD:", oldVehicleId);
    console.log("NEW:", newVehicleId);

    // 🔁 If plate_number (vehicle_id) changed
    if (newVehicleId !== oldVehicleId) {

      //   Update vehicles table ID
      await trx("vehicles")
        .where({ vehicle_id: oldVehicleId })
        .update({ vehicle_id: newVehicleId });

      //   Update appointments table
      const updatedAppointments = await trx("appointments")
        .where({ vehicle_id: oldVehicleId })
        .update({ vehicle_id: newVehicleId });

      console.log("Appointments updated:", updatedAppointments);
    }

    // 🧾 Update other fields
    const updateData = {
      customer_id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      plate_number: newVehicleId, // keep in sync
      fuel_type: vehicle.fuel_type || vehicle.fuelType,
      registration_date:
        vehicle.registration_date || existingVehicle.registration_date,
      chassis_number:
        vehicle.chassis_number ?? existingVehicle.chassis_number,
      engine_number:
        vehicle.engine_number ?? existingVehicle.engine_number
    };

    await trx("vehicles")
      .where({ vehicle_id: newVehicleId })
      .update(updateData);

    await logChange(token, "vehicles", "UPDATE", newVehicleId, updateData);

    await trx.commit();

    res.status(200).json({
      message: "Vehicle & Appointments updated successfully",
      vehicle_id: newVehicleId
    });

  } catch (error) {
    await trx.rollback();

    console.error(error);
    res.status(500).json({
      error: "Update failed",
      details: error.message
    });
  }
}


export async function deleteVehicle(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const vehicleId = req.params.id; // vehicle_id from URL

    // Check if vehicle exists
    const existingVehicle = await knex("vehicles")
      .where({ vehicle_id: vehicleId })
      .first();

    if (!existingVehicle) {
      return res.status(404).json({
        error: "Vehicle not found"
      });
    }

    // Delete the vehicle
    await knex("vehicles")
      .where({ vehicle_id: vehicleId })
      .del();

    // Log deletion
    await logChange(token, "vehicles", "DELETE", vehicleId, {});

    res.status(200).json({
      message: "Vehicle deleted successfully",
      deleted: { vehicle_id: vehicleId }
    });

  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      error: "Error deleting vehicle",
      details: error.message
    });
  }
}



export async function updateTelecallerLeads(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { id } = req.params;
    const newEntry = req.body;

    // Format current time HH:mm:ss
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    newEntry.currentTime = formattedTime;

    // Format scheduledDate into dd-mm-yyyy
    const dt = new Date(newEntry.scheduledDate);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    newEntry.scheduledDate = `${day}-${month}-${year}`;

    // Fetch customer record
    const customer = await knex("customers")
      .select("telecall")
      .where({ customer_id: id })
      .first();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Parse telecall array
    let telecallArray = [];
    if (customer.telecall) {
      try {
        telecallArray = JSON.parse(customer.telecall);
        if (!Array.isArray(telecallArray)) telecallArray = [];
      } catch {
        telecallArray = [];
      }
    }

    // Append new entry
    telecallArray.push(newEntry);

    // Track changes for logging
    let changes = {};
    if (JSON.stringify(customer.telecall) !== JSON.stringify(telecallArray)) {
      changes = {
        old: customer.telecall ? JSON.parse(customer.telecall) : [],
        new: telecallArray,
      };
    }

    // Update DB
    const updated = await knex("customers")
      .where({ customer_id: id })
      .update({
        telecall: JSON.stringify(telecallArray),
        type: newEntry.type,
      });

    if (updated) {
      // Log changes
      if (Object.keys(changes).length > 0) {
        await logChange(token, "customers", "UPDATE", id, changes);
      }

      return res.status(200).json({
        message: "Telecall updated successfully",
        telecall: telecallArray,
      });
    }

    return res.status(500).json({ error: "Failed to update Telecall" });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update Telecall",
      details: error.message,
    });
  }
}

export async function getCustomerComments(req, res) {
  try {
    const { customer_id } = req.params;

    const customer = await knex("customers")
      .where("customer_id", customer_id)
      .select("telecall")
      .first();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json(customer.telecall);
  } catch (error) {
    console.error("Error fetching telecall comments:", error.message);
    return res.status(500).json({
      error: "Failed to fetch comments",
      details: error.message,
    });
  }
}

export async function getCustomerVehicles(req, res) {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    console.log(`Fetching vehicles for customer_id: ${customer_id}`);

    // Step 1: Verify customer exists
    const customerExists = await knex("customers")
      .select("customer_id")
      .where("customer_id", customer_id)
      .first();

    if (!customerExists) {
      return res.status(404).json({
        error: `No customer found for ID: ${customer_id}`,
      });
    }

    // Step 2: Fetch vehicles
    const vehicles = await knex("vehicles")
      .select(
        "id",
        "vehicle_id",
        "customer_id",
        "make",
        "model",
        "year",
        "vin",
        "plate_number",
        "fuel_type",
        "registration_date",
        "chassis_number",
        "engine_number",
        "street"
      )
      .where("customer_id", customer_id);

    console.log("Query result:", vehicles);

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: `No vehicles found for customer_id: ${customer_id}`,
      });
    }

    return res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return res.status(500).json({
      error: "Error fetching vehicles",
      details: error.message,
    });
  }
}


export async function addCustomerVehicle(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    const { customer_id } = req.params;
    let vehicleData = req.body.vehicles?.[0];

    if (!vehicleData) {
      return res.status(400).json({ error: "Vehicle data is required" });
    }

    let plateNumber = vehicleData.plate_number;

    // Handle 'For Registration' special case
    if (plateNumber === "For Registration") {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      plateNumber = `For-Regn-${randomNum}`;
    }

    // Check if vehicle already exists
    const existingVehicle = await knex("vehicles")
      .where({ plate_number: plateNumber })
      .first();

    if (existingVehicle) {
      return res.status(409).json({
        error: "Vehicle already exists",
        message: "A vehicle with this plate number is already registered",
      });
    }

    // Check if make_name exists
    let makeModelEntry = await knex("vehiclesmake")
      .where({ make_name: vehicleData.make })
      .first();

    let make_id;

    if (!makeModelEntry) {
      // Insert new make entry
      const [insertedMakeModel] = await knex("vehiclesmake")
        .insert({
          make_name: vehicleData.make,
          models: vehicleData.model,
        })
        .returning(["make_id"]);

      make_id = insertedMakeModel.make_id;
    } else {
      make_id = makeModelEntry.make_id;

      // Convert to array
      let existingModels = makeModelEntry.models
        ? makeModelEntry.models.split(",")
        : [];

      // Add new model if not exists
      if (!existingModels.includes(vehicleData.model)) {
        existingModels.push(vehicleData.model);

        await knex("vehiclesmake")
          .where({ make_name: vehicleData.make })
          .update({ models: existingModels.join(",") });
      }
    }

    // Prepare vehicle data
    const addVehicle = {
      make: vehicleData.make,
      vehicle_id: plateNumber,
      model: vehicleData.model,
      year: vehicleData.year,
      fuel_type: vehicleData.fuelType,
      vin: vehicleData.vin,
      plate_number: plateNumber,
      customer_id,
      registration_date: vehicleData.registrationDate,
      chassis_number: vehicleData.chassisNumber,
      engine_number: vehicleData.engineNumber,
      // make_id, // Uncomment if you want to associate vehicle with make_id
    };

    // Insert into database
    await knex("vehicles").insert(addVehicle);

    // Log operation
    await logChange(token, "vehicles", "INSERT", plateNumber, addVehicle);

    return res.status(201).json({
      message: "Vehicle added successfully",
      vehicle: addVehicle,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return res.status(500).json({
      error: "Error adding vehicle",
      details: error.message,
    });
  }
}


export async function searchLeadsByOwner(req, res) {
  try {
    const { leads_owner } = req.query;

    if (!leads_owner) {
      return res.status(400).json({ error: "leads_owner is required" });
    }

    const customers = await knex("customers")
      .where("leads_owner", leads_owner)
      .where("type", "Lead") // Only get customers with type = 'Lead'
      .select("*");

    // if (!customers.length) {
    //   return res.status(404).json({ message: "No leads found for this leads_owner" });
    // }

    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};



export async function getLeadsOwnerName(req, res) {
  try {
    const { id } = req.params; //  Get ID from request parameters

    //  Fetch user from the database
    const user = await knex("userscollection")
      .where("user_id", id) //  Use the correc
      // t variable
      .select("username") //  Assuming "username" is the column you want
      .first(); //  Get the first match

    //  Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //  Return the username
    res.status(200).json({ username: user.username });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deductAdvancePayment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const { advance_payment } = req.body;
  const customerId = req.params.id;

  if (typeof advance_payment !== "number" || advance_payment < 0) {
    return res
      .status(400)
      .json({ error: "Advance payment must be a non-negative number" });
  }

  try {
    const current = await customerModel.getCustomerAdvancePayment(customerId);

    if (!current) {
      return res.status(404).send({ error: "Customer not found" });
    }

    const newAdvancePayment = parseFloat(current.advance_payment) - advance_payment;

    if (newAdvancePayment < 0) {
      return res.status(400).json({ error: "Insufficient advance payment balance" });
    }

    await customerModel.updateAdvancePayment(customerId, newAdvancePayment);

    let change = {
      message: `Deducted Advanced Payment from ${current.advance_payment} to ${newAdvancePayment}`,
    };

    await logChange(token, "customers", "UPDATE", customerId, change);

    res.status(200).send({ message: "Advance payment deducted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      error: "Error deducting advance payment",
      details: error.message,
    });
  }
}
