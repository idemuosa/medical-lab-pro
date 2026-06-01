const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, limit this to your frontend URL
        methods: ["GET", "POST"]
    }
});

// Endpoint for Django to trigger notifications
app.post('/trigger', (req, res) => {
    const { message, type, data } = req.body;

    // Broadcast to ALL connected users (Admins & Staff)
    io.emit('global_notification', {
        message,
        type,
        data,
        timestamp: new Date()
    });

    console.log(`Broadcasted: ${message}`);
    res.status(200).send({ status: 'Broadcast Sent' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
