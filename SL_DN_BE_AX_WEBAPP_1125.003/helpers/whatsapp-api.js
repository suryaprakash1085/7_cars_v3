// helper/whatsappApi.js
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode-generator';
import { promises as fs } from 'fs'; // Use the promises-based API for fs
import knexLib from "knex";
import knexConfig from "../knexfile.js";
import fsSync from 'fs'; // Import the synchronous fs module

const knex = knexLib(knexConfig);

let clients = {};
let qrCodes = {}; // Store QR codes for each number
let isLoggingOut = {}; // Track which numbers are logging out

// Function to handle client creation and QR code generation
export const createClient = async (number, res) => {
  const { state, saveCreds } = await useMultiFileAuthState(`auth/${number}`);
  const client = makeWASocket({
    auth: state,
  });

  return new Promise((resolve, reject) => {
    let qrCodeSent = false;

    // Handle QR code event
    client.ev.on('qr', (qr) => {
      console.log('QR code event triggered');
      if (qrCodeSent) return;

      try {
        const qrCodeDataURL = QRCode(0, 'L');
        qrCodeDataURL.addData(qr);
        qrCodeDataURL.make();

        const qrCodeImage = qrCodeDataURL.createDataURL(4);
        qrCodes[number] = qrCodeImage;
        console.log('Generated QR Code:', qrCodeImage);

        if (!qrCodeSent && !res.headersSent) {
          console.log('Sending QR code to client');
          res.json({ qrCode: qrCodeImage });
          qrCodeSent = true;
          resolve();
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
        if (!res.headersSent) {
          res.status(500).send({ error: 'Failed to generate QR code' });
        }
        reject(err);
      }
    });

    // Connection update event handler
    client.ev.on('connection.update', (update) => {
      const { connection, qr } = update;

      if (connection === 'open') {
        console.log(`${number} logged in`);
        clients[number] = client;
        delete qrCodes[number];
        resolve();
      } else if (connection === 'close') {
        if (isLoggingOut[number]) {
          console.log(`${number} has logged out, skipping reconnection`);
          return;
        }

        console.error('Connection closed, attempting to reconnect...');
        delete clients[number];
        setTimeout(() => {
          console.log(`Attempting to reconnect for ${number}...`);
          createClient(number, res);
        }, 5000);
      } else if (qr) {
        if (!qrCodeSent && !res.headersSent) {
          const qrCodeDataURL = QRCode(0, 'L');
          qrCodeDataURL.addData(qr);
          qrCodeDataURL.make();

          const qrCodeImage = qrCodeDataURL.createDataURL(4);
          qrCodes[number] = qrCodeImage;

          console.log('Sending QR code to client from connection update');
          res.json({ qrCode: qrCodeImage });
          qrCodeSent = true;
          resolve();
        }
      }
    });

    // Save credentials whenever they are updated
    client.ev.on('creds.update', saveCreds);

    // Timeout for QR code generation
    setTimeout(() => {
      if (!qrCodeSent) {
        console.error('Timeout: QR code not generated in time');
        reject(new Error('QR code generation timed out'));
      }
    }, 30000); // 30 seconds timeout
  });
};

// Login function
export const login = async (req, res) => {
  let { number } = req.body;
  number = '91' + number;
  if (!number) {
    return res.status(400).send('Number is required');
  }

  if (clients[number]) {
    return res.json({ login_status: 'Session already open' });
  }

  if (qrCodes[number]) {
    console.log('Returning stored QR code');
    return res.json({ qrCode: qrCodes[number] });
  }

  await createClient(number, res);
};

// Logout function
export const logout = async (req, res) => {
  let { number } = req.body;
  number = '91' + number;

  if (!number || !clients[number]) {
    return res.status(400).send('Invalid number or session not found');
  }

  try {
    isLoggingOut[number] = true;
    await clients[number].logout();
    delete clients[number];
    console.log(`${number} logged out`);

    const authFilePath = `auth/${number}`;
    await fs.rm(authFilePath, { recursive: true, force: true });
    console.log(`${number} auth folder deleted`);

    return res.send('Logged out and credentials deleted');
  } catch (err) {
    console.error('Error during logout:', err);
    return res.status(500).send({ error: 'Failed to log out' });
  } finally {
    isLoggingOut[number] = false;
  }
};

// delete auth  for resetting...
export const reset = async (req, res) => {
  let { fromNumber } = req.body;
  // console.log(fromNumber)
  // checking if number exists
  if (fsSync.existsSync(`auth/91${fromNumber}`)) { // Use the synchronous fs.existsSync
    const authFilePath = `auth/91${fromNumber}`;
    await fs.rm(authFilePath, { recursive: true, force: true }); // Use promises-based fs for async operation
    res.status(200).send({ success: "deleted Successfully!!" });
  } else {
    res.status(404).send({ error: 'file Not found! , Try Again.' });
  }
};

// Send message function
export const sendMessage = async (req, res) => {
  let { fromNumber, toNumber, message } = req.body;
  fromNumber = '91' + fromNumber;
  toNumber = '91' + toNumber;
  message = message.trim();

  if (!fromNumber || !toNumber || !message) {
    return res.status(400).send('fromNumber, toNumber, and message are required');
  }

  const client = clients[fromNumber];
  if (!client) {
    return res.status(400).send('Session not found for fromNumber');
  }

  if (!client.user) {
    return res.status(400).send('Client is not ready');
  }

  try {
    console.log(`Sending message from ${fromNumber} to ${toNumber}: ${message}`);
    await client.sendMessage(`${toNumber}@c.us`, { text: message });
    res.send('Message sent');
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).send({ error: 'Failed to send message' });
  }
};

// Send file function
export const sendFile = async (req, res) => {
  let { fromNumber, toNumber, caption = null } = req.body;
  const file = req.file;

  console.log('Uploaded file:', file);

  fromNumber = '91' + fromNumber;
  toNumber = '91' + toNumber;

  if (!fromNumber || !toNumber || !file) {
    return res.status(400).send('fromNumber, toNumber, and file are required');
  }

  const client = clients[fromNumber];
  if (!client) {
    return res.status(400).send('Session not found for fromNumber');
  }

  try {
    console.log(`Sending file from ${fromNumber} to ${toNumber}`);
    await client.sendMessage(`${toNumber}@c.us`, {
      document: file.buffer,
      fileName: file.originalname || "something",
      mimetype: file.mimetype,
      caption: caption
    });

    res.send('File sent');
  } catch (err) {
    console.error('Error sending file:', err);
    res.status(500).send({ error: 'Failed to send file' });
  }
};