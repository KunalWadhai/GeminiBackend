const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import models to register them with Sequelize
require('./models');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const chatroomRoutes = require('./routes/chatroom.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chatroom', chatroomRoutes);
app.use('/subscribe', subscriptionRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to database
connectDB();

module.exports = app;
