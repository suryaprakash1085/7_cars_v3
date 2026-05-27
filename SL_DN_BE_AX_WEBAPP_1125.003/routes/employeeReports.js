import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import authenticateToken from "../middleware/authenticate.js";

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();

export default router;
