const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ── Helper: Generate JWT Token ────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // Token valid for 7 days
  );
};

// ── @route   POST /api/auth/register ─────────────────────────────────────────
// ── @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email and password" });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 3. Hash the password (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Handle profile picture (from file upload or URL)
    let profilePicture = "";
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    } else if (req.body.profilePicture) {
      profilePicture = req.body.profilePicture;
    }

    // 5. Create new user in database
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePicture,
    });

    // 6. Generate JWT token
    const token = generateToken(user._id);

    // 7. Send response (never send password back)
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ── @route   POST /api/auth/login ─────────────────────────────────────────────
// ── @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Compare password with hashed password in DB
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ── @route   GET /api/users/me ────────────────────────────────────────────────
// ── @access  Protected
const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @route   PUT /api/users/me ────────────────────────────────────────────────
// ── @access  Protected
const updateMe = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name)        updates.name        = req.body.name;
    if (req.body.preferences) updates.preferences = req.body.preferences;

    // Profile picture: file upload takes priority over URL string
    if (req.file) {
      updates.profilePicture = `/uploads/${req.file.filename}`;
    } else if (req.body.avatar !== undefined) {
      updates.profilePicture = req.body.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("UpdateMe Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @route   PUT /api/users/change-password ───────────────────────────────────
// ── @access  Protected
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("ChangePassword Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };