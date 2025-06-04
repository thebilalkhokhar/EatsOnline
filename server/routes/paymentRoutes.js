const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const Order = require("../models/Order");

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Create Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      items,
      total,
      restaurantId,
      deliveryAddress,
      paymentMethod,
      userId,
    } = req.body;

    console.log("Creating checkout session with data:", {
      total,
      restaurantId,
      userId,
      itemsCount: items?.length,
    });

    if (
      !items ||
      !Array.isArray(items) ||
      !total ||
      !restaurantId ||
      !deliveryAddress ||
      !userId
    ) {
      console.error("Missing required fields:", {
        hasItems: !!items,
        isArray: Array.isArray(items),
        total,
        restaurantId,
        deliveryAddress,
        userId,
      });
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    const lineItems =
      items.length > 0
        ? items.map((item) => ({
            price_data: {
              currency: "pkr",
              product_data: {
                name: item.product?.name || "Unknown Product",
                description: `Quantity: ${item.quantity}`,
              },
              unit_amount: Math.round((item.price || 0) * 100),
            },
            quantity: item.quantity || 1,
          }))
        : [];

    if (lineItems.length === 0) {
      return res.status(400).json({ message: "No valid items to process" });
    }

    console.log("Creating Stripe session with line items:", lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: {
        restaurantId,
        deliveryAddress,
        total: total.toString(),
        items: JSON.stringify(
          items.map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.price,
          }))
        ),
        userId,
      },
    });

    console.log("Stripe session created successfully:", {
      sessionId: session.id,
      total,
      itemsCount: items.length,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating Stripe session:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res
      .status(500)
      .json({
        message: "Failed to create Stripe session",
        error: error.message,
      });
  }
});

// Webhook handler function
const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEBHOOK_ENDPOINT_SECRET
    );
    console.log(
      "Webhook event verified:",
      event.type,
      "Data:",
      event.data.object
    );
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err.message,
      "Headers:",
      req.headers
    );
    return res.status(400).json({ message: "Webhook Error" });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const { restaurantId, deliveryAddress, total, items, userId } =
        session.metadata;
      console.log("Processing checkout.session.completed - Metadata:", {
        restaurantId,
        deliveryAddress,
        total,
        items,
        userId,
      });

      try {
        const parsedItems = JSON.parse(items);
        console.log("Parsed items:", parsedItems);

        // Validate required fields
        if (!restaurantId || !userId || !parsedItems || !Array.isArray(parsedItems)) {
          throw new Error("Missing required fields in metadata");
        }

        // Create order
        const order = new Order({
          user: userId,
          items: parsedItems.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: parseFloat(total),
          deliveryAddress,
          paymentMethod: "Online",
          restaurantId,
          status: "Confirmed",
          stripeSessionId: session.id
        });

        await order.save();
        console.log("Order created successfully:", order._id);
      } catch (err) {
        console.error("Error processing webhook:", err);
        return res.status(500).json({ message: "Error processing webhook" });
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

router.post("/payment-success", async (req, res) => {
  const { sessionId } = req.body;
  
  try {
    const order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only update status to Confirmed if it's an online payment
    if (order.paymentMethod === "Online") {
      order.status = "Confirmed";
      await order.save();
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

module.exports = {
  router,
  webhook
};
