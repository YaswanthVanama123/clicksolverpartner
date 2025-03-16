// src/utils/NotificationEmitter.js
import EventEmitter from 'eventemitter3';

// Create a single shared EventEmitter instance
const notificationEventEmitter = new EventEmitter();

export default notificationEventEmitter;
