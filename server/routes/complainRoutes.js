import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';

const router = express.Router();

// Map each category to the appropriate agency
const categoryToAgency = {
  "Public Services": "Local Administration Agency",
  "Health": "Ministry of Health",
  "Education": "Ministry of Education",
  "Security": "National Police",
  "Electricity": "Energy Utility Corporation (EUCL)",
  "Water": "WASAC",
  "Transport": "Rwanda Transport Agency",
  "Environment": "REMA",
  "Other": "General Support Office"
};

// @route   POST /api/complain
// @desc    Submit a new complaint and auto-assign to agency
// @access  Public
router.post("/", async (req, res) => {
  try {
    const {
      category,
      name,
      email,
      contact,
      location,
      message,
    } = req.body;

    // Required fields validation
    if (!category || !name || !email || !contact || !location || !message) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Generate unique ticket ID
    const ticketId = "TCKT-" + uuidv4().slice(0, 8).toUpperCase();

    // Assign to appropriate agency
    const assignedTo = categoryToAgency[category] || "Unassigned";

    // Create complaint entry
    const newComplain = {
      category,
      name,
      email,
      contact,
      location,
      message,
      ticketId,
      assignedTo,
      status: "Pending",
      response: ""
    };

    const complain = await Submission.create(newComplain);
    return res.status(201).json({
      message: "Complaint submitted successfully.",
      ticketId: complain.ticketId,
      assignedTo: complain.assignedTo
    });
  } catch (error) {
    console.error("Error saving complaint:", error);
    return res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Get all complaints
router.get("/", async (req, res) => {
  try {
    const complaints = await Submission.find({});
    return res.status(200).json({
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Error retrieving complaints:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Get complaints by category (case-insensitive)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const complaints = await Submission.find({
      category: { $regex: new RegExp(`^${category.trim()}$`, "i") },
    });

    if (complaints.length === 0) {
      return res.status(404).json({ message: `No complaints found for category '${category}'.` });
    }

    return res.status(200).json({
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Error retrieving complaints by category:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Update complaint (partial update, smart status control)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const trimmedId = id.trim();

    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return res.status(400).json({ message: "Invalid complaint ID format." });
    }

    const updateFields = {};

    const {
      category,
      name,
      email,
      contact,
      location,
      message,
      status,
      assignedTo,
      response: responseMessage,
    } = req.body;

    // Only add fields that are present in the request
    if (category) updateFields.category = category;
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (contact) updateFields.contact = contact;
    if (location) updateFields.location = location;
    if (message) updateFields.message = message;
    if (assignedTo) updateFields.assignedTo = assignedTo;
    if (typeof responseMessage === "string" && responseMessage.trim() !== "") {
      updateFields.response = responseMessage;
      updateFields.status = "Open"; // Automatically mark as Open when a response is added
    }
    if (status && status === "Closed") {
      updateFields.status = "Closed"; // Allow explicit status close
    }

    const updatedComplaint = await Submission.findByIdAndUpdate(
      trimmedId,
      updateFields,
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    return res.status(200).json({
      message: "Complaint updated successfully.",
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return res.status(500).json({
      message: "Failed to update complaint. Please try again later.",
    });
  }
});


// Delete complaint
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Submission.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Get complaint by ticketId
router.get("/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const complaint = await Submission.findOne({ ticketId });

    if (!complaint) {
      return res.status(404).json({ message: "Ticket ID not found." });
    }

    return res.status(200).json({
      ticketId: complaint.ticketId,
      name: complaint.name,
      category: complaint.category,
      status: complaint.status,
      assignedTo: complaint.assignedTo || "Unassigned",
      response: complaint.response || "No response yet",
    });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
