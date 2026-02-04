const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModel");
const User = require("../Models/userModel");
const Chat = require("../Models/chatModel");

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;

  let messageContent = content;
  let messageType = "text";
  let fileName = "";

  if (req.file) {
    messageContent = "uploads/" + req.file.filename;
    fileName = req.file.originalname;

    if (req.file.mimetype.startsWith("image")) {
        messageType = "image";
    } else if (req.file.mimetype.startsWith("video")) {
        messageType = "video";
    } else if (req.file.mimetype === "application/pdf") {
        messageType = "application";
    } else {
        messageType = "text";
    }
  }

  if (!messageContent && !req.file) {
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: messageContent,
    chat: chatId,
    contentType: messageType,
    fileName: fileName
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };