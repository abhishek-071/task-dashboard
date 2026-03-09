const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  res.status(201).json({ message: "User registered successfully" });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Name is required" });
  }

  req.user.name = name;
  await req.user.save();

  res.json({
    message: "Profile updated successfully",
    user: req.user
  });
};

// const bcrypt = require("bcryptjs");

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const isMatch = await bcrypt.compare(oldPassword, req.user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  if (newPassword.length < 6) {
  return res.status(400).json({ message: "Password must be at least 6 characters" });
}

const strongRegex = /^(?=.*[A-Z])(?=.*[0-9]).+$/;

if (!strongRegex.test(newPassword)) {
  return res.status(400).json({
    message: "Password must contain at least 1 uppercase letter and 1 number"
  });
}

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  req.user.password = hashedPassword;
  await req.user.save();

  res.json({ message: "Password changed successfully" });
};

const crypto = require("crypto");

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  res.json({
    message: "Password reset token generated",
    resetToken
  });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
};