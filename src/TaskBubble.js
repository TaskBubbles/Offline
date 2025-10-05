import {
    defaultTaskTitle,
    ColorScheme,
    popHoldDelay,
    defaultBubbleSize
} from './constants.js';
import {
    hexToRgba,
    rgbaToHex,
    reduceSaturation,
    lerp
} from './utils/utils.js';
import {
    PlayPopSound
} from './audioManager.js';

let engine, render, initialBounds, Body, Bodies, Composite, bubbleStack, ClusterScaler, lastMouseDownTime;

export class TaskBubble {
    constructor(config) {
        const {
            position,
            title = defaultTaskTitle,
            date = '',
            color = ColorScheme[Math.floor(Math.random() * 5)],
            scale = 1,
            completed = false,
            identifier,
            dependencies
        } = config;

        engine = dependencies.engine;
        render = dependencies.render;
        initialBounds = dependencies.initialBounds;
        Body = dependencies.Body;
        Bodies = dependencies.Bodies;
        Composite = dependencies.Composite;
        bubbleStack = dependencies.bubbleStack;
        ClusterScaler = dependencies.ClusterScaler;
        lastMouseDownTime = dependencies.lastMouseDownTime;

        this.body = Bodies.circle(position.x, position.y, defaultBubbleSize, {
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
        this.body.identifier = identifier;

        this.SetColor(color);

        Composite.add(engine.world, this.body);
        Composite.move(engine.world, this.body, bubbleStack);
        Body.scale(this.body, ClusterScaler * scale, ClusterScaler * scale);

        this.body.wrappedTitle = null;
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
        rgba.a = Math.max(0, rgba.a * 0.5);
        rgba = reduceSaturation(rgba, 0.7);
        return rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    }

    SetColor(color) {
        this.body.color = color;
        const adjustedColor = this.body.completed ? this.disabledColor() : color;
        this.body.render.fillStyle = adjustedColor;
        this.body.render.strokeStyle = adjustedColor;
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

    Pop() {
        PlayPopSound();
        this.playLottieAnimation();
        this.SetCompleted(true);
        Composite.remove(bubbleStack, [this.body]);
        Composite.remove(engine.world, [this.body]);
    }

    Delete() {
        Composite.remove(bubbleStack, [this.body]);
        Composite.remove(engine.world, [this.body]);
    }

    playLottieAnimation() {
        const { x, y } = this.body.position;
        const animationWidth = 500;
        const animationHeight = 500;
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);
        const scaledWidth = animationWidth * scale * this.body.scaler * ClusterScaler;
        const scaledHeight = animationHeight * scale * this.body.scaler * ClusterScaler;
        const animationContainer = document.createElement('div');
        animationContainer.style.position = 'absolute';
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
            autoplay: false,
            path: 'Pop.json',
            rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
        });

        animation.addEventListener('DOMLoaded', () => {
            const svg = animationContainer.querySelector('svg');
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
                path.style.stroke = this.body.render.fillStyle;
            });
            animation.play();
        });

        animation.addEventListener('complete', function () {
            document.body.removeChild(animationContainer);
        });
    }

    SetScale(scale) {
        Body.scale(this.body, scale / this.body.scaler, scale / this.body.scaler);
        this.body.scaler = scale;
    }

    SetCompleted(completed) {
        this.body.completed = completed;
        this.SetColor(this.body.color);
    }

    updateTitle(newTitle) {
        this.body.title = newTitle.length > 0 ? newTitle : defaultTaskTitle;
        this.body.wrappedTitle = null;
    }

    updateDate(newDate) {
        this.body.date = newDate;
    }

    DrawText() {
        this.DrawGradientCircle();
        this.DrawTitle();
        this.DrawDate();
    }

    DrawGradientCircle() {
        const context = render.context;
        const pos = this.body.position;
        const radius = this.body.circleRadius;
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);
        const adjustedPosX = (pos.x - render.bounds.min.x) * scale;
        const adjustedPosY = (pos.y - render.bounds.min.y) * scale;
        const adjustedRadius = radius * scale;
        const x0 = adjustedPosX - adjustedRadius;
        const y0 = adjustedPosY - adjustedRadius;
        const x1 = adjustedPosX + adjustedRadius;
        const y1 = adjustedPosY + adjustedRadius;
        const gradient = context.createLinearGradient(x0, y0, x1, y1);
        const startColor = this.brighterColor(40);
        const endColor = this.brighterColor(-15);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);
        const adjustedLineWidth = this.body.render.lineWidth * scale;

        if (this.body.render.lineWidth > 0) {
            context.beginPath();
            context.arc(adjustedPosX, adjustedPosY, adjustedRadius + adjustedLineWidth / 2, 0, 2 * Math.PI);
            context.fillStyle = this.body.render.strokeStyle;
            context.fill();
        }

        context.beginPath();
        context.arc(adjustedPosX, adjustedPosY, adjustedRadius, 0, 2 * Math.PI);
        context.fillStyle = gradient;
        context.fill();
    }

    DrawTitle() {
        const context = render.context;
        const pos = this.body.position;
        const area = this.body.area;
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);
        const fontSize = Math.sqrt(area / this.body.title.length) * 0.5 * scale;
        context.fillStyle = '#fff';
        context.font = "600 " + fontSize + "px Poppins";
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const adjustedPosX = (pos.x - render.bounds.min.x) * scale;
        const adjustedPosY = (pos.y - render.bounds.min.y) * scale;

        let wrappedText = this.body.wrappedTitle;
        if (!wrappedText) {
            const text = this.body.title + (this.body.completed ? " ✔" : "");
            const maxWidth = Math.sqrt(this.body.area) * scale;
            wrappedText = this.WrapText(context, text, maxWidth, fontSize, 3);
            this.body.wrappedTitle = wrappedText;
        }

        const textHeight = wrappedText.length * fontSize;
        const startY = adjustedPosY - textHeight / 2 + fontSize / 2;
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

            if (n === words.length - 1) {
                if (linesCount < maxLines - 1) {
                    lineArray.push(line.trim());
                } else if (linesCount === maxLines - 1 && lineArray.length < maxLines) {
                    lineArray.push(line.trim());
                }
            }
        }

        if (linesCount >= maxLines && line.trim().length > 0) {
            lineArray[maxLines - 1] += ' ' + line.trim();
        }
        return lineArray;
    }

    DrawDate() {
        if (this.body.date.length === 0) return;
        const context = render.context;
        const area = this.body.area;
        const scaleX = initialBounds.width / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = initialBounds.height / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);
        const fontSize = Math.sqrt(area / this.body.date.length * 0.1) * scale;
        const pos = { x: this.body.position.x, y: this.body.position.y };
        context.fillStyle = '#fff';
        context.font = fontSize + 'px Poppins';
        context.textAlign = 'center';
        context.textBaseline = 'top';
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
        for (let i = 0; i < lines.length; i++) {
            context.fillText(lines[i], adjustedPosX, adjustedPosY + fontSize * 3 + (i * fontSize * 1.2));
        }
    }
}