function largestElement(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((largest, current) =>
        (current > largest ? current : largest), array[0]);
}

export function saveData(tasks, completedTasks, completedVisible) {
    let allTasks = tasks.map(bubble => ({
        title: bubble.title,
        date: bubble.date,
        color: bubble.color,
        scale: bubble.scaler,
        completed: bubble.completed,
        identifier: bubble.identifier
    }));

    if (!completedVisible) {
        allTasks.push(...completedTasks);
    }

    localStorage.setItem("tasks", JSON.stringify(allTasks));
}

export function saveTheme(darkTheme) {
    localStorage.setItem("dark-theme", JSON.stringify(darkTheme));
}

export function loadData() {
    const tasksData = JSON.parse(localStorage.getItem("tasks"));
    const darkTheme = JSON.parse(localStorage.getItem("dark-theme")) || false;

    if (!tasksData || tasksData.length === 0) {
        return {
            tasks: [],
            completedTasks: [],
            idCounter: 1,
            darkTheme: darkTheme
        };
    }

    const idCounter = largestElement(tasksData.map(bubble => bubble.identifier)) + 1;

    const tasks = [];
    const completedTasks = [];

    tasksData.forEach(bubble => {
        if (bubble.completed) {
            completedTasks.push(bubble);
        } else {
            tasks.push(bubble);
        }
    });

    return { tasks, completedTasks, idCounter, darkTheme };
}