// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        // DOM Elements
        this.taskInput = document.getElementById('taskInput');
        this.deadlineInput = document.getElementById('deadlineInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskCount = document.getElementById('taskCount');
        this.clearSection = document.getElementById('clearSection');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.editModal = document.getElementById('editModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.editDeadlineInput = document.getElementById('editDeadlineInput');
        this.saveEditBtn = document.getElementById('saveEditBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.closeModal = document.getElementById('closeModal');
        
        this.initializeApp();
        this.bindEvents();
        this.startExpirationChecker();
    }
    
    initializeApp() {
        this.loadTasks();
        this.checkExpiredTasks();
        this.renderTasks();
        this.updateUI();
        this.setDefaultDeadline();
    }
    
    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Filter events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.closest('.filter-btn').dataset.filter);
            });
        });
        
        // Clear completed events
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        // Modal events
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        
        // Close modal when clicking outside
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.classList.contains('show')) {
                this.closeEditModal();
            }
        });
    }
    
    // CRUD Operations
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;
        
        const deadline = this.deadlineInput.value;
        const deadlineDate = deadline ? new Date(deadline).toISOString() : null;
        
        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            expired: false,
            deadline: deadlineDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.checkExpiredTasks();
        this.renderTasks();
        this.updateUI();
        
        // Clear input and focus
        this.taskInput.value = '';
        this.deadlineInput.value = '';
        this.taskInput.focus();
        this.setDefaultDeadline();
        
        // Show success feedback
        this.showNotification('Task added successfully!', 'success');
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateUI();
            
            const status = task.completed ? 'completed' : 'marked as active';
            this.showNotification(`Task ${status}!`, 'info');
        }
    }
    
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            this.editTaskInput.value = task.text;
            
            // Set deadline in edit modal
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                const localDateTime = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000);
                this.editDeadlineInput.value = localDateTime.toISOString().slice(0, 16);
            } else {
                this.editDeadlineInput.value = '';
            }
            
            this.editTaskInput.focus();
            this.editTaskInput.select();
            this.editModal.classList.add('show');
        }
    }
    
    saveEdit() {
        const text = this.editTaskInput.value.trim();
        if (!text) return;
        
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = text;
            task.deadline = this.editDeadlineInput.value ? new Date(this.editDeadlineInput.value).toISOString() : null;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.checkExpiredTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }
    
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateUI();
            this.showNotification('Task deleted successfully!', 'info');
        }
    }
    
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateUI();
            this.showNotification(`${completedCount} completed task${completedCount > 1 ? 's' : ''} cleared!`, 'info');
        }
    }
    
    // Deadline and Expiration Management
    checkExpiredTasks() {
        const now = new Date();
        let hasChanges = false;
        
        this.tasks.forEach(task => {
            if (task.deadline && !task.completed) {
                const deadline = new Date(task.deadline);
                const isExpired = deadline < now;
                
                if (isExpired !== task.expired) {
                    task.expired = isExpired;
                    hasChanges = true;
                }
            } else if (task.expired && !task.deadline) {
                task.expired = false;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.saveTasks();
        }
    }
    
    startExpirationChecker() {
        // Check for expired tasks every minute
        setInterval(() => {
            this.checkExpiredTasks();
            this.renderTasks();
            this.updateUI();
        }, 60000);
    }
    
    setDefaultDeadline() {
        // Set default deadline to tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const localDateTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000);
        this.deadlineInput.value = localDateTime.toISOString().slice(0, 16);
    }
    
    getDeadlineStatus(deadline) {
        if (!deadline) return { status: 'none', text: 'No deadline' };
        
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffTime < 0) {
            return { status: 'expired', text: 'Expired' };
        } else if (diffDays === 0) {
            return { status: 'urgent', text: 'Due today' };
        } else if (diffDays === 1) {
            return { status: 'urgent', text: 'Due tomorrow' };
        } else if (diffDays <= 3) {
            return { status: 'urgent', text: `Due in ${diffDays} days` };
        } else {
            return { status: 'normal', text: `Due in ${diffDays} days` };
        }
    }
    
    // Filtering
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
        this.updateUI();
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed && !t.expired);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'expired':
                return this.tasks.filter(t => t.expired && !t.completed);
            default:
                return this.tasks;
        }
    }
    
    // Rendering
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.taskList.style.display = 'flex';
            this.emptyState.style.display = 'none';
            
            this.taskList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
            
            // Add event listeners to new task elements
            this.taskList.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleTask(checkbox.dataset.taskId);
                });
            });
            
            this.taskList.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editTask(btn.dataset.taskId);
                });
            });
            
            this.taskList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTask(btn.dataset.taskId);
                });
            });
        }
    }
    
    createTaskElement(task) {
        const date = new Date(task.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const deadlineStatus = this.getDeadlineStatus(task.deadline);
        const deadlineText = task.deadline ? 
            new Date(task.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
        
        const deadlineIcon = deadlineStatus.status === 'expired' ? 'fas fa-exclamation-triangle' :
                           deadlineStatus.status === 'urgent' ? 'fas fa-clock' : 'fas fa-calendar';
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${task.expired ? 'expired' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-date">Created: ${date}</div>
                    ${task.deadline ? `
                        <div class="task-deadline ${deadlineStatus.status}">
                            <i class="${deadlineIcon}"></i>
                            <span>${deadlineText} (${deadlineStatus.text})</span>
                        </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-task-id="${task.id}" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" data-task-id="${task.id}" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // UI Updates
    updateUI() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const activeTasks = this.tasks.filter(t => !t.completed && !t.expired).length;
        const expiredTasks = this.tasks.filter(t => t.expired && !t.completed).length;
        
        // Update task count
        let countText = '';
        switch (this.currentFilter) {
            case 'active':
                countText = `${activeTasks} active task${activeTasks !== 1 ? 's' : ''}`;
                break;
            case 'completed':
                countText = `${completedTasks} completed task${completedTasks !== 1 ? 's' : ''}`;
                break;
            case 'expired':
                countText = `${expiredTasks} expired task${expiredTasks !== 1 ? 's' : ''}`;
                break;
            default:
                countText = `${totalTasks} total task${totalTasks !== 1 ? 's' : ''}`;
        }
        this.taskCount.textContent = countText;
        
        // Show/hide clear completed button
        if (completedTasks > 0) {
            this.clearSection.style.display = 'block';
        } else {
            this.clearSection.style.display = 'none';
        }
    }
    
    // Modal Management
    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editTaskInput.value = '';
        this.editDeadlineInput.value = '';
    }
    
    // Local Storage
    saveTasks() {
        localStorage.setItem('taskManager_tasks', JSON.stringify(this.tasks));
    }
    
    loadTasks() {
        const saved = localStorage.getItem('taskManager_tasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        }
    }
    
    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-family: inherit;
        `;
        
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            font-weight: 500;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Add some sample tasks for demonstration (remove in production)
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is the first time loading the app
    if (!localStorage.getItem('taskManager_tasks')) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const sampleTasks = [
            {
                id: '1',
                text: 'Welcome to TaskMaster! Click the checkbox to mark this as complete.',
                completed: false,
                expired: false,
                deadline: null,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: '2',
                text: 'Try adding a new task with a deadline using the input field above.',
                completed: false,
                expired: false,
                deadline: tomorrow.toISOString(),
                createdAt: new Date(Date.now() - 43200000).toISOString(),
                updatedAt: new Date(Date.now() - 43200000).toISOString()
            },
            {
                id: '3',
                text: 'Use the filter buttons to view different task categories.',
                completed: true,
                expired: false,
                deadline: null,
                createdAt: new Date(Date.now() - 21600000).toISOString(),
                updatedAt: new Date(Date.now() - 21600000).toISOString()
            },
            {
                id: '4',
                text: 'This task has expired and will appear in the Expired tab.',
                completed: false,
                expired: true,
                deadline: yesterday.toISOString(),
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                updatedAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: '5',
                text: 'This task is due next week - check the deadline display!',
                completed: false,
                expired: false,
                deadline: nextWeek.toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        localStorage.setItem('taskManager_tasks', JSON.stringify(sampleTasks));
    }
}); 