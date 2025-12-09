// script.js
const tasksList = document.getElementById('tasks');
const taskInput = document.getElementById('task-input');
const taskForm = document.getElementById('task-form');

// Add task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText !== '') {
        const task = document.createElement('li');
        task.className = 'task';
        task.textContent = taskText;
        task.addEventListener('click', () => {
            task.classList.toggle('done');
        });
        tasksList.appendChild(task);
        taskInput.value = '';
    }
});

// Delete task
tasksList.addEventListener('click', (e) => {
    if (e.target.classList.contains('task')) {
        e.target.remove();
    }
});