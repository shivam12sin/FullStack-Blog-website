const mongoose =  require('mongoose');
const Schema  = mongoose.Schema;

/**
 * Post Schema
 * Represents a blog article in the Writer's Network.
 * Supports markdown content, tagging, and references an author.
 */
const postSchema = new Schema({
  title:{
    type:String,
    required:true
  },
  body:{
    type:String,
    required:true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Temporarily false so old posts dont break completely, but can be required later
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdAt:{
    type:Date,
    default: Date.now
  },
  updatedAt:{
    type:Date,
    default: Date.now
  }
});

// Indexes for significantly faster sorting and filtering
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });

// Text index for robust and fast search functionality
postSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('Post',postSchema);