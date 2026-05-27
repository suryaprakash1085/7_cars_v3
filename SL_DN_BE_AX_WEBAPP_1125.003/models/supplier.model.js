import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createSupplier(supplierData) {
  return knex("suppliers").insert(supplierData);
}

export async function getSupplierByGst(gstNumber) {
  return knex("suppliers").where({ gst_number: gstNumber }).first();
}

export async function getSupplierByPhone(phone) {
  return knex("suppliers").where({ phone }).first();
}

export async function getAllSuppliers() {
  return knex("suppliers").select(
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
}

export async function getSupplierById(supplierId) {
  return knex("suppliers")
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
    .where("suppliers.supplier_id", supplierId);
}

export async function searchSuppliers(search) {
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

  return query;
}

export async function updateSupplier(supplierId, updateData) {
  return knex("suppliers")
    .where({ supplier_id: supplierId })
    .update(updateData);
}

export async function updateSupplierOutstanding(supplierId, outstanding) {
  return knex("finance")
    .where({ customer_id: supplierId })
    .update({ credit: outstanding });
}

export async function deleteSupplier(supplierId) {
  return knex("suppliers")
    .where("supplier_id", supplierId)
    .del();
}

export async function getSupplierDetails(supplierId) {
  return knex("suppliers")
    .where("supplier_id", supplierId)
    .first();
}

export async function createFinanceEntry(financeData) {
  return knex("finance").insert(financeData);
}

export async function addVehicleToSupplier(vehicleData) {
  return knex("vehicles").insert(vehicleData);
}
