import express from 'express';
import { Feedback } from '../models/Feedback.js'


const router = express.Router();
// Route to submit feedback
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, location, category, feedback } = req.body;

    // Validate required fields
    if (!name || !email || !location || !category || !feedback) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // Create a new feedback instance
    const newFeedback = new Feedback({
      name,
      email,
      phone,
      location,
      category,
      feedback,
    });

    // Save the feedback to the database
    const savedFeedback = await newFeedback.save();

    // Respond with the saved feedback
    return res.status(201).json(savedFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while saving feedback." });
  }
});

// Route to get all feedback from the database
router.get("/", async (req, res) => {
  try {
    const feedbackList = await Feedback.find({});
    return res.status(200).json({
      count: feedbackList.length,
      data: feedbackList,
    });
  } catch (error) {
    console.error("Error retrieving feedback:", error);
    return res.status(500).json({ message: error.message });
  }
});


// Route to get feedback by category (case-insensitive)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // Perform a case-insensitive search using collation
    const feedbacks = await Feedback.find({ category }).collation({
      locale: "en",
      strength: 2,
    });

    if (feedbacks.length === 0) {
      return res
        .status(404)
        .json({ message: `No feedback found for category '${category}'.` });
    }

    return res.status(200).json({
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Error retrieving feedback by category:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving feedback." });
  }
});

export default router;
