// После загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeEventsStorage();
    createTimeSlots();
    updateCurrentDate();
    renderEvents();
    
    // Первоначальная синхронизация высот
    const timeSlots = document.querySelector('.time-slots');
    const eventsContent = document.querySelector('.events-content');
    timeSlots.style.height = `${eventsContent.offsetHeight}px`;
});
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация хранилища
    function initializeEventsStorage() {
        if (!localStorage.getItem('events')) {
            localStorage.setItem('events', JSON.stringify([]));
        }
    }

    // Получение всех событий
    function getAllEvents() {
        return JSON.parse(localStorage.getItem('events')) || [];
    }

    // Сохранение событий
    function saveAllEvents(events) {
        localStorage.setItem('events', JSON.stringify(events));
    }

    // Добавление события
    function addEvent(event) {
        const events = getAllEvents();
        events.push(event);
        saveAllEvents(events);
    }

    // Обновление события
    function updateEvent(eventId, updatedData) {
        const events = getAllEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            events[eventIndex] = { ...events[eventIndex], ...updatedData };
            saveAllEvents(events);
            return true;
        }
        return false;
    }

    // Удаление события
    function deleteEvent(eventId) {
        const events = getAllEvents();
        const updatedEvents = events.filter(e => e.id !== eventId);
        saveAllEvents(updatedEvents);
        renderEvents();
    }

    document.querySelectorAll('.quick-dates button').forEach(btn => {
        btn.addEventListener('click', function() {
            const daysToAdd = parseInt(this.dataset.days);
            const date = new Date();
            date.setDate(date.getDate() + daysToAdd);
            document.getElementById('eventDate').value = date.toISOString().split('T')[0];
        });
    });

    // DOM-элементы
    const modal = document.getElementById('eventModal');
    const addEventBtn = document.querySelector('.add-event-btn');
    const closeBtn = document.querySelector('.close');
    const eventForm = document.getElementById('eventForm');
    const timeSlots = document.querySelector('.time-slots');
    const eventsContainer = document.querySelector('.events-container');
    const currentDateSpan = document.querySelector('.current-date');
    const prevDayBtn = document.querySelector('.prev-day');
    const nextDayBtn = document.querySelector('.next-day');

    let currentDate = new Date();

    // Создание временных слотов
    function createTimeSlots() {
        timeSlots.innerHTML = '';
        const timeSlotsContainer = document.createElement('div');
        timeSlotsContainer.className = 'time-slots-container';
        timeSlotsContainer.style.height = '1440px'; // 24 часа в минутах
    
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeSlotsContainer.appendChild(timeSlot);
        }
    
        timeSlots.appendChild(timeSlotsContainer);
    }

    // Форматирование даты
    function formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    // Обновление отображаемой даты
    function updateCurrentDate() {
        currentDateSpan.textContent = formatDate(currentDate);
    }

    // Создает элемент события с учетом пересечений
    function createEventElement(event, totalInGroup, indexInGroup) {
        const eventElement = document.createElement('div');
        eventElement.className = `event ${event.color}`;
    
        const startMinutes = timeToMinutes(event.startTime);
        const endMinutes = timeToMinutes(event.endTime);
    
        // Рассчитываем ширину и позицию
        const width = 100 / totalInGroup;
        const left = width * indexInGroup;
    
        eventElement.style.top = `${startMinutes}px`;
        eventElement.style.height = `${endMinutes - startMinutes}px`;
        eventElement.style.width = `calc(${width}% - 20px)`;
        eventElement.style.left = `calc(${left}% + 10px)`;
    
        eventElement.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-time">${event.startTime} - ${event.endTime}</div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
        `;
    
        return eventElement;
    }

    // Отрисовка событий
    function renderEvents() {
        eventsContainer.innerHTML = '';
        const events = getAllEvents();
        const currentDateStr = currentDate.toISOString().split('T')[0];
        const eventsContent = document.createElement('div');
        eventsContent.className = 'events-content';
        eventsContent.style.height = '1440px';

        // Фильтруем события для текущего дня
        const todayEvents = events.filter(event => {
            const eventDateStr = new Date(event.date).toISOString().split('T')[0];
            return eventDateStr === currentDateStr;
        });

        // Группируем пересекающиеся события
        const overlappingGroups = findOverlappingEvents(todayEvents);

        // Рендерим события с учетом пересечений
        overlappingGroups.forEach(group => {
            group.forEach((event, index) => {
                const eventElement = createEventElement(event, group.length, index);
                eventsContent.appendChild(eventElement);
            });
        });

        eventsContainer.appendChild(eventsContent);
        syncScroll();
    }

    // Находит пересекающиеся события
    function findOverlappingEvents(events) {
        if (events.length === 0) return [];
    
        // Сортируем события по времени начала
        const sortedEvents = [...events].sort((a, b) => {
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });

        const groups = [];
        let currentGroup = [sortedEvents[0]];

        for (let i = 1; i < sortedEvents.length; i++) {
            const lastEvent = currentGroup[currentGroup.length - 1];
            const currentEvent = sortedEvents[i];

            // Проверяем пересечение времени
            if (timeToMinutes(currentEvent.startTime) < timeToMinutes(lastEvent.endTime)) {
                currentGroup.push(currentEvent);
            } else {
                groups.push(currentGroup);
                currentGroup = [currentEvent];
            }
        }

        groups.push(currentGroup);
        return groups;
    }

    // Синхронизация скролла
    function syncScroll() {
        const timeSlots = document.querySelector('.time-slots');
        const eventsContainer = document.querySelector('.events-container');
    
        // Только контейнер событий должен скроллиться
        eventsContainer.style.overflowY = 'auto';
        timeSlots.style.overflowY = 'hidden'; // Отключаем скролл у времени
    
        // Синхронизируем положение времени при скролле событий
        eventsContainer.addEventListener('scroll', () => {
            timeSlots.scrollTop = eventsContainer.scrollTop;
        });
    }

    // Открытие модального окна
    function openAddModal() {
        const today = new Date();
        const dateInput = document.getElementById('eventDate');
        const startTimeInput = document.getElementById('eventStartTime');
        const endTimeInput = document.getElementById('eventEndTime');
    
        // Установка значений по умолчанию
        dateInput.value = today.toISOString().split('T')[0];
    
        // Установка времени (текущий час + 1, продолжительность 1 час)
        const nextHour = today.getHours() + 1;
        startTimeInput.value = `${nextHour.toString().padStart(2, '0')}:00`;
        endTimeInput.value = `${(nextHour + 1).toString().padStart(2, '0')}:00`;
    
        // Сброс остальных полей
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventColor').value = 'blue';
    
        modal.style.display = 'block';
    }

    // Редактирование события
    function openEditModal(event) {
        document.getElementById('modalTitle').textContent = 'Редактировать событие';
    
        // Установка значений из события
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = new Date(event.date).toISOString().split('T')[0];
        document.getElementById('eventStartTime').value = event.startTime;
        document.getElementById('eventEndTime').value = event.endTime;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventColor').value = event.color;
    
        modal.setAttribute('data-editing-event', event.id);
        modal.style.display = 'block';
    }

    // Инициализация
    initializeEventsStorage();
    createTimeSlots();
    updateCurrentDate();
    renderEvents();
    syncScroll();

    // Обработчики событий
    addEventBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));

    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
    
        // Валидация времени
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
    
        if (startTime >= endTime) {
            alert('Время окончания должно быть позже времени начала!');
            return;
        }
    
        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: startTime,
            endTime: endTime,
            description: document.getElementById('eventDescription').value,
            color: document.getElementById('eventColor').value
        };
    
        // Добавление/обновление события
        if (modal.hasAttribute('data-editing-event')) {
            updateEvent(modal.getAttribute('data-editing-event'), eventData);
        } else {
            eventData.id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            addEvent(eventData);
        }   
    
        modal.style.display = 'none';
        renderEvents();
    });

    prevDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateCurrentDate();
        renderEvents();
    });

    nextDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateCurrentDate();
        renderEvents();
    });

    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
});