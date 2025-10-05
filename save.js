function SaveData() {
    let tasks = bubbleStack.bodies.map(bubble => {
        return {
            title: bubble.title,
            date: bubble.date,
            color: bubble.color,
            scale: bubble.scaler,
            completed: bubble.completed,
            identifier: bubble.identifier
        };
    });

    if (!completedVisible) {
        completedBubbles.forEach(bubble => {
            tasks.push({
                title: bubble.title,
                date: bubble.date,
                color: bubble.color,
                scale: bubble.scale,
                completed: bubble.completed,
                identifier: bubble.identifier
            })
        });
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function SaveTheme() {
    localStorage.setItem("dark-theme", JSON.stringify(darkTheme));
}

function LoadData() {
    let data = JSON.parse(localStorage.getItem("tasks"));

    if (data != null && data.length > 0) {
        idCounter = largestElement(data.map(bubble => bubble.identifier)) + 1; // Set idCounter to one more than the largest id

        data.forEach(bubble => {
            if (bubble.completed) {
                completedBubbles.push(bubble);
            } else {
                new TaskBubble(RandomPosAroundCenter(1000), bubble.title, bubble.date, bubble.color, bubble.scale, bubble.completed, bubble.identifier);
            }
            eyeText.innerHTML = completedBubbles.length > 0 ? completedBubbles.length : "";
        });
    } else {
        idCounter = 1; // Reset if no data found
    }

    if (JSON.parse(localStorage.getItem("dark-theme"))) {
        themeInput.click();
    }
}
function largestElement(array) {
    return array.reduce((largest, current) =>
        (current > largest ? current : largest), array[0]);
}

let idCounter = 1;