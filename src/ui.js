import {
    ColorScheme
} from './constants.js';

export const elements = {
    closeTaskForm: document.querySelector(".close-task-form"),
    addTaskForm: document.querySelector(".add-task"),
    colorButtons: document.querySelectorAll(".colorBtn"),
    completedCheckmark: document.getElementsByClassName("completed-checkmark"),
    completedInput: document.getElementById("completed-input"),
    titleInput: document.getElementById("title-input"),
    scaleInput: document.getElementById("scaleSlider"),
    themeInput: document.getElementById("theme-input"),
    dateInput: document.getElementById('datetime-picker'),
    dateDisplay: document.getElementById('date-display'),
    timeDisplay: document.getElementById('time-display'),
    themeMeta: document.querySelector('meta[name="theme-color"]'),
    infoContainer: document.getElementById('info-container'),
    autoscaleIcon: document.getElementById('autoscaling-icon'),
    eyeIcons: document.querySelectorAll('.eyeIcon'),
    eyeText: document.getElementById('eye-text'),
    deleteButton: document.querySelector('.delete-btn'),
    addButton: document.querySelector('.add-btn'),
    infoButton: document.querySelector('.info-button'),
    autoscaleButton: document.querySelector('.autoscaling-input'),
};

export function initUI(callbacks) {
    elements.themeInput.addEventListener('click', callbacks.toggleTheme);
    elements.eyeIcons.forEach(icon => icon.parentElement.addEventListener('click', callbacks.toggleCompletedTasks));
    elements.infoButton.addEventListener('click', toggleInfoDiv);
    elements.closeTaskForm.addEventListener('click', callbacks.confirmTask);
    elements.deleteButton.addEventListener('click', callbacks.deleteTask);
    elements.addButton.addEventListener('click', callbacks.confirmTask);
    elements.autoscaleButton.addEventListener('click', callbacks.resetZoom);

    elements.colorButtons.forEach((btn, i) => {
        btn.style.backgroundColor = ColorScheme[i];
        btn.addEventListener("click", () => callbacks.setBubbleColor(ColorScheme[i]));
    });

    elements.dateInput.addEventListener('change', function () {
        let dateTime = this.value.split("T");
        elements.dateDisplay.textContent = dateTime[0];
        elements.timeDisplay.textContent = dateTime[1];
        callbacks.setBubbleDate(this.value);
    });

    elements.titleInput.addEventListener('input', (e) => callbacks.setBubbleTitle(e.target.value));
    elements.scaleInput.addEventListener('input', (e) => callbacks.setBubbleScale(e.target.value));
    elements.completedInput.addEventListener('click', (e) => callbacks.setBubbleCompleted(e.target.checked));
}

export function toggleTaskForm(show) {
    elements.addTaskForm.classList.toggle("active", show);
    elements.closeTaskForm.classList.toggle("active", show);
}

export function toggleInfoDiv() {
    elements.infoContainer.classList.toggle("active");
}

export function updateTheme(isDark) {
    const bg = isDark ? ColorScheme[6] : ColorScheme[5];
    const fill = isDark ? ColorScheme[5] : ColorScheme[6];
    const shadow = isDark ? 'drop-shadow(1px 3px 5px rgb(1, 1, 1, 0.2))' : 'drop-shadow(1px 3px 5px rgb(0, 0, 0, 0.2))';

    document.body.style.backgroundColor = bg;
    elements.themeMeta.setAttribute('content', bg);
    elements.eyeIcons.forEach(eyeIcon => eyeIcon.style.fill = fill);
    elements.eyeText.style.color = fill;
    elements.autoscaleIcon.style.fill = fill;
    elements.autoscaleIcon.style.filter = shadow;
    elements.themeInput.checked = isDark;
}


export function updateCompletedTasksView(show, count) {
    elements.eyeIcons[0].classList.toggle("hidden", show);
    elements.eyeIcons[1].classList.toggle("hidden", !show);
    elements.eyeText.innerHTML = count > 0 ? count : "";
}


export function populateTaskForm(bubble) {
    for (let checkmark of elements.completedCheckmark) {
        checkmark.classList.toggle("hidden", !bubble.body.completed);
    }
    elements.completedInput.checked = bubble.body.completed;
    elements.titleInput.value = bubble.body.title !== "Task Name" ? bubble.body.title : '';
    elements.scaleInput.value = bubble.body.scaler;

    if (bubble.body.date) {
        let d = bubble.body.date;
        let text = d.replaceAll("-", ".");
        let lines = text.split("T");
        elements.dateInput.value = d;
        elements.dateDisplay.innerHTML = lines[0];
        elements.timeDisplay.innerHTML = lines[1];
    } else {
        elements.dateInput.value = '';
        elements.dateDisplay.innerHTML = '';
        elements.timeDisplay.innerHTML = '';
    }
}

export function toggleAutoscaleIcon(show) {
    elements.autoscaleIcon.classList.toggle('hidden', !show);
}