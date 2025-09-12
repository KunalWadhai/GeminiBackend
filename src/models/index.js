const User = require('./user.model');
const Chatroom = require('./chatroom.model');
const Message = require('./message.model');
const Subscription = require('./subscription.model');

// Define associations
User.hasMany(Chatroom, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Chatroom.belongsTo(User, { foreignKey: 'user_id' });

Chatroom.hasMany(Message, { foreignKey: 'chatroom_id', onDelete: 'CASCADE' });
Message.belongsTo(Chatroom, { foreignKey: 'chatroom_id' });

User.hasMany(Message, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Subscription, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Chatroom,
  Message,
  Subscription
};
