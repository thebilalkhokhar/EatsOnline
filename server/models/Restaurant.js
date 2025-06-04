const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Restaurant name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin is required"],
    },
    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, required: [true, "City is required"] },
      country: { type: String, trim: true, default: "Pakistan" },
      postalCode: {
        type: String,
        trim: true,
        match: [/^\d{5}$/, "Invalid postal code"],
        default: "",
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, "Contact phone is required"],
        match: [
          /^\+?923[0-4][0-9]{8}$/,
          "Please enter a valid Pakistani phone number (e.g., +923001234567 or 03001234567)",
        ],
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        default: "",
      },
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    deliveryAvailable: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmount: {
      type: Number,
      min: [0, "Minimum order amount cannot be negative"],
      default: 0,
    },
    averageDeliveryTime: {
      type: Number,
      min: [0, "Delivery time cannot be negative"],
      default: 30, // in minutes
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Review cannot exceed 500 characters"],
          default: "",
        },
        rating: { type: Number, min: 0, max: 5, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logo: {
      public_id: {
        type: String,
        required: true,
        default: "default-restaurant"
      },
      url: {
        type: String,
        required: true,
        default: "default-logo.jpg"
      }
    },
    cuisineType: {
      type: [String],
      default: [],
      set: function(cuisines) {
        if (typeof cuisines === 'string') {
          try {
            return JSON.parse(cuisines);
          } catch (e) {
            return cuisines.split(',').map(c => c.trim());
          }
        }
        return cuisines;
      }
    },
  },
  {
    timestamps: true,
  }
);

// Remove logoUrl when converting to JSON/Object
restaurantSchema.set('toJSON', {
  transform: function(doc, ret, opt) {
    delete ret.logoUrl;
    return ret;
  }
});

// Normalize phone number before save
restaurantSchema.pre("save", function (next) {
  if (this.isModified("contact.phone")) {
    let phone = this.contact.phone.trim();
    phone = phone.replace(/^(\+?92)/, "+92");
    if (phone.startsWith("0")) {
      phone = "+92" + phone.slice(1);
    } else if (!phone.startsWith("+92")) {
      phone = "+92" + phone;
    }
    if (!/^\+923[0-4][0-9]{8}$/.test(phone)) {
      return next(new Error("Invalid phone number format"));
    }
    this.contact.phone = phone;
  }

  // Clean up cuisineType array
  if (this.isModified("cuisineType")) {
    this.cuisineType = this.cuisineType
      .flat(Infinity)
      .filter(Boolean)
      .map(cuisine => {
        if (typeof cuisine === 'string') {
          try {
            return JSON.parse(cuisine);
          } catch (e) {
            return cuisine;
          }
        }
        return cuisine;
      })
      .flat(Infinity)
      .filter(Boolean);
  }

  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
