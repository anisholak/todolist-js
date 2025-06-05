function loadTasks() {
    const tasksJSON = localStorage.getItem("tasks");
    if (!tasksJSON) return [];

    try {
        return JSON.parse(tasksJSON);
    } catch (e) {
        console.error("Ошибка при чтении задач:", e);
        return [];
    }
}

function updateStatistics() {
    const tasks = loadTasks();
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.length - completed;

    document.getElementById('week-summary').textContent =
        `Всего задач: ${tasks.length}. Завершено: ${completed}. Активные: ${active}.`;

    // Пример: фильтрация по дате за месяц (если в задачах есть поле date)
    const thisMonth = new Date().getMonth();
    const monthly = tasks.filter(t => {
        if (!t.date) return false;
        const taskDate = new Date(t.date);
        return taskDate.getMonth() === thisMonth;
    });

    const monthCompleted = monthly.filter(t => t.completed).length;
    const monthActive = monthly.length - monthCompleted;

    document.getElementById('month-summary').textContent =
        `В этом месяце: ${monthly.length} задач. Завершено: ${monthCompleted}. Активные: ${monthActive}.`;
}

updateStatistics();
