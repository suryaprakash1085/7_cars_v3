import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getCustomerByPhone(phone) {
  return knex("customers")
    .where({ phone })
    .first();
}

export async function createCustomer(customerData) {
  return knex("customers").insert(customerData);
}

export async function deleteCustomerById(customerId) {
  return knex("customers")
    .where({ customer_id: customerId })
    .del();
}

export async function getCustomerDetails(customerId) {
  return knex("customers")
    .where({ customer_id: customerId })
    .first();
}

export async function getPaginatedCustomers(limit, offset) {
  const customerIdQuery = knex("customers")
    .select("customer_id")
    .whereNotIn("type", ["Lead", "Blocklisted"])
    .orderBy("created_at", "desc");

  if (limit !== undefined || offset !== undefined) {
    customerIdQuery
      .limit(parseInt(limit) || 10)
      .offset(parseInt(offset) || 0);
  }

  return customerIdQuery;
}

export async function getCustomerWithVehicles(customerIds) {
  return knex("customers")
    .leftJoin("vehicles", "customers.customer_id", "vehicles.customer_id")
    .select(
      "customers.customer_id",
      "customers.customer_name",
      "customers.advance_payment",
      "customers.created_at",
      "customers.updated_at",
      "customers.phone",
      "customers.leads_owner",
      "customers.type",
      "customers.street as customer_street",
      "customers.city as customer_city",
      "customers.state as customer_state",
      "customers.pin_code",
      "vehicles.vehicle_id",
      "vehicles.make",
      "vehicles.model",
      "vehicles.year",
      "vehicles.vin",
      "vehicles.fuel_type"
    )
    .whereIn("customers.customer_id", customerIds);
}

export async function getCustomerById(customerId) {
  return knex("customers")
    .leftJoin("vehicles", "customers.customer_id", "vehicles.customer_id")
    .select(
      "customers.leads_owner",
      "customers.customer_id",
      "customers.customer_name",
      "customers.gst_number",
      "customers.advance_payment",
      "customers.created_at",
      "customers.updated_at",
      "customers.phone",
      "customers.prefix",
      "customers.email",
      "customers.street as customer_street",
      "customers.city as customer_city",
      "customers.state as customer_state",
      "customers.pin_code",
      "customers.reference",
      "customers.referred_by",
      "vehicles.vehicle_id",
      "vehicles.plate_number",
      "vehicles.make",
      "vehicles.model",
      "vehicles.year",
      "vehicles.vin",
      "vehicles.fuel_type",
      "vehicles.registration_date",
      "vehicles.engine_number",
      "vehicles.chassis_number"
    )
    .where("customers.customer_id", customerId);
}

export async function updateCustomer(customerId, updateData) {
  return knex("customers")
    .where({ customer_id: customerId })
    .update(updateData);
}

export async function createConvertToCustomer(conversionData) {
  return knex("convert_to_customer").insert(conversionData);
}

export async function getConvertToCustomer(customerId) {
  return knex("convert_to_customer")
    .where({ customer_id: customerId })
    .first();
}

export async function getCustomerAdvancePayment(customerId) {
  return knex("customers")
    .where({ customer_id: customerId })
    .select("advance_payment")
    .first();
}

export async function updateAdvancePayment(customerId, advancePayment) {
  return knex("customers")
    .where({ customer_id: customerId })
    .update({
      advance_payment: advancePayment
    });
}

export async function searchCustomers(search, filter) {
  let query = knex("customers")
    .select(
      "customers.type",
      "customers.customer_id",
      "customers.customer_name",
      "customers.phone",
      "customers.email",
      "customers.street",
      "customers.city",
      "customers.state",
      "customers.pin_code",
      "customers.reference",
      "customers.prefix",
      "customers.leads_owner",
      "customers.gst_number"
    );

  if (filter && filter !== "All") {
    query = query.where("customers.type", filter);
  }

  if (search) {
    query = query.where(function () {
      this.where("customers.customer_name", "like", `%${search}%`).orWhere(
        "customers.phone",
        "like",
        `%${search}%`
      );
    });
  }

  return query;
}

