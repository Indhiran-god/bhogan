require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "https://bhogan.vercel.app", // Allow frontend origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Razorpay Key Endpoint
app.get("/get-razorpay-key", (req, res) => {
  res.json({ 
    key: process.env.RAZORPAY_KEY_ID,
    currency: "INR"
  });
});

// Order Creation Endpoint
app.post("/createOrder", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        code: "INVALID_AMOUNT",
        msg: "Amount must be a valid number"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Math.abs(amount) * 100), // Convert to paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("❌ Razorpay Error:", error.error || error);
    res.status(500).json({
      code: "PAYMENT_GATEWAY_ERROR",
      msg: "Error creating payment order",
      error: process.env.NODE_ENV === "development" ? error.error : undefined
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", {
    path: req.path,
    method: req.method,
    error: err.stack
  });

  res.status(500).json({
    code: "INTERNAL_ERROR",
    msg: "An unexpected error occurred",
    reference: Date.now().toString(36)
  });
});

// Server Startup
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || "development"}`);
});

