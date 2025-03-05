const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  category: { type: String, required: true },
  paymentId: { type: String, required: false },
  chestNumber: { type: Number, unique: false },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
