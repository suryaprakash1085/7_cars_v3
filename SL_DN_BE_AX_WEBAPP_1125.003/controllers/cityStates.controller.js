import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve("assets/city_state.json");

const readData = () => JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
const writeData = (data) => fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

export async function getAllCitiesAndStates(req, res) {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read data" });
  }
}

export async function addStateOrCity(req, res) {
  const { state, city } = req.body;
  if (!state) return res.status(400).json({ error: "State is required" });

  try {
    const data = readData();
    if (!data[state]) data[state] = [];
    if (city && !data[state].includes(city)) data[state].push(city);
    writeData(data);
    res.json({ message: "Added successfully", data });
  } catch (err) {
    res.status(500).json({ error: "Failed to add" });
  }
}

export async function updateCity(req, res) {
  const { state, oldCity, newCity } = req.body;
  if (!state || !oldCity || !newCity) return res.status(400).json({ error: "Missing fields" });

  try {
    const data = readData();
    if (!data[state]) return res.status(404).json({ error: "State not found" });
    const idx = data[state].indexOf(oldCity);
    if (idx === -1) return res.status(404).json({ error: "City not found" });
    data[state][idx] = newCity;
    writeData(data);
    res.json({ message: "City updated", data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
}

export async function deleteCity(req, res) {
  const { state, city } = req.body;
  if (!state || !city) return res.status(400).json({ error: "Missing fields" });

  try {
    const data = readData();
    if (!data[state]) return res.status(404).json({ error: "State not found" });
    data[state] = data[state].filter((c) => c !== city);
    writeData(data);
    res.json({ message: "City deleted", data });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
}

export async function deleteState(req, res) {
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: "State is required" });

  try {
    const data = readData();
    if (!data[state]) return res.status(404).json({ error: "State not found" });
    delete data[state];
    writeData(data);
    res.json({ message: "State deleted", data });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
}
