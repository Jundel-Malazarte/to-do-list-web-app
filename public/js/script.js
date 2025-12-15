// Use relative path - works on both localhost and deployed
const API_BASE = '/api';

// Generate unique user ID (stored in localStorage)
const userId = localStorage.getItem('userId') || generateUserId();

function generateUserId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
    console.log('✓ Generated new userId:', id);
    return id;
}

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('tasks');
const taskCount = document.getElementById('task-stats');
const tasksContainer = document.getElementById('tasks-container');

let tasks = [];
let draggedElement = null;

console.log('📱 App initialized');
console.log('🔌 API Base:', API_BASE);
console.log('👤 User ID:', userId);

// Show error toast notification
function showError(message) {
    console.error('❌ Error:', message);
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Show success toast notification
function showSuccess(message) {
    console.log('✅ Success:', message);
}

// Fetch tasks from server
async function loadTasks() {
    try {
        console.log('📖 Loading tasks...');
        taskCount.textContent = 'Loading...';
        
        const res = await fetch(`${API_BASE}/tasks/${userId}`);
        console.log('Response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Loaded data:', data);
        
        if (data.success) {
            tasks = data.tasks;
            console.log(`✓ Loaded ${tasks.length} tasks`);
            renderTasks();
        } else {
            throw new Error(data.error || 'Failed to load tasks');
        }
    } catch (err) {
        console.error('Error loading tasks:', err);
        showError('Failed to load tasks. Check server connection.');
        taskCount.textContent = 'Error loading tasks';
    }
}

// Add task to server
async function addTask(text) {
    try {
        console.log('✨ Adding task:', text);
        
        const res = await fetch(`${API_BASE}/tasks/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        console.log('Add response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Add response:', data);
        
        if (data.success) {
            tasks.push(data.task);
            console.log('✓ Task added successfully');
            renderTasks();
            showSuccess('Task added!');
        } else {
            throw new Error(data.error || 'Failed to add task');
        }
    } catch (err) {
        console.error('Error adding task:', err);
        showError('Failed to add task: ' + err.message);
    }
}

// Update task on server (mark done/undone)
async function updateTask(taskId, updates) {
    try {
        console.log('📝 Updating task:', taskId, updates);
        
        const res = await fetch(`${API_BASE}/tasks/${userId}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        console.log('Update response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Update response:', data);
        
        if (data.success) {
            const idx = tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                tasks[idx] = data.task;
                console.log('✓ Task updated');
                renderTasks();
            }
        } else {
            throw new Error(data.error || 'Failed to update task');
        }
    } catch (err) {
        console.error('Error updating task:', err);
        showError('Failed to update task: ' + err.message);
        loadTasks(); // Reload to sync state
    }
}

// Delete task from server
async function deleteTask(taskId) {
    try {
        console.log('🗑️  Deleting task:', taskId);
        
        const res = await fetch(`${API_BASE}/tasks/${userId}/${taskId}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Delete response:', data);
        
        if (data.success) {
            tasks = tasks.filter(t => t.id !== taskId);
            console.log('✓ Task deleted');
            renderTasks();
            showSuccess('Task deleted!');
        } else {
            throw new Error(data.error || 'Failed to delete task');
        }
    } catch (err) {
        console.error('Error deleting task:', err);
        showError('Failed to delete task: ' + err.message);
        loadTasks(); // Reload to sync state
    }
}

// Reorder tasks on server (drag and drop)
async function reorderTasks() {
    try {
        console.log('↕️  Reordering tasks...');
        
        const res = await fetch(`${API_BASE}/tasks/${userId}/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        
        console.log('Reorder response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Reorder response:', data);
        console.log('✓ Tasks reordered');
    } catch (err) {
        console.error('Error reordering tasks:', err);
        showError('Failed to reorder tasks: ' + err.message);
    }
}

function updateTaskCount() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    if (total === 0) {
        taskCount.textContent = 'No tasks yet';
    } else {
        taskCount.textContent = `${completed} of ${total} completed`;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state text-center py-16 sm:py-24 px-4">
                <svg class="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p class="text-gray-400 text-base sm:text-lg font-medium">No tasks yet. Add one to get started!</p>
            </div>
        `;
        updateTaskCount();
        return;
    }

    tasksContainer.innerHTML = '<ul id="tasks" class="flex flex-col gap-3 sm:gap-4"></ul>';
    const newTaskList = document.getElementById('tasks');

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `task flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 rounded-xl hover:bg-violet-50 transition-all duration-300 cursor-move group ${task.done ? 'bg-gray-100' : ''}`;
        li.draggable = true;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="drag-handle flex-shrink-0 flex flex-col gap-1.5 justify-center">
                <span class="w-5 h-0.5 bg-current rounded"></span>
                <span class="w-5 h-0.5 bg-current rounded"></span>
            </div>
            <input type="checkbox" class="checkbox w-5 h-5 sm:w-6 sm:h-6 cursor-pointer accent-violet-500 flex-shrink-0" ${task.done ? 'checked' : ''}>
            <span class="task-text flex-1 text-base sm:text-lg ${task.done ? 'line-through text-gray-400' : 'text-gray-800'} word-break break-words">${escapeHtml(task.text)}</span>
            <button type="button" class="delete-btn flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 bg-red-500 text-white text-sm sm:text-base font-semibold rounded-lg opacity-70 hover:opacity-100 hover:shadow-lg active:scale-95 transition-all duration-300">Delete</button>
        `;

        const checkbox = li.querySelector('.checkbox');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            console.log('Checkbox changed for task:', task.id, 'done:', checkbox.checked);
            updateTask(task.id, { done: checkbox.checked });
        });

        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete button clicked for task:', task.id);
            deleteTask(task.id);
        });

        // Drag events
        li.addEventListener('dragstart', (e) => {
            console.log('Drag started for task:', task.id);
            draggedElement = li;
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        li.addEventListener('dragend', () => {
            console.log('Drag ended');
            draggedElement = null;
            li.classList.remove('dragging');
            document.querySelectorAll('.task').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedElement && draggedElement !== li) {
                li.classList.add('drag-over');
            }
        });

        li.addEventListener('dragleave', () => {
            li.classList.remove('drag-over');
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && draggedElement !== li) {
                const draggedId = parseInt(draggedElement.dataset.id);
                const targetId = parseInt(li.dataset.id);

                console.log('Dropped task', draggedId, 'onto task', targetId);

                const draggedIdx = tasks.findIndex(t => t.id === draggedId);
                const targetIdx = tasks.findIndex(t => t.id === targetId);

                if (draggedIdx !== -1 && targetIdx !== -1) {
                    [tasks[draggedIdx], tasks[targetIdx]] = [tasks[targetIdx], tasks[draggedIdx]];
                    reorderTasks();
                    renderTasks();
                }
            }
        });

        newTaskList.appendChild(li);
    });

    updateTaskCount();
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();

    console.log('Form submitted with text:', text);

    if (text === '') {
        taskInput.focus();
        return;
    }

    addTask(text);
    taskInput.value = '';
    taskInput.focus();
});

// Load tasks on page load
console.log('Page loaded, loading tasks...');
loadTasks();