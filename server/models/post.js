const mongoose =  require('mongoose');

const Schema  = mongoose.Schema;

const postSchema = new Schema({
  title:{
    type:String,
    required:true
  },
  body:{
    type:String,
    required:true
  },
  createdAt:{
    type:Date,
    default: DataTransfer.now
  },
  updatedAt:{
    type:Date,
    default: DataTransfer.now
  }
});


module.exports = mongoose.model('Post',postSchema);