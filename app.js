document.addEventListener("DOMContentLoaded", function () {
    // Инициализация хранилища задач
    function initializeTasksStorage() {
        if (!localStorage.getItem("tasks")) {
            localStorage.setItem("tasks", JSON.stringify([]));
        }
    }

    // Получение всех задач
    function getAllTasks() {
        return JSON.parse(localStorage.getItem("tasks")) || [];
    }

    // Сохранение всех задач
    function saveAllTasks(tasks) {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // Добавление новой задачи
    function addTask(task) {
        const tasks = getAllTasks();
        tasks.push(task);
        saveAllTasks(tasks);
    }

    // Обновление задачи
    function updateTask(taskId, updatedData) {
        const tasks = getAllTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
            saveAllTasks(tasks);
            return true;
        }
        return false;
    }

    // Удаление задачи
    function deleteTask(taskId) {
        const tasks = getAllTasks();
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        saveAllTasks(updatedTasks);
        renderTasks(); // Обновляем отображение после удаления
    }

    // Инициализация хранилища при загрузке
    initializeTasksStorage();

    const modal = document.getElementById("taskModal");
    const btn = document.getElementById("openTaskModal");
    const span = document.getElementsByClassName("close")[0];
    const taskForm = document.getElementById("taskForm");
    const dateSpan = document.getElementById("autoCreateDate");
    const taskDetails = document.querySelector(".task-details");
    const filterBtn = document.querySelector('.filter-btn');
    const filterDropdown = document.querySelector('.filter-dropdown');
    const selectedFilters = document.querySelector('.selected-filters');
    let activeFilters = new Set();

    // Обработчики фильтров
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('show');
        filterBtn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
            filterDropdown.classList.remove('show');
            filterBtn.classList.remove('active');
        }
    });

    filterDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.filter-option');
        if (!option) return;

        const label = option.dataset.label;
        if (activeFilters.has(label)) {
            activeFilters.delete(label);
            option.classList.remove('active');
        } else {
            activeFilters.add(label);
            option.classList.add('active');
        }

        updateSelectedFilters();
        updateVisibleTasks();
    });

    function updateSelectedFilters() {
        selectedFilters.innerHTML = '';
        activeFilters.forEach(label => {
            const filter = document.createElement('div');
            filter.className = 'selected-filter';
            filter.innerHTML = `
                <span class="task-label ${label}"></span>
                <span>${getLabelText(label)}</span>
                <span class="remove-filter">&times;</span>
            `;

            filter.querySelector('.remove-filter').addEventListener('click', () => {
                activeFilters.delete(label);
                filterDropdown.querySelector(`[data-label="${label}"]`).classList.remove('active');
                updateSelectedFilters();
                updateVisibleTasks();
            });

            selectedFilters.appendChild(filter);
        });
    }

    function getLabelText(label) {
        const labels = {
            'work': 'Работа',
            'study': 'Учёба',
            'unknown': 'Неизвестно'
        };
        return labels[label] || label;
    }

    function updateVisibleTasks() {
        const tasks = document.querySelectorAll('.task-card');
        tasks.forEach(task => {
            const taskLabel = task.dataset.label;
            if (activeFilters.size === 0 || activeFilters.has(taskLabel)) {
                task.style.display = 'block';
            } else {
                task.style.display = 'none';
            }
        });
    }

    function showTaskDetails(details, data) {
        details.classList.add('loading');
        
        setTimeout(() => {
            details.innerHTML = `
                <div class="task-details-header">
                    <h3>${data.title}</h3>
                    <div class="task-details-actions">
                        <button class="edit-details-btn" title="Редактировать задачу">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="close-details">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="task-labels">
                    <span class="task-label ${data.label || 'unknown'}">${getLabelText(data.label)}</span>
                </div>
                <p><small>Дата создания: ${data.created}</small></p>
                <p>${data.description}</p>
                <p><small>Срок: ${data.due}</small></p>
            `;
            details.classList.remove('loading');
            details.classList.add('with-content');

            // Добавляем обработчик для кнопки закрытия
            const closeButton = details.querySelector('.close-details');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    hideTaskDetails(details);
                });
            }

            // Добавляем обработчик для кнопки редактирования
            const editButton = details.querySelector('.edit-details-btn');
            if (editButton) {
                editButton.addEventListener('click', function() {
                    // Находим карточку задачи по заголовку
                    const taskCard = document.querySelector(`.task-card[data-title="${data.title}"]`);
                    if (taskCard) {
                        openEditModal(taskCard);
                    }
                });
            }
        }, 150);
    }

    function hideTaskDetails(details) {
        details.classList.add('loading');
        
        setTimeout(() => {
            details.innerHTML = `
                <div class="task-details-header">
                    <h3>ПРИМЕР</h3>
                    <button class="close-details" style="display: none;"><i class="fas fa-times"></i></button>
                </div>
                <p class="empty-state">Нажмите на задачу, чтобы увидеть подробности</p>
            `;
            details.classList.remove('loading');
            details.classList.remove('with-content');
        }, 150);
    }

    function createTaskCard(taskData, isStatic = false) {
        const card = document.createElement("div");
        card.className = "task-card";
        card.id = taskData.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (taskData.completed) {
            card.classList.add('completed');
        }
        
        // Добавляем data-атрибуты
        card.setAttribute("data-id", card.id);
        card.setAttribute("data-title", taskData.title);
        card.setAttribute("data-created", taskData.created);
        card.setAttribute("data-due", taskData.dueDate);
        card.setAttribute("data-description", taskData.description);
        card.setAttribute("data-label", taskData.label);
        card.setAttribute("data-group", taskData.group);
        
        // Создаем содержимое карточки
        const cardContent = document.createElement("div");
        cardContent.className = "task-card-content";
        
        // Создаем метку
        const labelsDiv = document.createElement("div");
        labelsDiv.className = "task-labels";
        const label = document.createElement("span");
        label.className = `task-label ${taskData.label || 'unknown'}`;
        label.textContent = getLabelText(taskData.label || 'unknown');
        labelsDiv.appendChild(label);
        
        // Форматируем дату для отображения
        const formattedDueDate = formatDate(taskData.dueDate);
        
        cardContent.innerHTML = `
            <h5>${taskData.title}</h5>
            <p class="description">${(taskData.description || '').substring(0, 30)}...</p>
            <p class="due-date"><small>Срок: ${formattedDueDate}</small></p>
        `;

        // Создаем кнопки действий
        const actions = document.createElement("div");
        actions.className = "task-card-actions";
        
        actions.innerHTML = `
            <button class="edit-btn" title="Редактировать задачу">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Удалить задачу">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Добавляем все элементы в карточку
        card.appendChild(labelsDiv);
        card.appendChild(cardContent);
        card.appendChild(actions);

        // Добавляем обработчики событий
        cardContent.addEventListener("click", function(e) {
            if (!e.target.closest('.task-card-actions')) {
                const data = {
                    title: card.getAttribute('data-title'),
                    created: card.getAttribute('data-created'),
                    description: card.getAttribute('data-description'),
                    due: formatDate(card.getAttribute('data-due')),
                    label: card.getAttribute('data-label')
                };
                showTaskDetails(taskDetails, data);
            }
        });

        // Обработчик для кнопки редактирования
        const editBtn = actions.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                openEditModal(card);
            });
        }

        // Обработчик для кнопки удаления
        const deleteBtn = actions.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                    if (!isStatic) {
                        // Получаем ID задачи из data-атрибута
                        const taskId = card.getAttribute('data-id');
                        if (taskId) {
                            deleteTask(taskId);
                        }
                    }
                    card.remove();
                }
            });
        }

        return card;
    }

    // Обновляем функцию renderTasks
    function renderTasks() {
        const columns = {
            "Сделать": document.querySelector(".task-column.pink"),
            "В прогрессе": document.querySelector(".task-column.blue"),
            "Завершено": document.querySelector(".task-column.green"),
            "Без фильтра": document.querySelector(".task-column.purple")
        };

        // Получаем задачи из localStorage
        const tasks = getAllTasks();

        // Очищаем колонки перед отрисовкой
        Object.values(columns).forEach(column => {
            if (column) {
                const cards = column.querySelectorAll('.task-card');
                cards.forEach(card => card.remove());
            }
        });

        // Отрисовываем задачи
        tasks.forEach(task => {
            const column = columns[task.group];
            if (column) {
                const card = createTaskCard(task);
                const header = column.querySelector('h4');
                if (header) {
                    header.insertAdjacentElement('afterend', card);
                } else {
                    column.appendChild(card);
                }
            }
        });

        // Инициализируем drag and drop для новых карточек
        initializeDragAndDrop();
    }

    // Обновляем функцию initializeStaticCards
    function initializeStaticCards() {
        const tasks = getAllTasks();
        
        renderTasks();
    }

    // Вызываем инициализацию при загрузке страницы
    initializeStaticCards();

    // Функция обновления даты
    function getCurrentDate() {
        const now = new Date();
        return now.toLocaleDateString('ru-RU');
    }

    // Обновляем текущую дату при открытии окна
    btn.onclick = function () {
        dateSpan.textContent = getCurrentDate();
        modal.style.display = "block";
    };

    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Обработчик отправки формы
    taskForm.addEventListener("submit", function (e) {
        e.preventDefault();
        
        const modal = document.getElementById('taskModal');
        const isEditing = modal.hasAttribute('data-editing-card');
        
        // Получаем значение метки или устанавливаем "unknown" по умолчанию
        const labelSelect = document.getElementById("taskLabel");
        const selectedLabel = labelSelect.value || "unknown";
        
        // Получаем значение группы или устанавливаем "Без фильтра" по умолчанию
        const groupSelect = document.getElementById("taskGroup");
        const selectedGroup = groupSelect.value || "Без фильтра";
        
        const taskData = {
            title: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDescription").value.trim(),
            dueDate: document.getElementById("taskDueDate").value,
            group: selectedGroup,
            label: selectedLabel,
            created: document.getElementById("autoCreateDate").textContent,
            completed: false
        };

        if (!taskData.title || !taskData.dueDate) {
            alert("Заполните все обязательные поля!");
            return;
        }

        if (isEditing) {
            // Редактирование существующей задачи
            const cardId = modal.getAttribute('data-editing-card');
            taskData.id = cardId;
            updateTask(cardId, taskData);
        } else {
            // Создание новой задачи
            taskData.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            addTask(taskData);
        }

        // Очищаем форму и закрываем модальное окно
        taskForm.reset();
        modal.style.display = "none";
        modal.removeAttribute('data-editing-card');

        // Обновляем отображение всех задач
        renderTasks();
    });

    // Добавляем обработчики для перетаскивания
    function initializeDragAndDrop() {
        const cards = document.querySelectorAll('.task-card');
        const columns = document.querySelectorAll('.task-column');

        cards.forEach(card => {
            card.setAttribute('draggable', true);
            
            card.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', card.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', function(e) {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', function(e) {
                e.preventDefault();
                const draggingCard = document.querySelector('.dragging');
                if (draggingCard) {
                    const cards = [...column.querySelectorAll('.task-card:not(.dragging)')];
                    const afterCard = cards.reduce((closest, child) => {
                        const box = child.getBoundingClientRect();
                        const offset = e.clientY - box.top - box.height / 2;
                        if (offset < 0 && offset > closest.offset) {
                            return { offset: offset, element: child };
                        } else {
                            return closest;
                        }
                    }, { offset: Number.NEGATIVE_INFINITY }).element;

                    if (afterCard) {
                        column.insertBefore(draggingCard, afterCard);
                    } else {
                        column.appendChild(draggingCard);
                    }
                }
            });

            column.addEventListener('drop', function(e) {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('text/plain');
                const card = document.getElementById(cardId);
                if (card) {
                    const newStatus = getColumnStatus(column);
                    updateTaskStatus(card, newStatus);
                }
            });
        });
    }

    function getColumnStatus(column) {
        if (column.classList.contains('pink')) return 'Сделать';
        if (column.classList.contains('blue')) return 'В прогрессе';
        if (column.classList.contains('green')) return 'Завершено';
        if (column.classList.contains('purple')) return 'Без фильтра';
        return 'Сделать';
    }

    function updateTaskStatus(card, newStatus) {
        const taskTitle = card.getAttribute('data-title');
        const tasks = getAllTasks();
        const taskIndex = tasks.findIndex(t => t.title === taskTitle);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].group = newStatus;
            tasks[taskIndex].completed = newStatus === 'Завершено';
            saveAllTasks(tasks);
        }
    }

    // Функция для открытия модального окна редактирования
    function openEditModal(taskCard) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const taskTitle = document.getElementById('taskTitle');
        const taskDescription = document.getElementById('taskDescription');
        const taskLabel = document.getElementById('taskLabel');
        const taskDueDate = document.getElementById('taskDueDate');
        const taskGroup = document.getElementById('taskGroup');
        const autoCreateDate = document.getElementById('autoCreateDate');

        // Заполняем форму данными задачи
        taskTitle.value = taskCard.getAttribute('data-title');
        taskDescription.value = taskCard.getAttribute('data-description');
        taskLabel.value = taskCard.getAttribute('data-label');
        taskDueDate.value = formatDateForInput(taskCard.getAttribute('data-due'));
        taskGroup.value = getColumnStatus(taskCard.closest('.task-column'));
        autoCreateDate.textContent = taskCard.getAttribute('data-created');

        // Сохраняем ссылку на карточку в data-атрибуте модального окна
        modal.setAttribute('data-editing-card', taskCard.id);

        modalTitle.textContent = 'Редактировать задачу';
        modal.style.display = 'block';
    }

    // Функция для форматирования даты
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            console.error('Ошибка форматирования даты:', e);
            return '';
        }
    }

    // Функция для форматирования даты в формат input[type="date"]
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error('Ошибка форматирования даты для input:', e);
            return '';
        }
    }

    // Обработчик для закрытия модального окна
    document.querySelector('.close').addEventListener('click', function() {
        const modal = document.getElementById('taskModal');
        modal.style.display = 'none';
        document.getElementById('taskForm').reset();
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('taskModal');
        if (e.target === modal) {
            modal.style.display = 'none';
            document.getElementById('taskForm').reset();
        }
    });

    // Добавляем обработчик для кнопки поиска
    document.querySelector('.search-btn').addEventListener('click', function() {
        const searchInput = document.querySelector('.search-input');
        const searchTerm = searchInput.value.trim().toLowerCase();
        const tasks = document.querySelectorAll('.task-card');
        
        tasks.forEach(task => {
            const title = task.getAttribute('data-title').toLowerCase();
            const description = task.getAttribute('data-description').toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                task.style.display = 'block';
                // Подсвечиваем найденный текст
                const content = task.querySelector('.task-card-content');
                if (content) {
                    const titleElement = content.querySelector('h5');
                    const descElement = content.querySelector('.description');
                    
                    if (titleElement && searchTerm) {
                        const titleText = titleElement.textContent;
                        const highlightedTitle = titleText.replace(
                            new RegExp(searchTerm, 'gi'),
                            match => `<span class="highlight">${match}</span>`
                        );
                        titleElement.innerHTML = highlightedTitle;
                    }
                    
                    if (descElement && searchTerm) {
                        const descText = descElement.textContent;
                        const highlightedDesc = descText.replace(
                            new RegExp(searchTerm, 'gi'),
                            match => `<span class="highlight">${match}</span>`
                        );
                        descElement.innerHTML = highlightedDesc;
                    }
                }
            } else {
                task.style.display = 'none';
            }
        });
    });

    // Добавляем обработчик для очистки поиска
    document.querySelector('.search-input').addEventListener('input', function() {
        if (this.value.trim() === '') {
            // Убираем подсветку
            document.querySelectorAll('.highlight').forEach(el => {
                const parent = el.parentNode;
                parent.textContent = parent.textContent;
            });
            // Показываем все задачи
            document.querySelectorAll('.task-card').forEach(task => {
                task.style.display = 'block';
            });
        }
    });

    // Добавляем обработчик для поиска по Enter
    document.querySelector('.search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.querySelector('.search-btn').click();
        }
    });
});