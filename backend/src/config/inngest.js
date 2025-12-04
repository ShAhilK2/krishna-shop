import { Inngest } from "inngest";
import { connectDB } from "../config/db.js";
import { User } from "../models/user.model.js";
import { ENV } from "./env.js";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "krishna-shop",
  
});

// Sync user function - UPDATED EVENT NAME
const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" }, // Changed from "clerk/user.created"
  async ({ event, step }) => {
    return await step.run("create-user-in-db", async () => {
      try {
        console.log("🔥 Inngest event received:", JSON.stringify(event, null, 2));
        
        // Verify database connection
        console.log("🔌 Connecting to database...");
        await connectDB();
        console.log("✅ Database connected successfully");
        
        // The data structure from Clerk webhook
        const { id, email_addresses, first_name, last_name, image_url } = event.data;
        
        if (!id) {
          throw new Error("User ID is missing in the webhook payload");
        }
        
        console.log("📧 Processing user:", {
          id,
          email: email_addresses?.[0]?.email_address,
          name: `${first_name || ""} ${last_name || ""}`.trim()
        });
        
        // Check if user already exists
        const existingUser = await User.findOne({ clerkId: id });
        if (existingUser) {
          console.log("ℹ️ User already exists:", existingUser.email);
          return { message: "User already exists", user: existingUser };
        }
        
        if (!email_addresses?.[0]?.email_address) {
          throw new Error("Email address is missing in the webhook payload");
        }
        
        const newUser = {
          clerkId: id,
          email: email_addresses[0].email_address,
          name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
          imageUrl: image_url || "",
          addresses: [],
          wishlist: []
        };
        
        console.log("💾 Attempting to create user:", JSON.stringify(newUser, null, 2));
        
        const createdUser = await User.create(newUser);
        console.log("✅ User created successfully:", createdUser.email, "(ID:", createdUser._id, ")");
        return { message: "User created successfully", user: createdUser };
      } catch (error) {
        console.error("❌ Error processing webhook:", {
          message: error.message,
          stack: error.stack,
          event: JSON.stringify(event, null, 2)
        });
        // Re-throw the error to mark the function as failed in Ingest
        throw error;
      }
    });
  }
);

// Delete user function - UPDATED EVENT NAME
const deleteUserFromDb = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" }, // Changed from "clerk/user.deleted"
  async ({ event, step }) => {
    return await step.run("delete-user-from-db", async () => {
      try {
        console.log("🗑️ Deleting user:", event.data.id);
        
        await connectDB();
        
        const { id } = event.data;
        const result = await User.deleteOne({ clerkId: id });
        
        console.log("✅ User deletion result:", result);
        
        return { message: "User deleted", result };
      } catch (error) {
        console.error("❌ Error deleting user:", error);
        throw error;
      }
    });
  }
);

export const functions = [syncUser, deleteUserFromDb];