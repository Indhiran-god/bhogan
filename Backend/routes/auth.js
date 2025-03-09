const express = require("express");
const { body, validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: Generate Chest Number (Auto-Increment)
const getNextChestNumber = async () => {
  const lastUser = await User.findOne().sort({ chestNumber: -1 });
  return lastUser ? lastUser.chestNumber + 1 : 1000; // Start from 1000
};

// Helper: Send Confirmation Email
const sendConfirmationEmail = async (user) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Polo Marathon Registration Confirmation",
      text: `
Hello ${user.name},

Thank you for registering for the Polo Marathon!

✅ Your Chest Number: ${user.chestNumber}

Event Details:
- Date: 16-03-2025
- Venue: MOLAPALAYAM, Coimbatore

See you at the event!

Warm Regards,
Polo Marathon Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to: ${user.email}`);
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
  }
};

// 1️⃣ Create Razorpay Order
router.post("/createOrder", async (req, res) => {
  try {
    const options = {
      amount: 100, // 1 INR = 100 paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("🛒 Order Created:", order);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    res.status(500).json({ msg: "Error creating order", error: error.message });
  }
});

// 2️⃣ Register User (After Payment Verification)
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").isLength({ min: 10, max: 10 }).withMessage("Valid phone number is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, phone, age, gender, category, paymentId, orderId, signature } = req.body;

      // Log incoming data
      console.log("🔍 Incoming Registration Data:", req.body);

      if (!paymentId || paymentId === "N/A") {
        return res.status(400).json({ msg: "Invalid Payment ID. Registration failed." });
      }

      // ✅ Verify Razorpay Signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (generatedSignature !== signature) {
        console.error("❌ Invalid Signature:", { generatedSignature, signature });
        return res.status(400).json({ msg: "Payment verification failed: Invalid signature." });
      }

      // ✅ Fetch and Check Payment Status
      const payment = await razorpay.payments.fetch(paymentId);
      console.log("🔎 Payment Status:", payment.status);

      if (payment.status !== "captured") {
        return res.status(400).json({ msg: "Payment verification failed: Payment not captured." });
      }

      // ✅ Generate Chest Number
      const chestNumber = await getNextChestNumber();

      // ✅ Save User Data in Database
      const newUser = new User({
        name,
        email,
        phone,
        age,
        gender,
        category,
        paymentId,
        chestNumber,
      });

      await newUser.save();
      console.log("✅ User Registered Successfully:", newUser);

      // ✅ Send Confirmation Email
      await sendConfirmationEmail(newUser);

      return res.status(201).json({
        msg: "User registered successfully after payment.",
        chestNumber: newUser.chestNumber,
      });
    } catch (error) {
      console.error("❌ Error saving user or sending email:", error);
      res.status(500).json({ msg: "Server error", error: error.message });
    }
  }
);

module.exports = router;

