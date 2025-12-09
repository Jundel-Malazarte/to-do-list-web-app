// backend/server.js
const express = require('express');
const fs = require('fs'); // Import File System module for reading/writing files
const path = require('path');

const app = express();
const port = 3000;

// --- Middlewares ---
// Allows Express to read JSON data from the request body
app.use(express.json()); 
// Serves static frontend files from the 'public' folder
app.use(express.static('public')); 

// Define the path to your data file
const TODOS_FILE = path.join(__dirname, 'todos.json');

// --- Helper Functions for File I/O ---

// Reads the todos from the file
const readTodos = () => {
    try {
        const data = fs.readFileSync(TODOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading todos file. Initializing with empty array.", error.message);
        return [];
    }
};

// Writes the given array of todos to the file
const writeTodos = (todos) => {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2), 'utf8');
};

// --- API Routes ---

// GET /todos: Fetch all tasks
app.get('/todos', (req, res) => {
    const todos = readTodos();
    res.json(todos);
});

// POST /todos: Add a new task
app.post('/todos', (req, res) => {
    const todos = readTodos();
    const newTaskText = req.body.text;
    
    // Create the new task object with a unique ID
    const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    
    const newTask = { 
        id: newId, 
        text: newTaskText, 
        completed: false 
    };
    
    // Add the new task to the array
    todos.push(newTask);
    
    // Save the updated array back to the file
    writeTodos(todos);
    
    // Respond to the client with the saved task
    res.status(201).json({ message: 'Task added successfully!', task: newTask });
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});