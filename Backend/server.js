require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const Razorpay = require("razorpay");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 8000;

// Enhanced Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      frameSrc: ["https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https://i.postimg.cc"],
    }
  }
}));

// CORS Configuration
const allowedOrigins = [
  "https://bhogan.vercel.app",
  "https://bhogan-hpdi.vercel.app",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(allowed => 
      origin === allowed ||
      origin.startsWith(`${allowed}/`) ||
      origin.replace(/\/$/, "") === allowed.replace(/\/$/, "")
    )) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization", "X-Response-Time"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API Endpoints
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date(),
    origin: req.headers.origin,
    allowedOrigins
  });
});

app.get("/get-razorpay-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post("/createOrder", async (req, res) => {
  try {
    const amount = 100; // ₹1 = 100 paise (fixed amount)
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `order_${Date.now()}`
    });
    res.status(201).json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({
      error: "Payment processing failed",
      details: process.env.NODE_ENV === "development" ? error.message : null
    });
  }
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🔒 CORS allowed origins:", allowedOrigins);
});


