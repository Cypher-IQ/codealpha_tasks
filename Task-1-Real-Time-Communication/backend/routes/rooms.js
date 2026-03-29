const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const auth = require('../middleware/auth');

// Create a new room
router.post('/create', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const db = getDb();
        const roomId = uuidv4();
        
        await db.run('INSERT INTO rooms (id, name, host_id) VALUES (?, ?, ?)', [roomId, name || 'Untilted Room', req.user.id]);
        
        res.status(201).json({ roomId, name: name || 'Untilted Room', hostId: req.user.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get room details
router.get('/:id', auth, async (req, res) => {
    try {
        const db = getDb();
        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
