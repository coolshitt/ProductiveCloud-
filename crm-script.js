class ProjectCRM {
    constructor() {
        console.log('ProjectCRM constructor called');
        this.projects = [];
        this.currentProject = null;
        this.currentTheme = 'light';
        
        // Timer properties
        this.timer = {
            isRunning: false,
            startTime: null,
            pausedTime: 0,
            sessionTime: 0,
            totalTime: this.loadTotalTime(),
            interval: null,
            currentName: ''
        };
        
        // Saved timer sessions
        this.savedSessions = this.loadSavedSessions();
        
        // Load saved timer state
        this.loadTimerState();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            console.log('Initializing Project CRM...');
            this.hideLoadingScreen();
            this.loadTheme();
            this.loadProjects();
            this.setupEventListeners();
            this.updateStats();
            this.renderProjects();
            this.initTimer();
            console.log('Project CRM initialized successfully');
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.hideLoadingScreen();
        }
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        const backToHabits = document.getElementById('backToHabits');
        if (backToHabits) {
            backToHabits.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        const addProjectBtn = document.getElementById('addProjectBtn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => this.showProjectModal());
        }

        // Filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.filterProjects(e.target.value));
        }

        this.setupModalEvents();
        this.setupTaskModals();
        this.setupSubtaskModals();

        // Project list events (delegation)
        const projectsList = document.getElementById('projectsList');
        if (projectsList) {
            projectsList.addEventListener('click', (e) => this.handleProjectAction(e));
        }
    }

    setupModalEvents() {
        const modal = document.getElementById('projectModal');
        const closeModal = document.getElementById('closeModal');
        const cancelModal = document.getElementById('cancelModal');
        const saveProject = document.getElementById('saveProject');
        const deleteProject = document.getElementById('deleteProject');
        const progressSlider = document.getElementById('projectProgress');

        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideProjectModal());
        }

        if (cancelModal) {
            cancelModal.addEventListener('click', () => this.hideProjectModal());
        }

        if (saveProject) {
            saveProject.addEventListener('click', () => this.saveProject());
        }

        if (deleteProject) {
            deleteProject.addEventListener('click', () => this.deleteProject());
        }

        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                const progressValue = document.getElementById('progressValue');
                if (progressValue) {
                    progressValue.textContent = e.target.value + '%';
                }
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideProjectModal();
                }
            });
        }

        // Task form in modal event listeners
        const addTaskInModal = document.getElementById('addTaskInModal');
        const saveTaskInModal = document.getElementById('saveTaskInModal');
        const cancelTaskInModal = document.getElementById('cancelTaskInModal');

        if (addTaskInModal) {
            addTaskInModal.addEventListener('click', () => this.showTaskFormInModal());
        }

        if (saveTaskInModal) {
            saveTaskInModal.addEventListener('click', () => this.saveTaskInModal());
        }

        if (cancelTaskInModal) {
            cancelTaskInModal.addEventListener('click', () => this.hideTaskFormInModal());
        }

        // Task actions in modal (delegation)
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.addEventListener('click', (e) => this.handleTaskActionInModal(e));
        }

        // Subtask form in modal event listeners
        const saveSubtaskInModal = document.getElementById('saveSubtaskInModal');
        const cancelSubtaskInModal = document.getElementById('cancelSubtaskInModal');

        if (saveSubtaskInModal) {
            saveSubtaskInModal.addEventListener('click', () => this.saveSubtaskInModal());
        }

        if (cancelSubtaskInModal) {
            cancelSubtaskInModal.addEventListener('click', () => this.hideSubtaskFormInModal());
        }
    }

    setupTaskModals() {
        const taskModal = document.getElementById('taskModal');
        const closeTaskModal = document.getElementById('closeTaskModal');
        const cancelTaskModal = document.getElementById('cancelTaskModal');
        const saveTask = document.getElementById('saveTask');
        const deleteTask = document.getElementById('deleteTask');

        if (closeTaskModal) {
            closeTaskModal.addEventListener('click', () => this.hideTaskModal());
        }

        if (cancelTaskModal) {
            cancelTaskModal.addEventListener('click', () => this.hideTaskModal());
        }

        if (saveTask) {
            saveTask.addEventListener('click', () => this.saveTask());
        }

        if (deleteTask) {
            deleteTask.addEventListener('click', () => this.deleteTask());
        }

        // Close modal on backdrop click
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    this.hideTaskModal();
                }
            });
        }
    }

    setupSubtaskModals() {
        const subtaskModal = document.getElementById('subtaskModal');
        const closeSubtaskModal = document.getElementById('closeSubtaskModal');
        const cancelSubtaskModal = document.getElementById('cancelSubtaskModal');
        const saveSubtask = document.getElementById('saveSubtask');
        const deleteSubtask = document.getElementById('deleteSubtask');

        if (closeSubtaskModal) {
            closeSubtaskModal.addEventListener('click', () => this.hideSubtaskModal());
        }

        if (cancelSubtaskModal) {
            cancelSubtaskModal.addEventListener('click', () => this.hideSubtaskModal());
        }

        if (saveSubtask) {
            saveSubtask.addEventListener('click', () => this.saveSubtask());
        }

        if (deleteSubtask) {
            deleteSubtask.addEventListener('click', () => this.deleteSubtask());
        }

        // Close modal on backdrop click
        if (subtaskModal) {
            subtaskModal.addEventListener('click', (e) => {
                if (e.target === subtaskModal) {
                    this.hideSubtaskModal();
                }
            });
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('projectCRM_theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
        
        localStorage.setItem('projectCRM_theme', theme);
    }

    loadProjects() {
        try {
            const saved = localStorage.getItem('projectCRM_projects');
            this.projects = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
        }
    }

    saveProjects() {
        try {
            localStorage.setItem('projectCRM_projects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('Error saving projects:', error);
        }
    }

    updateStats() {
        const total = this.projects.length;
        const active = this.projects.filter(p => p.status === 'active').length;
        const completed = this.projects.filter(p => p.status === 'completed').length;
        const avgProgress = total > 0 ? 
            Math.round(this.projects.reduce((sum, p) => sum + p.progress, 0) / total) : 0;
        const totalEarnings = this.projects.reduce((sum, p) => sum + (p.cost || 0), 0);

        const totalEl = document.getElementById('totalProjects');
        const activeEl = document.getElementById('activeProjects');
        const completedEl = document.getElementById('completedProjects');
        const avgEl = document.getElementById('avgProgress');
        const earningsEl = document.getElementById('totalEarnings');

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (completedEl) completedEl.textContent = completed;
        if (avgEl) avgEl.textContent = avgProgress + '%';
        if (earningsEl) earningsEl.textContent = '$' + totalEarnings.toFixed(2);
    }

    renderProjects(filter = 'all') {
        const projectsList = document.getElementById('projectsList');
        const emptyState = document.getElementById('emptyState');
        
        if (!projectsList) return;

        let filteredProjects = this.projects;
        if (filter !== 'all') {
            filteredProjects = this.projects.filter(p => p.status === filter);
        }

        if (filteredProjects.length === 0) {
            projectsList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        projectsList.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';

        projectsList.innerHTML = filteredProjects.map(project => 
            this.createProjectHTML(project)
        ).join('');
    }

    createProjectHTML(project) {
        const progressLevel = Math.round(project.progress / 10) * 10;
        
        return `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-header">
                    <div class="project-info">
                        <h4>${project.name}</h4>
                        <div class="project-status ${project.status}">${project.status}</div>
                        ${project.cost ? `<div class="project-cost">💰 $${project.cost.toFixed(2)}</div>` : ''}
                    </div>
                    <div class="project-actions">
                        <button class="action-btn edit-btn">✏️ Edit</button>
                        <button class="action-btn complete-btn">✅ Complete</button>
                    </div>
                </div>
                
                <div class="project-progress">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-percentage">${project.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" 
                             data-progress="${progressLevel}"
                             style="width: ${project.progress}%"></div>
                    </div>
                </div>
                
                ${project.notes ? `<p class="project-notes">${project.notes}</p>` : ''}
                
                <!-- Tasks Section -->
                <div class="tasks-section">
                    <div class="tasks-header">
                        <h4>Tasks (${project.tasks?.length || 0})</h4>
                        <button class="add-task-btn" data-project-id="${project.id}">+ Add Task</button>
                    </div>
                    
                    <div class="tasks-list">
                        ${this.renderTasksList(project)}
                    </div>
                </div>
            </div>
        `;
    }

    showProjectModal(project = null) {
        const modal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteProject');
        
        if (!modal) return;

        this.currentProject = project;

        if (project) {
            modalTitle.textContent = 'Edit Project';
            deleteBtn.style.display = 'block';
            this.populateForm(project);
        } else {
            modalTitle.textContent = 'Add New Project';
            deleteBtn.style.display = 'none';
            this.clearForm();
        }

        modal.style.display = 'flex';
    }

    hideProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentProject = null;
        
        // Hide task form when modal is closed
        this.hideTaskFormInModal();
        this.hideSubtaskFormInModal();
    }

    populateForm(project) {
        const nameEl = document.getElementById('projectName');
        const statusEl = document.getElementById('projectStatus');
        const progressEl = document.getElementById('projectProgress');
        const progressValueEl = document.getElementById('progressValue');
        const costEl = document.getElementById('projectCost');
        const notesEl = document.getElementById('projectNotes');

        if (nameEl) nameEl.value = project.name;
        if (statusEl) statusEl.value = project.status;
        if (progressEl) progressEl.value = project.progress;
        if (progressValueEl) progressValueEl.textContent = project.progress + '%';
        if (costEl) costEl.value = project.cost || 0;
        if (notesEl) notesEl.value = project.notes || '';

        // Populate tasks list in modal
        this.renderTasksInModal(project);
        
        // Update progress display with calculated value
        this.updateProjectProgress();
    }

    clearForm() {
        const nameEl = document.getElementById('projectName');
        const statusEl = document.getElementById('projectStatus');
        const progressEl = document.getElementById('projectProgress');
        const progressValueEl = document.getElementById('progressValue');
        const costEl = document.getElementById('projectCost');
        const notesEl = document.getElementById('projectNotes');

        if (nameEl) nameEl.value = '';
        if (statusEl) statusEl.value = 'planning';
        if (progressEl) progressEl.value = 0;
        if (progressValueEl) progressValueEl.textContent = '0%';
        if (costEl) costEl.value = '';
        if (notesEl) notesEl.value = '';

        // Clear tasks list in modal
        const tasksListInModal = document.getElementById('tasksListInModal');
        if (tasksListInModal) {
            tasksListInModal.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: var(--spacing-md);">No tasks yet. Add your first task to get started!</p>';
        }
    }

    saveProject() {
        const nameEl = document.getElementById('projectName');
        const statusEl = document.getElementById('projectStatus');
        const progressEl = document.getElementById('projectProgress');
        const costEl = document.getElementById('projectCost');
        const notesEl = document.getElementById('projectNotes');

        if (!nameEl || !statusEl || !progressEl || !costEl || !notesEl) return;

        const name = nameEl.value.trim();
        const status = statusEl.value;
        const progress = parseInt(progressEl.value);
        const cost = parseFloat(costEl.value) || 0;
        const notes = notesEl.value.trim();

        if (!name) {
            alert('Project name is required');
            return;
        }

        const projectData = {
            name,
            status,
            progress,
            cost,
            notes,
            updatedAt: new Date().toISOString()
        };

        if (this.currentProject) {
            const index = this.projects.findIndex(p => p.id === this.currentProject.id);
            if (index !== -1) {
                this.projects[index] = { ...this.currentProject, ...projectData };
            }
        } else {
            projectData.id = this.generateId();
            projectData.createdAt = new Date().toISOString();
            this.projects.push(projectData);
        }

        this.saveProjects();
        this.updateStats();
        this.renderProjects();
        this.hideProjectModal();
        alert('Project saved successfully!');
    }

    deleteProject() {
        if (!this.currentProject) return;

        if (confirm('Are you sure you want to delete this project?')) {
            this.deleteProjectById(this.currentProject.id);
            this.hideProjectModal();
        }
    }

    completeProject(projectId) {
        if (confirm('Mark this project as completed?')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                project.status = 'completed';
                project.progress = 100;
                project.completedAt = new Date().toISOString();
                this.saveProjects();
                this.updateStats();
                this.renderProjects();
                
                // Find the complete button to trigger celebration
                const completeBtn = document.querySelector(`[data-project-id="${projectId}"].complete-btn`);
                if (completeBtn) {
                    this.celebrateCompletion(completeBtn, project.name, 'Project');
                }
                
                alert('Project marked as completed!');
            }
        }
    }

    deleteProjectById(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            this.updateStats();
            this.renderProjects();
            alert('Project deleted successfully!');
        }
    }

    filterProjects(status) {
        this.renderProjects(status);
    }

    // Task and Subtask Methods
    renderTasksList(project) {
        if (!project.tasks || project.tasks.length === 0) {
            return '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: var(--spacing-md);">No tasks yet. Add your first task to get started!</p>';
        }

        return project.tasks.map(task => this.createTaskHTML(project.id, task)).join('');
    }

    createTaskHTML(projectId, task) {
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-info">
                        <h5>${task.name}</h5>
                        <div class="task-meta">
                            <span class="task-priority ${task.priority}">${task.priority}</span>
                            <span class="task-status ${task.status}">${task.status}</span>
                            ${task.dueDate ? `<span>📅 ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit-task-btn" data-project-id="${projectId}" data-task-id="${task.id}">✏️</button>
                        <button class="task-action-btn complete-task-btn" data-project-id="${projectId}" data-task-id="${task.id}">✅</button>
                    </div>
                </div>
                
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                
                <!-- Subtasks Section -->
                <div class="subtasks-section">
                    <div class="subtasks-header">
                        <h6>Subtasks (${task.subtasks?.length || 0})</h6>
                        <button class="add-subtask-btn" data-project-id="${projectId}" data-task-id="${task.id}">+ Add Subtask</button>
                    </div>
                    
                    <div class="subtasks-list">
                        ${this.renderSubtasksList(projectId, task)}
                    </div>
                </div>
            </div>
        `;
    }

    renderSubtasksList(projectId, task) {
        if (!task.subtasks || task.subtasks.length === 0) {
            return '<p style="color: var(--text-secondary); font-size: 0.75rem; text-align: center; padding: var(--spacing-sm);">No subtasks yet.</p>';
        }

        return task.subtasks.map(subtask => this.createSubtaskHTML(projectId, task.id, subtask)).join('');
    }

    createSubtaskHTML(projectId, taskId, subtask) {
        return `
            <div class="subtask-item" data-subtask-id="${subtask.id}">
                <div class="subtask-header">
                    <div class="subtask-info">
                        <h6>${subtask.name}</h6>
                        <div class="subtask-meta">
                            <span class="task-priority ${subtask.priority}">${subtask.priority}</span>
                            <span class="task-status ${subtask.status}">${subtask.status}</span>
                            ${subtask.dueDate ? `<span>📅 ${new Date(subtask.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="subtask-actions">
                        <button class="subtask-action-btn edit-subtask-btn" data-project-id="${projectId}" data-task-id="${taskId}" data-subtask-id="${subtask.id}">✏️</button>
                        <button class="subtask-action-btn complete-subtask-btn" data-project-id="${projectId}" data-task-id="${taskId}" data-subtask-id="${subtask.id}">✅</button>
                        <button class="subtask-action-btn add-nested-subtask-btn" data-project-id="${projectId}" data-task-id="${taskId}" data-subtask-id="${subtask.id}">+</button>
                    </div>
                </div>
                
                ${subtask.description ? `<div class="subtask-description">${subtask.description}</div>` : ''}
                
                <!-- Nested Subtasks (subtasks under subtasks) -->
                ${subtask.nestedSubtasks && subtask.nestedSubtasks.length > 0 ? `
                    <div class="nested-subtasks">
                        ${subtask.nestedSubtasks.map(nestedSubtask => this.createNestedSubtaskHTML(projectId, taskId, subtask.id, nestedSubtask)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createNestedSubtaskHTML(projectId, taskId, parentSubtaskId, nestedSubtask) {
        return `
            <div class="nested-subtask-item" data-nested-subtask-id="${nestedSubtask.id}">
                <div class="nested-subtask-info">
                    <h6>${nestedSubtask.name}</h6>
                    <div class="nested-subtask-meta">
                        <span class="task-priority ${nestedSubtask.priority}">${nestedSubtask.priority}</span>
                        <span class="task-status ${nestedSubtask.status}">${nestedSubtask.status}</span>
                        ${nestedSubtask.dueDate ? `<span>📅 ${new Date(nestedSubtask.dueDate).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
                
                ${nestedSubtask.description ? `<div class="subtask-description">${nestedSubtask.description}</div>` : ''}
                
                <div class="subtask-actions">
                    <button class="subtask-action-btn edit-subtask-btn" data-project-id="${projectId}" data-task-id="${taskId}" data-subtask-id="${nestedSubtask.id}">✏️</button>
                    <button class="subtask-action-btn complete-subtask-btn" data-project-id="${projectId}" data-task-id="${taskId}" data-subtask-id="${nestedSubtask.id}">✅</button>
                </div>
            </div>
        `;
    }

    showTaskModal(projectId, task = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('taskModalTitle');
        const deleteBtn = document.getElementById('deleteTask');
        
        if (!modal) return;

        this.currentProject = this.projects.find(p => p.id === projectId);
        this.currentTask = task;

        if (task) {
            modalTitle.textContent = 'Edit Task';
            deleteBtn.style.display = 'block';
            this.populateTaskForm(task);
        } else {
            modalTitle.textContent = 'Add New Task';
            deleteBtn.style.display = 'none';
            this.clearTaskForm();
        }

        modal.style.display = 'flex';
    }

    hideTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentTask = null;
    }

    populateTaskForm(task) {
        const nameEl = document.getElementById('taskName');
        const descEl = document.getElementById('taskDescription');
        const priorityEl = document.getElementById('taskPriority');
        const statusEl = document.getElementById('taskStatus');
        const dueDateEl = document.getElementById('taskDueDate');

        if (nameEl) nameEl.value = task.name || '';
        if (descEl) descEl.value = task.description || '';
        if (priorityEl) priorityEl.value = task.priority || 'medium';
        if (statusEl) statusEl.value = task.status || 'todo';
        if (dueDateEl) dueDateEl.value = task.dueDate ? task.dueDate.split('T')[0] : '';
    }

    clearTaskForm() {
        const nameEl = document.getElementById('taskName');
        const descEl = document.getElementById('taskDescription');
        const priorityEl = document.getElementById('taskPriority');
        const statusEl = document.getElementById('taskStatus');
        const dueDateEl = document.getElementById('taskDueDate');

        if (nameEl) nameEl.value = '';
        if (descEl) descEl.value = '';
        if (priorityEl) priorityEl.value = 'medium';
        if (statusEl) statusEl.value = 'todo';
        if (dueDateEl) dueDateEl.value = '';
    }

    saveTask() {
        const nameEl = document.getElementById('taskName');
        const descEl = document.getElementById('taskDescription');
        const priorityEl = document.getElementById('taskPriority');
        const statusEl = document.getElementById('taskStatus');
        const dueDateEl = document.getElementById('taskDueDate');

        if (!nameEl || !descEl || !priorityEl || !statusEl || !dueDateEl) return;

        const name = nameEl.value.trim();
        const description = descEl.value.trim();
        const priority = priorityEl.value;
        const status = statusEl.value;
        const dueDate = dueDateEl.value;

        if (!name) {
            alert('Task name is required');
            return;
        }

        const taskData = {
            name,
            description,
            priority,
            status,
            dueDate: dueDate || null,
            updatedAt: new Date().toISOString()
        };

        if (this.currentTask) {
            const taskIndex = this.currentProject.tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                this.currentProject.tasks[taskIndex] = { ...this.currentTask, ...taskData };
            }
        } else {
            taskData.id = this.generateId();
            taskData.createdAt = new Date().toISOString();
            taskData.subtasks = [];
            
            if (!this.currentProject.tasks) {
                this.currentProject.tasks = [];
            }
            this.currentProject.tasks.push(taskData);
        }

        this.saveProjects();
        this.updateStats();
        this.renderProjects();
        this.hideTaskModal();
        alert('Task saved successfully!');
    }

    deleteTask() {
        if (!this.currentTask) return;

        if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTaskById(this.currentProject.id, this.currentTask.id);
            this.hideTaskModal();
        }
    }

    completeTask(projectId, taskId) {
        if (confirm('Mark this task as completed?')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project && project.tasks) {
                const task = project.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = 'done';
                    task.completedAt = new Date().toISOString();
                    this.saveProjects();
                    this.updateProjectProgress();
                    this.renderTasksInModal(project);
                    this.renderProjects();
                    
                    // Find the complete button to trigger celebration
                    const completeBtn = document.querySelector(`[data-task-id="${taskId}"].complete-task-btn`);
                    if (completeBtn) {
                        this.celebrateCompletion(completeBtn, task.name, 'Task');
                    }
                    
                    alert('Task marked as completed!');
                }
            }
        }
    }

    deleteTaskById(projectId, taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project && project.tasks) {
                project.tasks = project.tasks.filter(t => t.id !== taskId);
                this.saveProjects();
                this.updateStats();
                this.renderProjects();
                alert('Task deleted successfully!');
            }
        }
    }

    showSubtaskModal(projectId, taskId, subtask = null, parentSubtaskId = null) {
        const modal = document.getElementById('subtaskModal');
        const modalTitle = document.getElementById('subtaskModalTitle');
        const deleteBtn = document.getElementById('deleteSubtask');
        
        if (!modal) return;

        this.currentProject = this.projects.find(p => p.id === projectId);
        this.currentTask = this.currentProject?.tasks?.find(t => t.id === taskId);
        this.currentSubtask = subtask;
        this.currentParentSubtaskId = parentSubtaskId;

        if (subtask) {
            modalTitle.textContent = 'Edit Subtask';
            deleteBtn.style.display = 'block';
            this.populateSubtaskForm(subtask);
        } else {
            modalTitle.textContent = parentSubtaskId ? 'Add Nested Subtask' : 'Add New Subtask';
            deleteBtn.style.display = 'none';
            this.clearSubtaskForm();
        }

        modal.style.display = 'flex';
    }

    hideSubtaskModal() {
        const modal = document.getElementById('subtaskModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentSubtask = null;
        this.currentParentSubtaskId = null;
    }

    populateSubtaskForm(subtask) {
        const nameEl = document.getElementById('subtaskName');
        const descEl = document.getElementById('subtaskDescription');
        const priorityEl = document.getElementById('subtaskPriority');
        const statusEl = document.getElementById('subtaskStatus');
        const dueDateEl = document.getElementById('subtaskDueDate');

        if (nameEl) nameEl.value = subtask.name || '';
        if (descEl) descEl.value = subtask.description || '';
        if (priorityEl) priorityEl.value = subtask.priority || 'medium';
        if (statusEl) statusEl.value = subtask.status || 'todo';
        if (dueDateEl) dueDateEl.value = subtask.dueDate ? subtask.dueDate.split('T')[0] : '';
    }

    clearSubtaskForm() {
        const nameEl = document.getElementById('subtaskName');
        const descEl = document.getElementById('subtaskDescription');
        const priorityEl = document.getElementById('subtaskPriority');
        const statusEl = document.getElementById('subtaskStatus');
        const dueDateEl = document.getElementById('subtaskDueDate');

        if (nameEl) nameEl.value = '';
        if (descEl) descEl.value = '';
        if (priorityEl) priorityEl.value = 'medium';
        if (statusEl) statusEl.value = 'todo';
        if (dueDateEl) dueDateEl.value = '';
    }

    saveSubtask() {
        const nameEl = document.getElementById('subtaskName');
        const descEl = document.getElementById('subtaskDescription');
        const priorityEl = document.getElementById('subtaskPriority');
        const statusEl = document.getElementById('subtaskStatus');
        const dueDateEl = document.getElementById('subtaskDueDate');

        if (!nameEl || !descEl || !priorityEl || !statusEl || !dueDateEl) return;

        const name = nameEl.value.trim();
        const description = descEl.value.trim();
        const priority = priorityEl.value;
        const status = statusEl.value;
        const dueDate = dueDateEl.value;

        if (!name) {
            alert('Subtask name is required');
            return;
        }

        const subtaskData = {
            name,
            description,
            priority,
            status,
            dueDate: dueDate || null,
            updatedAt: new Date().toISOString()
        };

        if (this.currentSubtask) {
            if (this.currentParentSubtaskId) {
                const parentSubtask = this.currentTask.subtasks.find(s => s.id === this.currentParentSubtaskId);
                if (parentSubtask) {
                    const nestedIndex = parentSubtask.nestedSubtasks.findIndex(s => s.id === this.currentSubtask.id);
                    if (nestedIndex !== -1) {
                        parentSubtask.nestedSubtasks[nestedIndex] = { ...this.currentSubtask, ...subtaskData };
                    }
                }
            } else {
                const subtaskIndex = this.currentTask.subtasks.findIndex(s => s.id === this.currentSubtask.id);
                if (subtaskIndex !== -1) {
                    this.currentTask.subtasks[subtaskIndex] = { ...this.currentSubtask, ...subtaskData };
                }
            }
        } else {
            subtaskData.id = this.generateId();
            subtaskData.createdAt = new Date().toISOString();

            if (this.currentParentSubtaskId) {
                const parentSubtask = this.currentTask.subtasks.find(s => s.id === this.currentParentSubtaskId);
                if (parentSubtask) {
                    if (!parentSubtask.nestedSubtasks) {
                        parentSubtask.nestedSubtasks = [];
                    }
                    parentSubtask.nestedSubtasks.push(subtaskData);
                }
            } else {
                if (!this.currentTask.subtasks) {
                    this.currentTask.subtasks = [];
                }
                subtaskData.nestedSubtasks = [];
                this.currentTask.subtasks.push(subtaskData);
            }
        }

        this.saveProjects();
        this.updateStats();
        this.renderProjects();
        this.hideSubtaskModal();
        alert('Subtask saved successfully!');
    }

    deleteSubtask() {
        if (!this.currentSubtask) return;

        if (confirm('Are you sure you want to delete this subtask?')) {
            this.deleteSubtaskById(this.currentProject.id, this.currentTask.id, this.currentSubtask.id);
            this.hideSubtaskModal();
        }
    }

    completeSubtask(projectId, taskId, subtaskId) {
        if (confirm('Mark this subtask as completed?')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project && project.tasks) {
                const task = project.tasks.find(t => t.id === taskId);
                if (task && task.subtasks) {
                    // Find subtask (could be nested)
                    const subtask = this.findSubtaskRecursively(task.subtasks, subtaskId);
                    if (subtask) {
                        subtask.status = 'done';
                        subtask.completedAt = new Date().toISOString();
                        this.saveProjects();
                        this.updateProjectProgress();
                        this.renderTasksInModal(project);
                        this.renderProjects();
                        
                        // Find the complete button to trigger celebration
                        const completeBtn = document.querySelector(`[data-subtask-id="${subtaskId}"].complete-subtask-btn`);
                        if (completeBtn) {
                            this.celebrateCompletion(completeBtn, subtask.name, 'Subtask');
                        }
                        
                        alert('Subtask marked as completed!');
                    }
                }
            }
        }
    }

    deleteSubtaskById(projectId, taskId, subtaskId) {
        if (confirm('Are you sure you want to delete this subtask?')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project && project.tasks) {
                const task = project.tasks.find(t => t.id === taskId);
                if (task && task.subtasks) {
                    for (let subtask of task.subtasks) {
                        if (subtask.nestedSubtasks) {
                            const nestedIndex = subtask.nestedSubtasks.findIndex(s => s.id === subtaskId);
                            if (nestedIndex !== -1) {
                                subtask.nestedSubtasks.splice(nestedIndex, 1);
                                this.saveProjects();
                                this.updateStats();
                                this.renderProjects();
                                alert('Subtask deleted successfully!');
                                return;
                            }
                        }
                    }
                    
                    const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
                    if (subtaskIndex !== -1) {
                        task.subtasks.splice(subtaskIndex, 1);
                        this.saveProjects();
                        this.updateStats();
                        this.renderProjects();
                        alert('Subtask deleted successfully!');
                    }
                }
            }
        }
    }

    // Task Management in Project Modal
    renderTasksInModal(project) {
        const tasksListInModal = document.getElementById('tasksListInModal');
        if (!tasksListInModal) return;

        if (!project.tasks || project.tasks.length === 0) {
            tasksListInModal.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: var(--spacing-md);">No tasks yet. Add your first task to get started!</p>';
            return;
        }

        tasksListInModal.innerHTML = project.tasks.map(task => this.createTaskHTMLInModal(task)).join('');
    }

    createTaskHTMLInModal(task) {
        return `
            <div class="task-item-in-modal" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox-section">
                        <input type="checkbox" 
                               class="task-checkbox" 
                               data-task-id="${task.id}" 
                               ${task.status === 'done' ? 'checked' : ''}>
                        <div class="task-info">
                            <h5 class="task-name ${task.status === 'done' ? 'completed' : ''}">${task.name}</h5>
                            <div class="task-meta">
                                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                <span class="task-status status-${task.status}">${task.status}</span>
                                ${task.dueDate ? `<span class="task-due-date">📅 ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                            </div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit-task-in-modal" data-task-id="${task.id}" title="Edit Task">✏️</button>
                        <button class="task-action-btn complete-task-in-modal" data-task-id="${task.id}" title="Complete Task">✅</button>
                        <button class="task-action-btn add-subtask-in-modal" data-task-id="${task.id}" title="Add Subtask">+ Subtask</button>
                    </div>
                </div>
                
                <!-- Subtasks Section -->
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="subtasks-section-modal">
                        <h6>Subtasks (${task.subtasks.length})</h6>
                        <div class="subtasks-list-modal">
                            ${task.subtasks.map(subtask => this.createSubtaskHTMLInModal(task.id, subtask)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showTaskFormInModal() {
        const taskForm = document.getElementById('taskFormInModal');
        if (taskForm) {
            taskForm.style.display = 'block';
        }
    }

    hideTaskFormInModal() {
        const taskForm = document.getElementById('taskFormInModal');
        if (taskForm) {
            taskForm.style.display = 'none';
            this.clearTaskFormInModal();
        }
    }

    clearTaskFormInModal() {
        const nameEl = document.getElementById('taskNameInModal');
        const descEl = document.getElementById('taskDescriptionInModal');
        const priorityEl = document.getElementById('taskPriorityInModal');
        const statusEl = document.getElementById('taskStatusInModal');
        const dueDateEl = document.getElementById('taskDueDateInModal');

        if (nameEl) nameEl.value = '';
        if (descEl) descEl.value = '';
        if (priorityEl) priorityEl.value = 'medium';
        if (statusEl) statusEl.value = 'todo';
        if (dueDateEl) dueDateEl.value = '';
    }

    saveTaskInModal() {
        const nameEl = document.getElementById('taskNameInModal');
        const descEl = document.getElementById('taskDescriptionInModal');
        const priorityEl = document.getElementById('taskPriorityInModal');
        const statusEl = document.getElementById('taskStatusInModal');
        const dueDateEl = document.getElementById('taskDueDateInModal');

        if (!nameEl || !descEl || !priorityEl || !statusEl || !dueDateEl) return;

        const name = nameEl.value.trim();
        const description = descEl.value.trim();
        const priority = priorityEl.value;
        const status = statusEl.value;
        const dueDate = dueDateEl.value;

        if (!name) {
            alert('Task name is required');
            return;
        }

        const taskData = {
            name,
            description,
            priority,
            status,
            dueDate: dueDate || null,
            updatedAt: new Date().toISOString()
        };

        if (!this.currentProject.tasks) {
            this.currentProject.tasks = [];
        }

        taskData.id = this.generateId();
        taskData.createdAt = new Date().toISOString();
        taskData.subtasks = [];
        
        this.currentProject.tasks.push(taskData);

        this.saveProjects();
        this.renderTasksInModal(this.currentProject);
        this.updateProjectProgress(); // Auto-update progress
        this.renderProjects(); // Update main project display
        this.hideTaskFormInModal();
    }

    createSubtaskHTMLInModal(taskId, subtask, level = 0) {
        if (level >= 10) return ''; // Prevent infinite nesting beyond 10 levels
        
        const indentClass = `subtask-level-${level}`;
        const hasNestedSubtasks = subtask.nestedSubtasks && subtask.nestedSubtasks.length > 0;
        
        return `
            <div class="subtask-item-in-modal ${indentClass}" data-subtask-id="${subtask.id}" data-level="${level}">
                <div class="subtask-header">
                    <div class="subtask-checkbox-section">
                        <input type="checkbox" 
                               class="subtask-checkbox" 
                               data-task-id="${taskId}" 
                               data-subtask-id="${subtask.id}" 
                               data-level="${level}"
                               ${subtask.status === 'done' ? 'checked' : ''}>
                        <div class="subtask-info">
                            <h6 class="subtask-name ${subtask.status === 'done' ? 'completed' : ''}">${subtask.name}</h6>
                            <div class="subtask-meta">
                                <span class="task-priority priority-${subtask.priority}">${subtask.priority}</span>
                                <span class="task-status status-${subtask.status}">${subtask.status}</span>
                                ${subtask.dueDate ? `<span class="task-due-date">📅 ${new Date(subtask.dueDate).toLocaleDateString()}</span>` : ''}
                                <span class="nesting-level">Level ${level + 1}</span>
                            </div>
                            ${subtask.description ? `<div class="subtask-description">${subtask.description}</div>` : ''}
                        </div>
                    </div>
                    <div class="subtask-actions">
                        <button class="task-action-btn edit-subtask-in-modal" data-task-id="${taskId}" data-subtask-id="${subtask.id}" data-level="${level}">✏️</button>
                        <button class="task-action-btn complete-subtask-in-modal" data-task-id="${taskId}" data-subtask-id="${subtask.id}" data-level="${level}">✅</button>
                        ${level < 9 ? `<button class="task-action-btn add-nested-subtask-in-modal" data-task-id="${taskId}" data-subtask-id="${subtask.id}" data-level="${level}">+ Nested</button>` : ''}
                    </div>
                </div>
                ${subtask.description ? `<div class="subtask-description">${subtask.description}</div>` : ''}
                
                <!-- Nested Subtasks (recursive) -->
                ${hasNestedSubtasks ? `
                    <div class="nested-subtasks-container">
                        ${subtask.nestedSubtasks.map(nestedSubtask => this.createSubtaskHTMLInModal(taskId, nestedSubtask, level + 1)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    handleTaskActionInModal(e) {
        if (e.target.classList.contains('edit-task-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task) {
                this.populateTaskFormInModal(task);
                this.showTaskFormInModal();
            }
        } else if (e.target.classList.contains('complete-task-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = 'done';
                task.completedAt = new Date().toISOString();
                this.saveProjects();
                this.renderTasksInModal(this.currentProject);
                this.updateProjectProgress(); // Auto-update progress
                this.renderProjects(); // Update main project display
                
                // Trigger celebration animation
                this.celebrateCompletion(e.target, task.name, 'Task');
                
                alert('Task marked as completed!');
            }
        } else if (e.target.classList.contains('delete-task-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            this.currentProject.tasks = this.currentProject.tasks.filter(t => t.id !== taskId);
            this.saveProjects();
            this.renderTasksInModal(this.currentProject);
            this.updateProjectProgress(); // Auto-update progress
            this.renderProjects(); // Update main project display
        } else if (e.target.classList.contains('add-subtask-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            this.showSubtaskFormInModal(taskId);
        } else if (e.target.classList.contains('add-nested-subtask-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const parentSubtaskId = e.target.getAttribute('data-subtask-id');
            const level = parseInt(e.target.getAttribute('data-level')) || 0;
            this.showSubtaskFormInModal(taskId, parentSubtaskId, level + 1);
        } else if (e.target.classList.contains('edit-subtask-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const subtaskId = e.target.getAttribute('data-subtask-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            const subtask = task?.subtasks?.find(s => s.id === subtaskId);
            if (subtask) {
                this.populateSubtaskFormInModal(subtask);
                this.showSubtaskFormInModal(taskId);
            }
        } else if (e.target.classList.contains('complete-subtask-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const subtaskId = e.target.getAttribute('data-subtask-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            const subtask = this.findSubtaskRecursively(task?.subtasks, subtaskId);
            if (subtask) {
                subtask.status = 'done';
                subtask.completedAt = new Date().toISOString();
                this.saveProjects();
                this.renderTasksInModal(this.currentProject);
                this.updateProjectProgress(); // Auto-update progress
                this.renderProjects(); // Update main project display
                
                // Trigger celebration animation
                this.celebrateCompletion(e.target, subtask.name, 'Subtask');
                
                alert('Subtask marked as completed!');
            }
        } else if (e.target.classList.contains('delete-subtask-in-modal')) {
            const taskId = e.target.getAttribute('data-task-id');
            const subtaskId = e.target.getAttribute('data-subtask-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task && task.subtasks) {
                task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
                this.saveProjects();
                this.renderTasksInModal(this.currentProject);
                this.updateProjectProgress(); // Auto-update progress
                this.renderProjects(); // Update main project display
            }
        } else if (e.target.classList.contains('task-checkbox')) {
            // Handle task checkbox toggle
            const taskId = e.target.getAttribute('data-task-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = e.target.checked ? 'done' : 'todo';
                this.saveProjects();
                this.renderTasksInModal(this.currentProject);
                this.updateProjectProgress();
                this.renderProjects(); // Update main project display
            }
        } else if (e.target.classList.contains('subtask-checkbox')) {
            // Handle subtask checkbox toggle (works at any nesting level)
            const taskId = e.target.getAttribute('data-task-id');
            const subtaskId = e.target.getAttribute('data-subtask-id');
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            const subtask = this.findSubtaskRecursively(task?.subtasks, subtaskId);
            if (subtask) {
                subtask.status = e.target.checked ? 'done' : 'todo';
                this.saveProjects();
                this.renderTasksInModal(this.currentProject);
                this.updateProjectProgress();
                this.renderProjects(); // Update main project display
            }
        }
    }

    populateTaskFormInModal(task) {
        const nameEl = document.getElementById('taskNameInModal');
        const descEl = document.getElementById('taskDescriptionInModal');
        const priorityEl = document.getElementById('taskPriorityInModal');
        const statusEl = document.getElementById('taskStatusInModal');
        const dueDateEl = document.getElementById('taskDueDateInModal');

        if (nameEl) nameEl.value = task.name || '';
        if (descEl) descEl.value = task.description || '';
        if (priorityEl) priorityEl.value = task.priority || 'medium';
        if (statusEl) statusEl.value = task.status || 'todo';
        if (dueDateEl) dueDateEl.value = task.dueDate ? task.dueDate.split('T')[0] : '';
    }

    // Subtask Management in Modal
    showSubtaskFormInModal(taskId, parentSubtaskId = null, level = 0) {
        const subtaskForm = document.getElementById('subtaskFormInModal');
        if (subtaskForm) {
            subtaskForm.style.display = 'block';
            this.currentTaskId = taskId;
            this.currentParentSubtaskId = parentSubtaskId;
            this.currentSubtaskLevel = level;
            
            // Update form title to show nesting level
            const formTitle = subtaskForm.querySelector('h5');
            if (formTitle) {
                if (parentSubtaskId) {
                    formTitle.textContent = `Add Nested Subtask (Level ${level + 1})`;
                } else {
                    formTitle.textContent = 'Add/Edit Subtask';
                }
            }
        }
    }

    hideSubtaskFormInModal() {
        const subtaskForm = document.getElementById('subtaskFormInModal');
        if (subtaskForm) {
            subtaskForm.style.display = 'none';
            this.clearSubtaskFormInModal();
            this.currentParentSubtaskId = null;
            this.currentSubtaskLevel = 0;
        }
    }

    clearSubtaskFormInModal() {
        const nameEl = document.getElementById('subtaskNameInModal');
        const descEl = document.getElementById('subtaskDescriptionInModal');
        const priorityEl = document.getElementById('subtaskPriorityInModal');
        const statusEl = document.getElementById('subtaskStatusInModal');
        const dueDateEl = document.getElementById('subtaskDueDateInModal');

        if (nameEl) nameEl.value = '';
        if (descEl) descEl.value = '';
        if (priorityEl) priorityEl.value = 'medium';
        if (statusEl) statusEl.value = 'todo';
        if (dueDateEl) dueDateEl.value = '';
    }

    saveSubtaskInModal() {
        const nameEl = document.getElementById('subtaskNameInModal');
        const descEl = document.getElementById('subtaskDescriptionInModal');
        const priorityEl = document.getElementById('subtaskPriorityInModal');
        const statusEl = document.getElementById('subtaskStatusInModal');
        const dueDateEl = document.getElementById('subtaskDueDateInModal');

        if (!nameEl || !descEl || !priorityEl || !statusEl || !dueDateEl) return;

        const name = nameEl.value.trim();
        const description = descEl.value.trim();
        const priority = priorityEl.value;
        const status = statusEl.value;
        const dueDate = dueDateEl.value;

        if (!name) {
            alert('Subtask name is required');
            return;
        }

        const subtaskData = {
            name,
            description,
            priority,
            status,
            dueDate: dueDate || null,
            updatedAt: new Date().toISOString(),
            nestedSubtasks: []
        };

        const task = this.currentProject.tasks.find(t => t.id === this.currentTaskId);
        if (task) {
            subtaskData.id = this.generateId();
            subtaskData.createdAt = new Date().toISOString();
            
            if (this.currentParentSubtaskId) {
                // Add nested subtask under a parent subtask
                const parentSubtask = this.findSubtaskRecursively(task.subtasks, this.currentParentSubtaskId);
                if (parentSubtask) {
                    if (!parentSubtask.nestedSubtasks) {
                        parentSubtask.nestedSubtasks = [];
                    }
                    parentSubtask.nestedSubtasks.push(subtaskData);
                }
            } else {
                // Add subtask directly under the task
                if (!task.subtasks) {
                    task.subtasks = [];
                }
                task.subtasks.push(subtaskData);
            }

            this.saveProjects();
            this.renderTasksInModal(this.currentProject);
            this.updateProjectProgress(); // Auto-update progress
            this.renderProjects(); // Update main project display
            this.hideSubtaskFormInModal();
        }
    }

    populateSubtaskFormInModal(subtask) {
        const nameEl = document.getElementById('subtaskNameInModal');
        const descEl = document.getElementById('subtaskDescriptionInModal');
        const priorityEl = document.getElementById('subtaskPriorityInModal');
        const statusEl = document.getElementById('subtaskStatusInModal');
        const dueDateEl = document.getElementById('subtaskDueDateInModal');

        if (nameEl) nameEl.value = subtask.name || '';
        if (descEl) descEl.value = subtask.description || '';
        if (priorityEl) priorityEl.value = subtask.priority || 'medium';
        if (statusEl) statusEl.value = subtask.status || 'todo';
        if (dueDateEl) dueDateEl.value = subtask.dueDate ? subtask.dueDate.split('T')[0] : '';
    }

    // Recursive method to find subtask at any nesting level
    findSubtaskRecursively(subtasks, subtaskId) {
        if (!subtasks) return null;
        
        for (let subtask of subtasks) {
            if (subtask.id === subtaskId) {
                return subtask;
            }
            if (subtask.nestedSubtasks && subtask.nestedSubtasks.length > 0) {
                const found = this.findSubtaskRecursively(subtask.nestedSubtasks, subtaskId);
                if (found) return found;
            }
        }
        return null;
    }

    // Recursive method to count all subtasks at all levels
    countSubtasksRecursively(subtasks) {
        if (!subtasks) return 0;
        
        let count = 0;
        for (let subtask of subtasks) {
            count++; // Count this subtask
            if (subtask.nestedSubtasks && subtask.nestedSubtasks.length > 0) {
                count += this.countSubtasksRecursively(subtask.nestedSubtasks);
            }
        }
        return count;
    }

    // Auto-calculate project progress based on tasks and subtasks
    calculateProjectProgress(project) {
        if (!project.tasks || project.tasks.length === 0) {
            return 0;
        }

        let totalItems = 0;
        let completedItems = 0;

        project.tasks.forEach(task => {
            totalItems++; // Count the task itself
            
            // Count all subtasks recursively
            if (task.subtasks && task.subtasks.length > 0) {
                totalItems += this.countSubtasksRecursively(task.subtasks);
                completedItems += this.countCompletedSubtasksRecursively(task.subtasks);
            }

            // Count completed tasks
            if (task.status === 'done') {
                completedItems++;
            }
        });

        return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    }

    // Helper method to count completed subtasks recursively
    countCompletedSubtasksRecursively(subtasks) {
        if (!subtasks) return 0;
        
        let completedCount = 0;
        for (let subtask of subtasks) {
            if (subtask.status === 'done') {
                completedCount++;
            }
            if (subtask.nestedSubtasks && subtask.nestedSubtasks.length > 0) {
                completedCount += this.countCompletedSubtasksRecursively(subtask.nestedSubtasks);
            }
        }
        return completedCount;
    }

    // Update project progress automatically
    updateProjectProgress() {
        if (this.currentProject) {
            const newProgress = this.calculateProjectProgress(this.currentProject);
            const progressEl = document.getElementById('projectProgress');
            const progressValueEl = document.getElementById('progressValue');
            
            if (progressEl) progressEl.value = newProgress;
            if (progressValueEl) progressValueEl.textContent = newProgress + '%';
            
            this.currentProject.progress = newProgress;
            
            // Update the project in the main array
            const projectIndex = this.projects.findIndex(p => p.id === this.currentProject.id);
            if (projectIndex !== -1) {
                this.projects[projectIndex].progress = newProgress;
            }
        }
    }

    handleProjectAction(e) {
        const projectId = e.target.closest('[data-project-id]')?.getAttribute('data-project-id');
        const taskId = e.target.closest('[data-task-id]')?.getAttribute('data-task-id');
        const subtaskId = e.target.closest('[data-subtask-id]')?.getAttribute('data-subtask-id');
        
        if (e.target.classList.contains('edit-btn')) {
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                this.showProjectModal(project);
            }
        } else if (e.target.classList.contains('complete-btn')) {
            this.completeProject(projectId);
        } else if (e.target.classList.contains('add-task-btn')) {
            this.showTaskModal(projectId);
        } else if (e.target.classList.contains('edit-task-btn')) {
            const project = this.projects.find(p => p.id === projectId);
            const task = project?.tasks?.find(t => t.id === taskId);
            if (task) {
                this.showTaskModal(projectId, task);
            }
        } else if (e.target.classList.contains('complete-task-btn')) {
            this.completeTask(projectId, taskId);
        } else if (e.target.classList.contains('add-subtask-btn')) {
            this.showSubtaskModal(projectId, taskId);
        } else if (e.target.classList.contains('edit-subtask-btn')) {
            const project = this.projects.find(p => p.id === projectId);
            const task = project?.tasks?.find(t => t.id === taskId);
            const subtask = task?.subtasks?.find(s => s.id === subtaskId);
            if (subtask) {
                this.showSubtaskModal(projectId, taskId, subtask);
            }
        } else if (e.target.classList.contains('complete-subtask-btn')) {
            this.completeSubtask(projectId, taskId, subtaskId);
        } else if (e.target.classList.contains('delete-subtask-btn')) {
            this.deleteSubtaskById(projectId, taskId, subtaskId);
        } else if (e.target.classList.contains('add-nested-subtask-btn')) {
            this.showSubtaskModal(projectId, taskId, null, subtaskId); // subtaskId becomes parent subtask ID
        }
    }

    generateId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    /**
     * Create celebration animation when project/task/subtask is completed
     */
    celebrateCompletion(element, itemName, itemType) {
        // Add bounce animation to button
        element.classList.add('complete-btn-bounce');
        setTimeout(() => {
            element.classList.remove('complete-btn-bounce');
        }, 400);

        // Create confetti explosion
        this.createConfettiExplosion(element);
        
        // Create celebration ring effect
        this.createCelebrationRing(element);
        
        // Create sparkle effects
        this.createSparkleEffects(element);
        
        // Show success message
        this.showSuccessMessage(itemName, itemType);
    }

    /**
     * Create confetti explosion effect
     */
    createConfettiExplosion(sourceElement) {
        const confettiContainer = document.getElementById('confettiContainer');
        if (!confettiContainer) return;

        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Beautiful color palette for confetti
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
            '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894',
            '#e84393', '#6c5ce7', '#00cec9', '#ffeaa7', '#fab1a0', '#55a3ff'
        ];

        // Create MASSIVE confetti explosion from both sides of the screen!
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Create 60 confetti pieces - 30 from each side for ultimate celebration!
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            let startX, startY;
            
            if (i < 30) {
                // First 30 pieces: Start from LEFT SIDE of screen
                startX = -20 + Math.random() * 50; // Start from left edge
                startY = Math.random() * windowHeight * 0.3; // Top 30% of screen
            } else {
                // Next 30 pieces: Start from RIGHT SIDE of screen
                startX = windowWidth - 30 + Math.random() * 50; // Start from right edge
                startY = Math.random() * windowHeight * 0.3; // Top 30% of screen
            }
            
            confetti.style.left = startX + 'px';
            confetti.style.top = startY + 'px';
            
            // Random color from our palette
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.background = randomColor;
            
            // Bigger size variation for more impact
            const size = 8 + Math.random() * 8;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Staggered animation delays for wave effect
            confetti.style.animationDelay = Math.random() * 1.2 + 's';
            
            // Add horizontal movement for side-to-side effect
            const horizontalMovement = (i < 30) ? 
                `${200 + Math.random() * 300}px` : // Left side moves right
                `${-200 - Math.random() * 300}px`; // Right side moves left
            
            confetti.style.setProperty('--horizontal-drift', horizontalMovement);
            
            confettiContainer.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }

    /**
     * Create MEGA celebration ring effects
     */
    createCelebrationRing(sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create 3 expanding rings for ultimate impact!
        const ringColors = ['#ff6b6b', '#4ecdc4', '#feca57']; // Red, teal, yellow
        
        ringColors.forEach((color, index) => {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.className = 'celebration-ring';
                ring.style.left = (centerX - 25) + 'px';
                ring.style.top = (centerY - 25) + 'px';
                ring.style.width = '50px';
                ring.style.height = '50px';
                ring.style.borderColor = color;
                ring.style.boxShadow = `0 0 20px ${color}`;
                
                // Slightly different animation timing for each ring
                ring.style.animationDelay = (index * 0.1) + 's';
                ring.style.animationDuration = (0.6 + index * 0.1) + 's';

                document.body.appendChild(ring);

                setTimeout(() => {
                    if (ring.parentNode) {
                        ring.parentNode.removeChild(ring);
                    }
                }, 800 + index * 100);
            }, index * 150); // Stagger the rings
        });
    }

    /**
     * Create sparkle effects
     */
    createSparkleEffects(sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create MEGA sparkles all around the screen!
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            // Create sparkles in a wider radius for more spectacular effect
            const angle = (i * 30) * (Math.PI / 180); // 30 degrees apart (12 sparkles)
            const distance = 80 + Math.random() * 120; // Much wider spread
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            sparkle.style.left = (x - 6) + 'px';
            sparkle.style.top = (y - 6) + 'px';
            
            // Random animation delay for wave effect
            sparkle.style.animationDelay = Math.random() * 0.6 + 's';
            
            document.body.appendChild(sparkle);

            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1500);
        }
        
        // Add corner sparkles for full-screen coverage!
        const corners = [
            { x: 50, y: 50 }, // Top-left
            { x: window.innerWidth - 50, y: 50 }, // Top-right
            { x: 50, y: window.innerHeight - 50 }, // Bottom-left
            { x: window.innerWidth - 50, y: window.innerHeight - 50 } // Bottom-right
        ];
        
        corners.forEach((corner, index) => {
            setTimeout(() => {
                const cornerSparkle = document.createElement('div');
                cornerSparkle.className = 'sparkle';
                cornerSparkle.style.left = (corner.x - 6) + 'px';
                cornerSparkle.style.top = (corner.y - 6) + 'px';
                cornerSparkle.style.animationDelay = '0s';
                
                document.body.appendChild(cornerSparkle);
                
                setTimeout(() => {
                    if (cornerSparkle.parentNode) {
                        cornerSparkle.parentNode.removeChild(cornerSparkle);
                    }
                }, 1500);
            }, index * 200); // Stagger corner sparkles
        });
    }

    /**
     * Show success message
     */
    showSuccessMessage(itemName, itemType) {
        const message = document.createElement('div');
        message.className = 'success-message';
        
        // Random celebration emojis for variety
        const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🔥', '💪', '🏆', '🥳', '🎯'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        message.innerHTML = `
            <span class="success-icon">${randomEmoji}</span>
            <span>${itemType} "${itemName}" completed!</span>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    // ===== TIMER FUNCTIONALITY =====

    initTimer() {
        // Setup timer event listeners
        const openTimerBtn = document.getElementById('openTimer');
        const closeTimerBtn = document.getElementById('closeTimer');
        const minimizeTimerBtn = document.getElementById('minimizeTimer');
        const maximizeTimerBtn = document.getElementById('maximizeTimer');
        const startTimerBtn = document.getElementById('startTimer');
        const pauseTimerBtn = document.getElementById('pauseTimer');
        const resetTimerBtn = document.getElementById('resetTimer');
        const saveTimerBtn = document.getElementById('saveTimer');
        const toggleSessionsBtn = document.getElementById('toggleSessions');

        if (openTimerBtn) {
            openTimerBtn.addEventListener('click', () => this.openTimer());
        }

        if (closeTimerBtn) {
            closeTimerBtn.addEventListener('click', () => this.closeTimer());
        }

        if (minimizeTimerBtn) {
            minimizeTimerBtn.addEventListener('click', () => this.minimizeTimer());
        }

        if (maximizeTimerBtn) {
            maximizeTimerBtn.addEventListener('click', () => this.maximizeTimer());
        }

        if (startTimerBtn) {
            startTimerBtn.addEventListener('click', () => this.startTimer());
        }

        if (pauseTimerBtn) {
            pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        }

        if (resetTimerBtn) {
            resetTimerBtn.addEventListener('click', () => this.resetTimer());
        }

        if (saveTimerBtn) {
            saveTimerBtn.addEventListener('click', () => this.saveTimerSession());
        }

        if (toggleSessionsBtn) {
            toggleSessionsBtn.addEventListener('click', () => this.toggleSessionsList());
        }

        // Update timer display
        this.updateTimerDisplay();
        
        // Render saved sessions
        this.renderSavedSessions();
        
        // Setup page visibility and unload handlers
        this.setupPageHandlers();
    }

    openTimer() {
        const timerPopup = document.getElementById('timerPopup');
        const minimizedTimer = document.getElementById('minimizedTimer');
        
        if (timerPopup) {
            timerPopup.classList.remove('hidden');
        }
        
        if (minimizedTimer) {
            minimizedTimer.classList.add('hidden');
        }
    }

    closeTimer() {
        const timerPopup = document.getElementById('timerPopup');
        const minimizedTimer = document.getElementById('minimizedTimer');
        
        if (timerPopup) {
            timerPopup.classList.add('hidden');
        }
        
        if (minimizedTimer) {
            minimizedTimer.classList.add('hidden');
        }
        
        // If timer is running, keep it running but just hide the UI
    }

    minimizeTimer() {
        const timerPopup = document.getElementById('timerPopup');
        const minimizedTimer = document.getElementById('minimizedTimer');
        
        if (timerPopup) {
            timerPopup.classList.add('hidden');
        }
        
        if (minimizedTimer) {
            minimizedTimer.classList.remove('hidden');
        }
    }

    maximizeTimer() {
        const timerPopup = document.getElementById('timerPopup');
        const minimizedTimer = document.getElementById('minimizedTimer');
        
        if (timerPopup) {
            timerPopup.classList.remove('hidden');
        }
        
        if (minimizedTimer) {
            minimizedTimer.classList.add('hidden');
        }
    }

    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.startTime = Date.now() - this.timer.pausedTime;
            
            // Update button visibility
            const startBtn = document.getElementById('startTimer');
            const pauseBtn = document.getElementById('pauseTimer');
            
            if (startBtn) startBtn.classList.add('hidden');
            if (pauseBtn) pauseBtn.classList.remove('hidden');
            
            // Start the timer interval
            this.timer.interval = setInterval(() => {
                this.updateTimerDisplay();
            }, 1000);
            
            // Start auto-saving timer state
            this.startAutoSave();
            
            // Save initial state
            this.saveTimerState();
            
            console.log('Timer started');
        }
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isRunning = false;
            this.timer.pausedTime = Date.now() - this.timer.startTime;
            
            // Update button visibility
            const startBtn = document.getElementById('startTimer');
            const pauseBtn = document.getElementById('pauseTimer');
            const saveBtn = document.getElementById('saveTimer');
            
            if (startBtn) startBtn.classList.remove('hidden');
            if (pauseBtn) pauseBtn.classList.add('hidden');
            if (saveBtn && this.timer.sessionTime > 0) saveBtn.classList.remove('hidden');
            
            // Clear the timer interval
            if (this.timer.interval) {
                clearInterval(this.timer.interval);
                this.timer.interval = null;
            }
            
            // Stop auto-saving and save final state
            this.stopAutoSave();
            this.saveTimerState();
            
            console.log('Timer paused');
        }
    }

    resetTimer() {
        // Add session time to total before resetting
        if (this.timer.sessionTime > 0) {
            this.timer.totalTime += this.timer.sessionTime;
            this.saveTotalTime();
        }
        
        // Reset timer
        this.timer.isRunning = false;
        this.timer.startTime = null;
        this.timer.pausedTime = 0;
        this.timer.sessionTime = 0;
        
        // Update button visibility
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        
        if (startBtn) startBtn.classList.remove('hidden');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        
        // Clear the timer interval
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
        
        // Stop auto-saving and save final state
        this.stopAutoSave();
        this.saveTimerState();
        
        // Update display
        this.updateTimerDisplay();
        
        console.log('Timer reset');
    }

    updateTimerDisplay() {
        // Calculate current session time
        if (this.timer.isRunning && this.timer.startTime) {
            this.timer.sessionTime = Date.now() - this.timer.startTime;
        } else if (!this.timer.isRunning && this.timer.pausedTime > 0) {
            this.timer.sessionTime = this.timer.pausedTime;
        }

        // Format times
        const sessionFormatted = this.formatTime(this.timer.sessionTime);
        const totalFormatted = this.formatTime(this.timer.totalTime + this.timer.sessionTime);

        // Update main timer display
        const hours = document.getElementById('timerHours');
        const minutes = document.getElementById('timerMinutes');
        const seconds = document.getElementById('timerSeconds');
        
        if (hours && minutes && seconds) {
            const parts = sessionFormatted.split(':');
            hours.textContent = parts[0];
            minutes.textContent = parts[1];
            seconds.textContent = parts[2];
        }

        // Update session and total time
        const sessionTimeEl = document.getElementById('sessionTime');
        const totalTimeEl = document.getElementById('totalTime');
        
        if (sessionTimeEl) sessionTimeEl.textContent = sessionFormatted;
        if (totalTimeEl) totalTimeEl.textContent = totalFormatted;

        // Update minimized timer display
        const miniTimerDisplay = document.getElementById('miniTimerDisplay');
        if (miniTimerDisplay) {
            miniTimerDisplay.textContent = sessionFormatted;
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    loadTotalTime() {
        const today = new Date().toDateString();
        const storedData = localStorage.getItem(`crm_timer_${today}`);
        return storedData ? parseInt(storedData) : 0;
    }

    saveTotalTime() {
        const today = new Date().toDateString();
        localStorage.setItem(`crm_timer_${today}`, this.timer.totalTime.toString());
    }

    // ===== TIMER STATE PERSISTENCE =====

    saveTimerState() {
        const timerState = {
            isRunning: this.timer.isRunning,
            startTime: this.timer.startTime,
            pausedTime: this.timer.pausedTime,
            sessionTime: this.timer.sessionTime,
            lastSaved: Date.now()
        };
        localStorage.setItem('crm_timer_state', JSON.stringify(timerState));
    }

    loadTimerState() {
        try {
            const savedState = localStorage.getItem('crm_timer_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Check if timer was running when last saved
                if (state.isRunning && state.startTime) {
                    // Calculate how much time has passed since last save
                    const timeSinceSave = Date.now() - state.lastSaved;
                    const newSessionTime = state.sessionTime + timeSinceSave;
                    
                    // Update timer state
                    this.timer.isRunning = true;
                    this.timer.startTime = Date.now() - newSessionTime;
                    this.timer.pausedTime = 0;
                    this.timer.sessionTime = newSessionTime;
                    
                    // Start the timer interval
                    this.timer.interval = setInterval(() => {
                        this.updateTimerDisplay();
                    }, 1000);
                    
                    console.log('Timer state restored and running');
                } else {
                    // Timer was paused, restore paused state
                    this.timer.isRunning = false;
                    this.timer.startTime = null;
                    this.timer.pausedTime = state.pausedTime || 0;
                    this.timer.sessionTime = state.sessionTime || 0;
                    
                    console.log('Timer state restored (paused)');
                }
                
                // Update display immediately
                this.updateTimerDisplay();
            }
        } catch (error) {
            console.error('Error loading timer state:', error);
        }
    }

    // Auto-save timer state every 5 seconds when running
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (this.timer.isRunning) {
                this.saveTimerState();
            }
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    setupPageHandlers() {
        // Save timer state when page becomes hidden (tab switch, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveTimerState();
                console.log('Timer state saved (page hidden)');
            }
        });

        // Save timer state before page unload (refresh, close tab, etc.)
        window.addEventListener('beforeunload', () => {
            this.saveTimerState();
            console.log('Timer state saved (page unload)');
        });

        // Save timer state when window loses focus
        window.addEventListener('blur', () => {
            this.saveTimerState();
            console.log('Timer state saved (window blur)');
        });
    }

    // ===== SAVED TIMER SESSIONS =====

    saveTimerSession() {
        const nameInput = document.getElementById('timerName');
        const sessionName = nameInput ? nameInput.value.trim() : '';
        
        if (this.timer.sessionTime <= 0) {
            alert('No time to save! Start the timer first.');
            return;
        }

        // Use provided name or generate a default one
        const finalName = sessionName || `Session ${new Date().toLocaleTimeString()}`;
        
        const session = {
            id: Date.now().toString(),
            name: finalName,
            duration: this.timer.sessionTime,
            date: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString()
        };

        this.savedSessions.push(session);
        this.saveSavedSessions();
        this.renderSavedSessions();

        // Reset timer after saving
        this.resetTimer();
        
        // Clear the name input
        if (nameInput) nameInput.value = '';

        // Show success message
        alert(`Session "${finalName}" saved successfully!`);
        
        console.log('Timer session saved:', session);
    }

    loadSavedSessions() {
        try {
            const saved = localStorage.getItem('crm_saved_sessions');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved sessions:', error);
            return [];
        }
    }

    saveSavedSessions() {
        try {
            localStorage.setItem('crm_saved_sessions', JSON.stringify(this.savedSessions));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    toggleSessionsList() {
        const sessionsList = document.getElementById('sessionsList');
        if (sessionsList) {
            sessionsList.classList.toggle('hidden');
        }
    }

    renderSavedSessions() {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;

        if (this.savedSessions.length === 0) {
            sessionsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.75rem; text-align: center; padding: var(--spacing-sm);">No saved sessions yet</p>';
            return;
        }

        // Sort sessions by duration for comparison
        const sortedSessions = [...this.savedSessions].sort((a, b) => b.duration - a.duration);
        const maxDuration = sortedSessions[0].duration;

        sessionsList.innerHTML = sortedSessions.map(session => {
            const percentage = (session.duration / maxDuration) * 100;
            const formattedTime = this.formatTime(session.duration);
            
            return `
                <div class="session-item">
                    <div class="session-info">
                        <div class="session-name">${session.name}</div>
                        <div class="session-time">${formattedTime}</div>
                    </div>
                    <div class="session-visual">
                        <div class="session-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="session-date">${session.dateFormatted}</div>
                    <button class="delete-session-btn" onclick="projectCRM.deleteSession('${session.id}')">🗑️</button>
                </div>
            `;
        }).join('');
    }

    deleteSession(sessionId) {
        if (confirm('Delete this session?')) {
            this.savedSessions = this.savedSessions.filter(session => session.id !== sessionId);
            this.saveSavedSessions();
            this.renderSavedSessions();
        }
    }
}

// Initialize the application
const projectCRM = new ProjectCRM();

// Make it globally accessible for onclick handlers
window.projectCRM = projectCRM;
