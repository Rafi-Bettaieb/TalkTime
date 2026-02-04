const mongoose = require("mongoose");

const messageModel = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    contentType: { 
      type: String, 
      enum: ["text", "image", "video", "application"], 
      default: "text" 
    },
    fileName: { type: String }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageModel);
module.exports = Message;