const express = require('express');
const router = express.Router();
const chatroomController = require('../controllers/chatroom.controller');
const authenticate = require('../middleware/auth');
const { messageRateLimit } = require('../middleware/rateLimit');

router.post('/', authenticate, chatroomController.createChatroom);
router.get('/', authenticate, chatroomController.getChatrooms);
router.get('/:id', authenticate, chatroomController.getChatroom);
router.post('/:id/message', authenticate, messageRateLimit, chatroomController.sendMessage);

module.exports = router;


