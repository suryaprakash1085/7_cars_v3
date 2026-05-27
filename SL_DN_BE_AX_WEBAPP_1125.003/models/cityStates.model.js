import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../assets/city_state.json");

export async function getCityStateData() {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export async function addCityState(data) {
  const currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  
  if (data.state) {
    if (!currentData[data.state]) {
      currentData[data.state] = [];
    }
    if (data.city && !currentData[data.state].includes(data.city)) {
      currentData[data.state].push(data.city);
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return currentData;
}

export async function renameCity(oldName, newName, state) {
  const currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  
  if (currentData[state]) {
    const index = currentData[state].indexOf(oldName);
    if (index > -1) {
      currentData[state][index] = newName;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return currentData;
}

export async function deleteCity(cityName, state) {
  const currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  
  if (currentData[state]) {
    currentData[state] = currentData[state].filter((city) => city !== cityName);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return currentData;
}

export async function deleteState(state) {
  const currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  delete currentData[state];
  fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
  return currentData;
}
