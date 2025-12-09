// server.js
const express = require('express');
const app = express();
const port = 3000;

// Serve static files (your HTML, CSS, JS frontend)
app.use(express.static('public')); 
// **NOTE:** You may need to rename your folder with your frontend files to 'public'

// Define a simple API endpoint (e.g., for getting your todos)
app.get('/todos', (req, res) => {
    // In a real app, you would fetch this from a database
    const todos = [
        { id: 1, text: 'Learn Node.js', completed: false },
        { id: 2, text: 'Fix the npm install error', completed: true }
    ];
    res.json(todos);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});