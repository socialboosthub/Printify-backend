import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = process.env.SHOP_ID;

app.get("/", (req, res) => {
  res.send("Printify Backend Running");
});

app.post("/create-order", async (req, res) => {
  try {
    const orderData = req.body;

    const response = await fetch(
      `https://api.printify.com/v1/shops/${SHOP_ID}/orders.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Order creation failed", details: err });
  }
});

app.listen(10000, () => console.log("Server running on port 10000"));
