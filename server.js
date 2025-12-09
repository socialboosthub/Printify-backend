import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.PRINTIFY_API_KEY;

// Auto-detect store ID from Printify
async function getStoreId() {
  const res = await fetch("https://api.printify.com/v1/shops.json", {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });

  const stores = await res.json();
  if (stores.length === 0) throw new Error("No stores found in Printify");
  return stores[0].id; // Automatically use the first store
}

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const storeId = await getStoreId();

    const url = `https://api.printify.com/v1/shops/${storeId}/products.json`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const storeId = await getStoreId();

    const url = `https://api.printify.com/v1/shops/${storeId}/products/${req.params.id}.json`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(10000, () => console.log("Backend running on port 10000"));
