const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  longDescription: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  userPhoto: String,
  userName: String,
  userEmail: { type: String, required: true },

  likes: [
    {
      userName: String,
      userPhoto: String,
      userEmail: String
    }
  ],
});


module.exports = mongoose.model("Blogs", blogSchema)