const mongoose =  require('mongoose');

const Schema  = mongoose.Schema;

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