const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [
        /^\+?923[0-4][0-9]{8}$/,
        "Please enter a valid Pakistani phone number (e.g., +923001234567 or 923001234567)",
      ],
      unique: true,
      trim: true,
    },
    addresses: [
      {
        type: String,
        trim: true,
        default: "",
      },
    ],
    role: {
      type: String,
      enum: {
        values: ["admin", "customer"],
        message: "Role must be either 'admin' or 'customer'",
      },
      default: "customer",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password hash before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Normalize phone number before save
userSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    let phone = this.phone.trim();
    phone = phone.replace(/^(\+?92)/, "+92");
    if (phone.startsWith("0")) {
      phone = "+92" + phone.slice(1);
    } else if (!phone.startsWith("+92")) {
      phone = "+92" + phone;
    }
    if (!/^\+923[0-4][0-9]{8}$/.test(phone)) {
      return next(new Error("Invalid phone number format"));
    }
    this.phone = phone;
  }
  next();
});

// Password compare method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
