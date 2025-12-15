// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware - ORDER MATTERS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database file path - stores in backend folder
const DB_FILE = path.join(__dirname, 'tasks.json');

console.log(`📁 Database path: ${DB_FILE}`);
console.log(`🔧 Environment: ${NODE_ENV}`);

// Initialize database file if it doesn't exist
async function initDB() {
    try {
        await fs.access(DB_FILE);
        console.log('✓ Database file exists');
    } catch {
        await fs.writeFile(DB_FILE, JSON.stringify({}));
        console.log('✓ Database initialized');
    }
}

// Read all tasks for a user
async function readTasks(userId) {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const allTasks = JSON.parse(data);
        return allTasks[userId] || [];
    } catch (err) {
        console.error('❌ Error reading tasks:', err);
        return [];
    }
}

// Write tasks for a user
async function writeTasks(userId, tasks) {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const allTasks = JSON.parse(data);
        allTasks[userId] = tasks;
        await fs.writeFile(DB_FILE, JSON.stringify(allTasks, null, 2));
        console.log(`✓ Tasks saved for user: ${userId}`);
    } catch (err) {
        console.error('❌ Error writing tasks:', err);
    }
}

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Get all tasks for a user
app.get('/api/tasks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await readTasks(userId);
        console.log(`📖 Retrieved ${tasks.length} tasks for user: ${userId}`);
        res.json({ success: true, tasks });
    } catch (err) {
        console.error('❌ Error fetching tasks:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a new task
app.post('/api/tasks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Task text is required' });
        }

        const tasks = await readTasks(userId);
        const newTask = {
            id: Date.now(),
            text: text.trim(),
            done: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        await writeTasks(userId, tasks);

        console.log(`✨ New task created for user: ${userId}`);
        res.json({ success: true, task: newTask });
    } catch (err) {
        console.error('❌ Error adding task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Reorder tasks (MUST come BEFORE the /:taskId routes to avoid conflicts!)
app.put('/api/tasks/:userId/reorder', async (req, res) => {
    try {
        const { userId } = req.params;
        const { tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ success: false, error: 'Tasks must be an array' });
        }

        await writeTasks(userId, tasks);
        console.log(`↕️  Tasks reordered for user: ${userId}`);
        res.json({ success: true, tasks });
    } catch (err) {
        console.error('❌ Error reordering tasks:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update a task (mark complete/incomplete or edit text)
app.put('/api/tasks/:userId/:taskId', async (req, res) => {
    try {
        const { userId, taskId } = req.params;
        const { done, text } = req.body;

        const tasks = await readTasks(userId);
        const task = tasks.find(t => t.id == taskId);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        if (done !== undefined) {
            task.done = done;
            console.log(`✓ Task ${taskId} marked as ${done ? 'done' : 'pending'}`);
        }
        if (text !== undefined) {
            task.text = text.trim();
            console.log(`✓ Task ${taskId} text updated`);
        }

        await writeTasks(userId, tasks);
        res.json({ success: true, task });
    } catch (err) {
        console.error('❌ Error updating task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete a task
app.delete('/api/tasks/:userId/:taskId', async (req, res) => {
    try {
        const { userId, taskId } = req.params;
        let tasks = await readTasks(userId);

        tasks = tasks.filter(t => t.id != taskId);
        await writeTasks(userId, tasks);

        console.log(`🗑️  Task ${taskId} deleted for user: ${userId}`);
        res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error('❌ Error deleting task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Catch-all route for static files (must be after API routes)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ==================== SERVER START ====================

// Initialize database and start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log('\n╔════════════════════════════════════╗');
        console.log('║     📝 TO-DO LIST SERVER STARTED   ║');
        console.log('╚════════════════════════════════════╝\n');
        console.log(`🚀 Server running at: http://localhost:${PORT}`);
        console.log(`📱 Frontend: http://localhost:${PORT}`);
        console.log(`🔌 API: http://localhost:${PORT}/api`);
        console.log(`💾 Database: backend/tasks.json\n`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app;