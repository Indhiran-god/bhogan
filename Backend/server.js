require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Razorpay = require("razorpay");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enhanced CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://bhogan-hpdi.vercel.app",
    "https://bhogan.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-rtb-fingerprint-id"],
  exposedHeaders: ["x-rtb-fingerprint-id"]
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Improved MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Razorpay Key Endpoint
app.get("/get-razorpay-key", (req, res) => {
  res.header("Cache-Control", "no-store");
  res.json({ 
    key: process.env.RAZORPAY_KEY_ID,
    currency: "INR"
  });
});

// ✅ Order Creation Endpoint (Fixed Syntax)
app.post("/createOrder", async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {  // Fixed missing parenthesis
      return res.status(400).json({ 
        code: "INVALID_AMOUNT",
        msg: "Amount must be a valid number"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Math.abs(amount) * 100),
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
    console.error("❌ Razorpay Error:", error);
    res.status(500).json({
      code: "PAYMENT_GATEWAY_ERROR",
      msg: "Error creating payment order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// ✅ Enhanced Error Handling
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

// ✅ Server Startup
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || "development"}`);
});




