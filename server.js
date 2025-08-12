// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Create notes table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )
`);

// Get all notes
app.get('/api/notes', (req, res) => {
    db.all('SELECT * FROM notes ORDER BY updatedAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add or update a note
app.post('/api/notes', (req, res) => {
    const { id, title, content, createdAt, updatedAt } = req.body;

    if (id) {
        // Update
        db.run(`
            UPDATE notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?
        `, [title, content, updatedAt, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        // Insert
        db.run(`
            INSERT INTO notes (title, content, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)
        `, [title, content, createdAt, updatedAt], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
    }
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
    db.run(`DELETE FROM notes WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Export notes
app.get('/api/export', (req, res) => {
    db.all('SELECT * FROM notes', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.setHeader('Content-Disposition', 'attachment; filename="notes.json"');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rows, null, 2));
    });
});

// Import notes
app.post('/api/import', (req, res) => {
    const notes = req.body;

    if (!Array.isArray(notes)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO notes (id, title, content, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
    `);

    notes.forEach(note => {
        stmt.run(note.id, note.title, note.content, note.createdAt, note.updatedAt);
    });

    stmt.finalize();
    res.json({ success: true });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
