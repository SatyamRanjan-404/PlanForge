const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: {
    type: String, // UUID from Supabase Auth
    required: true,
  },
  originalPrompt: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PLANNING', 'EXECUTING', 'VALIDATING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  assignedAgent: {
    type: String,
    default: null, // "planner", "executor", etc.
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
