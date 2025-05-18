import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const submissionSchema = new Schema({
  ticketId: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  category: { type: String, required: true },
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
  },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Open', 'Resolved', 'Closed'], 
    default: 'Pending'
  },
  assignedTo: { type: String },
  response: { type: String },
}, { timestamps: true });

export const Submission = model('Submission', submissionSchema);
export default Submission;
