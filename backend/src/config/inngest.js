import { Inngest } from "inngest";
import { connectDB } from "../config/db.js";
import { User } from "../models/user.model.js";
import { ENV } from "./env.js";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "krishna-shop",
  eventKey: ENV.INNGEST_EVENT_KEY, // Add this if you have an event key
});

// Sync user function
const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    try {
      await connectDB();
      
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      
      // Fixed name concatenation
      const newUser = {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
        imageUrl: image_url,
        addresses: [],
        wishlist: []
      };
      
      const createdUser = await User.create(newUser);
      console.log("User created:", createdUser);
      
      return { success: true, userId: createdUser._id };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error; // Re-throw to let Inngest handle retries
    }
  }
);

// Delete user function
const deleteUserFromDb = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    try {
      await connectDB();
      
      const { id } = event.data;
      const result = await User.deleteOne({ clerkId: id });
      
      console.log("User deleted:", { clerkId: id, deletedCount: result.deletedCount });
      
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
);

export const functions = [syncUser, deleteUserFromDb];