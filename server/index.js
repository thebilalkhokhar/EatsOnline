require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const { router: paymentRouter, webhook } = require('./routes/paymentRoutes');

const app = express();

// Configure Stripe webhook route before other middleware
app.post('/api/webhook', 
  express.raw({type: 'application/json'}), 
  webhook
);

// Middleware
app.use(express.json());
app.use(cors());

// Set CSP Header
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' https://js.stripe.com https://m.stripe.network; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com;"
  );
  next();
});

// CORS Configuration for all other routes
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// MongoDB Connection with Retry and Timeout
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds connect timeout
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
      console.error("MongoDB Connection Error:", err.message);
      console.log("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

connectWithRetry();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/admin/reports", require("./routes/reports"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api", paymentRouter);
app.use("/api/users", userRoutes);

// Fallback for debugging
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Error starting server: ${err.message}`);
    process.exit(1);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
