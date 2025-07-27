class TaskBubble {
    constructor(position, title = defaultTaskTitle, date = '', color = ColorScheme[Math.floor(Math.random() * 5)], scale = 1, completed = false, identifier = 0, groupName = "Default") {
        let pos = position == null ? editPosition : position;
        this.body = Bodies.circle(pos.x, pos.y, defaultBubbleSize, {
            friction: 5,
            frictionAir: 0.05,
            frictionStatic: 10,
            restitution: 0.3,
            collisionFilter: {
                group: 1,
                mask: 1,
                category: 1,
            },
        });

        this.body.title = title;
        this.body.date = date;
        this.body.taskBubble = this;
        this.body.scaler = scale;
        this.body.completed = completed;
        this.body.color = color;
        this.SetColor(color);

        if (identifier == 0) {
            this.body.identifier = idCounter;
            idCounter++;
        } else {
            this.body.identifier = identifier;
        }
        this.body.groupName = groupName;

        Composite.add(engine.world, this.body);
        Composite.move(engine.world, this.body, bubbleStack);
        Body.scale(this.body, ClusterScaler * scale, ClusterScaler * scale);

        // Initialize wrappedTitle for caching
        this.body.wrappedTitle = null;

        // Prevent default rendering
        this.body.render.visible = false;
    }

    brighterColor(percent) {
        let baseColor = this.body.render.fillStyle;
        let rgba = hexToRgba(baseColor);

        rgba.r = Math.min(255, rgba.r + percent);
        rgba.g = Math.min(255, rgba.g + percent);
        rgba.b = Math.min(255, rgba.b + percent);

        return rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    }

    disabledColor() {
        let rgba = hexToRgba(this.body.color);

        rgba.a = Math.max(0, rgba.a * 0.5); // Reduce alpha by 30%
        rgba = reduceSaturation(rgba, 0.7);
        return rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    }

    SetColor(color) {
        this.body.color = color;
        const adjustedColor = this.body.completed ? this.disabledColor() : color;
        this.body.render.fillStyle = adjustedColor;
        this.body.render.strokeStyle = adjustedColor;
    }

    StartModify() {
        resetZoom();
        scaling = false;
        for (let checkmark of completedCheckmark) {
            if (this.body.completed) {
                checkmark.classList.remove("hidden");
            } else {
                checkmark.classList.add("hidden");
            }
            completedInput.checked = this.body.completed;
        }

        titleInput.value = this.body.title !== defaultTaskTitle ? this.body.title : '';
        scaleInput.value = this.body.scaler;

        if (this.body.date !== '') {
            let d = this.body.date;
            let text = d.replaceAll("-", ".");
            let lines = text.split("T");
            dateInput.value = d;
            dateDisplay.innerHTML = lines[0];
            timeDisplay.innerHTML = lines[1];
        } else {
            dateInput.value = '';
            dateDisplay.innerHTML = '';
            timeDisplay.innerHTML = '';
        }

        editedBubble = this;
        this.body.isStatic = true;
        this.EndPress();
        this.editInterval = setInterval(() => {
            Body.setPosition(this.body, editPosition);
            this.UpdateAttributes();
        }, 100);
    }

    FinishModify() {
        scaling = true;
        this.body.isStatic = false;
        this.EndPress();
        editedBubble = null;
        this.SetColor(this.body.color); // Update color in case of changes
        this.ClearOutline();
        clearInterval(this.editInterval);

        if (this.body.completed) {
            let bubbleToUpdate = completedBubbles.find(bubble => bubble.identifier === this.body.identifier);
            if (bubbleToUpdate) {
                bubbleToUpdate.title = this.body.title;
                bubbleToUpdate.date = this.body.date;
                bubbleToUpdate.color = this.body.color;
                bubbleToUpdate.scale = this.body.scale;
            }
        }

        SaveData();
    }

    StartPress() {
        const endWidth = window.innerHeight * 0.03;
        this.body.render.strokeStyle = this.brighterColor(50);

        this.outlineInterval = setInterval(() => {
            this.body.render.lineWidth = Math.min(lerp(engine.timing.timestamp, lastMouseDownTime, lastMouseDownTime + popHoldDelay, 0, endWidth), endWidth);
            if (this.body.render.lineWidth >= endWidth) {
                this.body.render.strokeStyle = this.brighterColor(100);
            }
        }, engine.timing.lastDelta);
    }

    EndPress() {
        clearInterval(this.outlineInterval);
        this.ClearOutline();
        Body.setVelocity(this.body, { x: 0, y: 0 });
        Body.setAngularVelocity(this.body, 0);
    }

    ClearOutline() {
        this.body.render.lineWidth = 0;
        this.body.render.strokeStyle = this.body.render.fillStyle;
    }

    PopBubble() {
        PlayPopSound();
        this.playLottieAnimation();

        if (this.body.title === defaultTaskTitle) {
            this.DeleteBubble();
            return;
        }

        if (!this.body.completed) {
            this.SetCompleted(true);
        }

        if (completedVisible) {
            new TaskBubble(RandomPosAroundCenter(1000), this.body.title, this.body.date, this.body.color, this.body.scaler, this.body.completed, this.body.identifier);
        }
        eyeText.innerHTML = completedBubbles.length > 0 ? completedBubbles.length : "";

        Composite.remove(bubbleStack, [this.body]);
        Composite.remove(engine.world, [this.body]);

        SaveData();
    }

    playLottieAnimation() {
        const { x, y } = this.body.position;
        const animationWidth = 500;
        const animationHeight = 500;

        // Calculate the current scale factor similar to DrawText
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        // Calculate the scaled width and height based on the bubble size and renderer scale
        const scaledWidth = animationWidth * scale * this.body.scaler * ClusterScaler;
        const scaledHeight = animationHeight * scale * this.body.scaler * ClusterScaler;

        const animationContainer = document.createElement('div');
        animationContainer.style.position = 'absolute';

        // Adjust for the canvas offset and scale
        const adjustedX = (x - render.bounds.min.x) * scale - scaledWidth / 2;
        const adjustedY = (y - render.bounds.min.y) * scale - scaledHeight / 2;

        animationContainer.style.left = `${adjustedX}px`;
        animationContainer.style.top = `${adjustedY}px`;
        animationContainer.style.width = `${scaledWidth}px`;
        animationContainer.style.height = `${scaledHeight}px`;
        animationContainer.style.pointerEvents = 'none';
        document.body.appendChild(animationContainer);

        const animation = lottie.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false, // We'll play it manually after modifying
            path: 'Pop.json',
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid slice'
            }
        });

        // Update the color of the animation elements
        animation.addEventListener('DOMLoaded', () => {
            const svg = animationContainer.querySelector('svg');
            const paths = svg.querySelectorAll('path');

            paths.forEach(path => {
                path.style.stroke = this.body.render.fillStyle;
            });

            // Play the animation after modifying
            animation.play();
        });

        animation.addEventListener('complete', function () {
            document.body.removeChild(animationContainer);
        });
    }

    DeleteBubble() {
        editedBubble = null;
        if (this.body.completed) {
            let index = completedBubbles.findIndex(bubble => bubble.identifier === this.body.identifier);

            if (index !== -1) {
                completedBubbles.splice(index, 1);
            }
        }
        Composite.remove(bubbleStack, [this.body]);
        SaveData();
        eyeText.innerHTML = completedBubbles.length > 0 ? completedBubbles.length : "";
        Composite.remove(engine.world, [this.body]);
    }

    SetScale(scale) {
        Body.scale(this.body, scale / this.body.scaler, scale / this.body.scaler);
        this.body.scaler = scale;
    }

    SetCompleted(completed) {
        this.body.completed = completed;

        if (completed) {
            completedBubbles.push({
                title: this.body.title,
                date: this.body.date,
                color: this.body.color,
                scale: this.body.scaler,
                completed: this.body.completed,
                identifier: this.body.identifier
            });

            if (editedBubble != null && !completedVisible) {
                ToggleCompletedTasks();
            }
        } else {
            let index = completedBubbles.findIndex(bubble => bubble.identifier === this.body.identifier);

            if (index !== -1) {
                completedBubbles.splice(index, 1);
            }
        }
        eyeText.innerHTML = completedBubbles.length > 0 ? completedBubbles.length : "";

        this.SetColor(this.body.color); // Update the color to reflect the completed state
    }

    UpdateAttributes() {
        this.body.title = titleInput.value.length > 0 ? titleInput.value : defaultTaskTitle;
        this.body.date = dateInput.value;

        // Compute and cache the wrapped title
        const context = render.context;
        const area = this.body.area;
        const scale = 1; // Assume scale is 1 during UpdateAttributes

        // Set a standard font size and maxWidth for wrapping
        const fontSize = Math.sqrt(area / this.body.title.length) * 0.5 * scale;
        context.font = "600 " + fontSize + "px Poppins";
        const maxWidth = Math.sqrt(this.body.area) * scale;

        const text = this.body.title + (this.body.completed ? " ✔" : "");
        this.body.wrappedTitle = this.WrapText(context, text, maxWidth, fontSize, 3);
    }

    DrawText() {
        // Draw the gradient-filled circle
        this.DrawGradientCircle();

        this.DrawTitle();
        this.DrawDate();
    }

    DrawGradientCircle() {
        const context = render.context;
        const pos = this.body.position;
        const radius = this.body.circleRadius;

        // Calculate the current scale factor
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        // Adjust position to account for zoom and pan
        const adjustedPosX = (pos.x - render.bounds.min.x) * scale;
        const adjustedPosY = (pos.y - render.bounds.min.y) * scale;
        const adjustedRadius = radius * scale;

        // Define the gradient coordinates (from top-left to bottom-right)
        const x0 = adjustedPosX - adjustedRadius;
        const y0 = adjustedPosY - adjustedRadius;
        const x1 = adjustedPosX + adjustedRadius;
        const y1 = adjustedPosY + adjustedRadius;

        // Create linear gradient
        const gradient = context.createLinearGradient(x0, y0, x1, y1);

        // Get start and end colors
        const startColor = this.brighterColor(40); // Brighter color
        const endColor = this.brighterColor(-15); // Darker color

        // Add color stops
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        // Scale the lineWidth appropriately
        const adjustedLineWidth = this.body.render.lineWidth * scale;

        // Draw the stroke circle first, if needed
        if (this.body.render.lineWidth > 0) {
            context.beginPath();
            context.arc(
                adjustedPosX,
                adjustedPosY,
                adjustedRadius + adjustedLineWidth / 2,
                0,
                2 * Math.PI
            );
            context.fillStyle = this.body.render.strokeStyle;
            context.fill();
        }

        // Draw the fill circle
        context.beginPath();
        context.arc(adjustedPosX, adjustedPosY, adjustedRadius, 0, 2 * Math.PI);
        context.fillStyle = gradient;
        context.fill();
    }


    DrawTitle() {
        const context = render.context;
        const pos = this.body.position;
        const area = this.body.area;

        // Calculate the current scale factor
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        const fontSize = Math.sqrt(area / this.body.title.length) * 0.5 * scale;

        context.fillStyle = '#fff'; // Text color
        context.font = "600 " + fontSize + "px Poppins"; // Text size and font
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Adjust position to account for zoom and pan
        const adjustedPosX = (pos.x - render.bounds.min.x) * scale;
        const adjustedPosY = (pos.y - render.bounds.min.y) * scale;

        // Use cached wrapped title
        let wrappedText = this.body.wrappedTitle;

        // If wrappedText is undefined, compute it now
        if (!wrappedText) {
            const text = this.body.title + (this.body.completed ? " ✔" : "");
            const maxWidth = Math.sqrt(this.body.area) * scale;
            wrappedText = this.WrapText(context, text, maxWidth, fontSize, 3);
            this.body.wrappedTitle = wrappedText;
        }

        const textHeight = wrappedText.length * fontSize;
        const startY = adjustedPosY - textHeight / 2 + fontSize / 2; // Center text vertically

        // Draw each line of the wrapped text
        wrappedText.forEach((line, index) => {
            context.fillText(line, adjustedPosX, startY + index * fontSize);
        });
    }

    WrapText(ctx, text, maxWidth, lineHeight, maxLines) {
        let words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineArray = [];
        let linesCount = 0;

        for (let n = 0; n < words.length; n++) {
            let word = words[n];
            testLine = line + word + ' ';

            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                lineArray.push(line.trim());
                line = word + ' ';
                linesCount++;

                if (linesCount >= maxLines - 1) {
                    line += words.slice(n + 1).join(' ');
                    lineArray.push(line.trim());
                    break;
                }
            } else {
                line += word + ' ';
            }

            // Handle the last word
            if (n === words.length - 1) {
                if (linesCount < maxLines - 1) {
                    lineArray.push(line.trim());
                } else if (linesCount === maxLines - 1 && lineArray.length < maxLines) {
                    lineArray.push(line.trim());
                }
            }
        }

        // Combine any remaining text into the last line if max lines exceeded
        if (linesCount >= maxLines && line.trim().length > 0) {
            lineArray[maxLines - 1] += ' ' + line.trim();
        }

        return lineArray;
    }

    DrawDate() {
        if (this.body.date.length === '') return;
        const context = render.context;
        const area = this.body.area;

        // Calculate the current scale factor
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        const fontSize = Math.sqrt(area / this.body.date.length * 0.1) * scale;
        const pos = { x: this.body.position.x, y: this.body.position.y };

        context.fillStyle = '#fff';
        context.font = fontSize + 'px Poppins';
        context.textAlign = 'center';
        context.textBaseline = 'top';

        // Adjust position to account for zoom and pan
        const adjustedPosX = Math.round((pos.x - render.bounds.min.x) * scale);
        const adjustedPosY = Math.round((pos.y - render.bounds.min.y) * scale);

        let currentDate = new Date();
        let todayText = currentDate.toISOString().split("T")[0].replaceAll("-", ".");

        let tomorrowDate = new Date(currentDate);
        tomorrowDate.setDate(currentDate.getDate() + 1);
        let tomorrowText = tomorrowDate.toISOString().split("T")[0].replaceAll("-", ".");

        let dateText = this.body.date.split("T")[0].replaceAll("-", ".");

        let text = (dateText === todayText) ? "Today" : (dateText === tomorrowText) ? "Tomorrow" : dateText;
        let lines = [text].concat(this.body.date.split("T").slice(1));

        // Draw each line separately
        for (let i = 0; i < lines.length; i++) {
            context.fillText(lines[i], adjustedPosX, adjustedPosY + fontSize * 3 + (i * fontSize * 1.2));
        }
    }
}
