const mongoose =  require('mongoose');
const Schema  = mongoose.Schema;

/**
 * User Schema
 * Represents an author or reader in the network.
 * Handles authentication credentials and the follower/following relationship system.
 */
const userSchema = new Schema({
  username:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  bio: {
    type: String,
    default: "This author hasn't written a biography yet."
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });


module.exports = mongoose.model('User',userSchema);