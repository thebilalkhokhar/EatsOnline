const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of name and restaurantId
categorySchema.index({ name: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
