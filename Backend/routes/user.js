const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Get All Users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Users Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Get User by Email
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Fetch User Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Delete User by Email
router.delete("/:email", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