export async function getLeads(limit, offset, type) {
  let query = knex("customers").select(
    "customers.type",
    "customers.customer_id",
    "customers.customer_name",
    "customers.phone",
    "customers.street",
    "customers.city",
    "customers.state",
    "customers.leads_owner",
    "reference",
    "referred_by",
    "leads_owner",
    "prefix"
  );

  if (type && type !== "all") {
    query = query.where("customers.type", type);
  } else {
    query = query.whereNotIn("customers.type", [
      "Customer",
      "Customer Sales",
      "Customer Service",
    ]);
  }

  query.limit(parseInt(limit)).offset(parseInt(offset));

  return query;
}

export async function getTelecallerLeads(limit, offset, userId) {
  return knex("customers")
    .select(
      "customers.customer_id",
      "customers.customer_name",
      "customers.phone",
      "customers.street",
      "customers.city",
      "customers.state",
      "customers.telecall",
      "customers.type"
    )
    .where("customers.leads_owner", userId)
    .whereNot("customers.type", "BlackList")
    .orderByRaw(
      `
        CASE
          WHEN customers.telecall IS NULL OR customers.telecall = '' THEN 3 
          WHEN JSON_UNQUOTE(
            JSON_EXTRACT(customers.telecall, 
              CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
            )
          ) IS NULL OR JSON_UNQUOTE(
            JSON_EXTRACT(customers.telecall, 
              CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
            )
          ) = '' THEN 3 
          WHEN JSON_UNQUOTE(
            JSON_EXTRACT(customers.telecall, 
              CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
            )
          ) = CURDATE() THEN 0 
          WHEN JSON_UNQUOTE(
            JSON_EXTRACT(customers.telecall, 
              CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
            )
          ) < CURDATE() THEN 1 
          ELSE 2 
        END
      `
    )
    .orderByRaw(
      `
        JSON_UNQUOTE(
          JSON_EXTRACT(
            customers.telecall, 
            CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
          )
        ) ASC
      `
    )
    .limit(parseInt(limit))
    .offset(parseInt(offset));
}

export async function searchLeads(search, filter, limit, offset) {
  let query = knex("customers")
    .select("customers.*")
    .whereIn("customers.type", ["Lead", "BlackList"]);

  if (filter && filter !== "All") {
    query = query.andWhere("customers.type", filter);
  }

  if (search) {
    query = query.andWhere(function () {
      this.where("customers.customer_name", "like", `%${search}%`).orWhere(
        "customers.phone",
        "like",
        `%${search}%`
      );
    });
  }

  query = query.limit(parseInt(limit)).offset(parseInt(offset));

  return query;
}

export async function searchTelecallerLeads(search, filter) {
  let query = knex("customers")
    .select(
      "customers.type",
      "customers.customer_id",
      "customers.customer_name",
      "customers.phone",
      "customers.street",
      "customers.city",
      "customers.state",
      "customers.telecall",
      "customers.leads_owner"
    )
    .whereNot("customers.type", "Blocklisted");

  if (filter) {
    query = query.andWhere("customers.type", filter);
  }

  if (search) {
    query = query.andWhere(function () {
      this.where("customers.customer_name", "like", `%${search}%`).orWhere(
        "customers.phone",
        "like",
        `%${search}%`
      );
    });
  }

  query = query.orderBy(
    knex.raw(
      `STR_TO_DATE(
        JSON_UNQUOTE(
          JSON_EXTRACT(
            customers.telecall,
            CONCAT('$[', JSON_LENGTH(customers.telecall) - 1, '].scheduledDate')
          )
        ), '%d-%m-%Y'
      )`
    ),
    "desc"
  );

  return query;
}

export async function getCustomersTotal(type) {
  let query = knex("customers");

  if (type === "all") {
    return query.count("* as count").first();
  } else if (type === "leads") {
    return query.where("customers.type", "Lead").count("* as count").first();
  } else if (type === "blacklisted") {
    return query.where("customers.type", "Blocklisted").count("* as count").first();
  } else if (type === "customers") {
    return query.where("customers.type", "Customer").count("* as count").first();
  }
}

export async function updateCustomerName(customerId, customerName) {
  return knex("customers")
    .where({ customer_id: customerId })
    .update({ customer_name: customerName });
}
