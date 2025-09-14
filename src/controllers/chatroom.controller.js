const { Chatroom, Message } = require('../models');
const cacheService = require('../services/cache.service');
const geminiService = require('../services/gemini.service');
const queueService = require('../services/queue.service');

const createChatroom = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const chatroom = await Chatroom.create({
      user_id: userId,
      name
    });

    // Invalidate cache for user's chatrooms
    await cacheService.del(`chatrooms:${userId}`);

    res.status(201).json({ chatroom });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChatrooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `chatrooms:${userId}`;

    // Check cache first
    let chatrooms = await cacheService.get(cacheKey);
    if (chatrooms) {
      return res.json({ chatrooms: JSON.parse(chatrooms) });
    }

    // Fetch from database
    chatrooms = await Chatroom.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });

    await cacheService.set(cacheKey, JSON.stringify(chatrooms), 600);

    res.json({ chatrooms });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChatroom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chatroom = await Chatroom.findOne({
      where: { id, user_id: userId },
      include: [{
        model: Message,
        order: [['createdAt', 'ASC']]
      }]
    });

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.json({ chatroom });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chatroom = await Chatroom.findOne({
      where: { id, user_id: userId }
    });

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    // Create user message
    const userMessage = await Message.create({
      chatroom_id: id,
      user_id: userId,
      message,
      is_user_message: true
    });

    // Add to queue for Gemini processing
    await queueService.addGeminiJob({
      messageId: userMessage.id,
      message:userMessage.message,
      chatroomId: id
    });

    res.json({
      message: userMessage,
      status: 'Processing AI response...'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createChatroom,
  getChatrooms,
  getChatroom,
  sendMessage
};
