import {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Composite,
    Composites,
    Events,
    Mouse,
    MouseConstraint,
    Query,
    Vector
} from 'matter-js';
import {
    state,
    setClusterScaler,
    setLastMouseDownTime,
    setMouseTarget,
    setStartMousePos,
    setPanning,
    setScaling,
    setEditing,
    setEditedBubble,
    addCompletedBubble,
    removeCompletedBubble,
    setCompletedVisible,
    setDarkTheme,
    setIdCounter
} from './state.js';
import {
    elements,
    initUI,
    toggleTaskForm,
    updateTheme,
    updateCompletedTasksView,
    populateTaskForm,
    toggleAutoscaleIcon
} from './ui.js';
import {
    TaskBubble
} from './TaskBubble.js';
import {
    AddTaskButton
} from './components/AddTaskButton.js';
import {
    saveData,
    loadData,
    saveTheme
} from './save.js';
import {
    initializeZoom,
    resetZoom
} from './zoom.js';
import {
    initializeInstallButton
} from './installButton.js';
import {
    ColorScheme,
    editCancelDelay,
    popHoldDelay,
    cancelMovementBuffer,
    editPosition
} from './constants.js';
import {
    RandomPosAroundCenter,
    isTouchDevice
} from './utils/utils.js';

class App {
    constructor() {
        this.engine = Engine.create();
        this.engine.gravity.scale = 0;

        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                wireframes: false,
                width: window.innerWidth,
                height: window.innerHeight,
                background: ColorScheme[5],
            },
        });
        this.render.canvas.style = "transition: 0.3s; -webkit-transition: 0.3s;";

        this.runner = Runner.create();

        this.initialBounds = {
            min: {
                x: this.render.bounds.min.x,
                y: this.render.bounds.min.y
            },
            max: {
                x: this.render.bounds.max.x,
                y: this.render.bounds.max.y
            },
            width: this.render.bounds.max.x - this.render.bounds.min.x,
            height: this.render.bounds.max.y - this.render.bounds.min.y
        };

        this.mouse = Mouse.create(this.render.canvas);
        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: this.mouse,
            constraint: {
                render: {
                    visible: false
                }
            },
        });
        this.render.mouse = this.mouse;

        this.addTaskButton = new AddTaskButton(this.render, this.initialBounds, Bodies);
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.setupWorld();
            this.setupUI();
            this.setupEventListeners();
            this.loadInitialData();
            this.run();
        });
    }

    setupWorld() {
        World.add(this.engine.world, [state.bubbleStack, this.addTaskButton.body, this.mouseConstraint]);
    }

    setupUI() {
        const callbacks = {
            toggleTheme: this.toggleTheme.bind(this),
            toggleCompletedTasks: this.toggleCompletedTasks.bind(this),
            confirmTask: this.confirmTask.bind(this),
            deleteTask: this.deleteTask.bind(this),
            resetZoom: resetZoom,
            setBubbleColor: (color) => state.editedBubble.SetColor(color),
            setBubbleDate: (date) => state.editedBubble.updateDate(date),
            setBubbleTitle: (title) => state.editedBubble.updateTitle(title),
            setBubbleScale: (scale) => state.editedBubble.SetScale(scale),
            setBubbleCompleted: (completed) => this.setBubbleCompleted(completed),
        };
        initUI(callbacks);
        initializeZoom({
            render: this.render,
            engine: this.engine,
            mouseConstraint: this.mouseConstraint,
            bubbleStack: state.bubbleStack,
            World: World,
            Render: Render
        });
        initializeInstallButton();
    }

    setupEventListeners() {
        Events.on(this.mouseConstraint, "mousedown", this.handleMouseDown.bind(this));
        Events.on(this.mouseConstraint, "mouseup", this.handleMouseUp.bind(this));
        Events.on(this.engine, "beforeUpdate", this.handleBeforeUpdate.bind(this));
        Events.on(this.render, 'afterRender', this.handleAfterRender.bind(this));
    }

    loadInitialData() {
        const {
            tasks,
            completedTasks,
            idCounter,
            darkTheme
        } = loadData();

        setIdCounter(idCounter);
        state.completedBubbles = completedTasks;
        updateCompletedTasksView(state.completedVisible, state.completedBubbles.length);

        tasks.forEach(bubbleData => this.createTaskBubble(bubbleData));

        if (darkTheme) {
            this.toggleTheme();
        }

        if (tasks.length === 0 && completedTasks.length === 0) {
            this.spawnTutorialBubbles();
        }
    }

    run() {
        Runner.run(this.runner, this.engine);
        Render.run(this.render);
    }

    createTaskBubble(data) {
        const config = {
            position: data.position || RandomPosAroundCenter(1000),
            title: data.title,
            date: data.date,
            color: data.color,
            scale: data.scale,
            completed: data.completed,
            identifier: data.identifier || state.idCounter++,
            dependencies: {
                engine: this.engine,
                render: this.render,
                initialBounds: this.initialBounds,
                Body: Body,
                Bodies: Bodies,
                Composite: Composite,
                bubbleStack: state.bubbleStack,
                ClusterScaler: state.ClusterScaler,
                lastMouseDownTime: state.lastMouseDownTime
            }
        };
        return new TaskBubble(config);
    }

    spawnTutorialBubbles() {
        const tutorialTasks = [{
                title: "Hold Bubble To POP!",
                color: ColorScheme[4],
                scale: 3
            },
            {
                title: "Tap Bubble To Edit",
                color: ColorScheme[3],
                scale: 2
            },
            {
                title: "Press + To Add Bubble",
                color: ColorScheme[2],
                scale: 1
            },
            {
                title: isTouchDevice() ? "Pinch to Zoom and Pan" : "Scroll To Zoom & Pan",
                color: ColorScheme[1],
                scale: 0.5
            },
            {
                title: "Press Eye 👁 To See Past Tasks",
                color: ColorScheme[0],
                scale: 0.1
            },
        ];
        tutorialTasks.forEach(task => this.createTaskBubble(task));
        this.saveAllData();
    }

    toggleTheme() {
        setDarkTheme(!state.darkTheme);
        this.render.options.background = state.darkTheme ? ColorScheme[6] : ColorScheme[5];
        updateTheme(state.darkTheme);
        saveTheme(state.darkTheme);
    }

    toggleCompletedTasks() {
        setCompletedVisible(!state.completedVisible);
        updateCompletedTasksView(state.completedVisible, state.completedBubbles.length);

        if (state.completedVisible) {
            state.completedBubbles.forEach(bubbleData => {
                if (!state.bubbleStack.bodies.some(b => b.identifier === bubbleData.identifier)) {
                    this.createTaskBubble({ ...bubbleData,
                        completed: true
                    });
                }
            });
        } else {
            const bubblesToRemove = state.bubbleStack.bodies.filter(b => b.completed);
            bubblesToRemove.forEach(b => b.taskBubble.Delete());
        }
    }

    startCreatingTask() {
        const newBubble = this.createTaskBubble({
            position: editPosition,
            identifier: state.idCounter
        });
        setEditedBubble(newBubble);
        setEditing(true);
        toggleTaskForm(true);
        populateTaskForm(newBubble);
        World.remove(this.engine.world, this.mouseConstraint);
        newBubble.body.isStatic = true;
    }

    startEditingTask(bubble) {
        setEditedBubble(bubble);
        setEditing(true);
        toggleTaskForm(true);
        populateTaskForm(bubble);
        resetZoom();
        World.remove(this.engine.world, this.mouseConstraint);
        bubble.body.isStatic = true;
        bubble.editInterval = setInterval(() => {
            Body.setPosition(bubble.body, editPosition);
        }, 100);
    }

    confirmTask() {
        if (!state.editedBubble) return;

        clearInterval(state.editedBubble.editInterval);
        state.editedBubble.body.isStatic = false;

        if (state.editedBubble.body.title === "Task Name") {
            state.editedBubble.Delete();
        }

        setEditing(false);
        toggleTaskForm(false);
        setEditedBubble(null);
        World.add(this.engine.world, this.mouseConstraint);
        this.saveAllData();
    }

    deleteTask() {
        if (!state.editedBubble) return;
        if (state.editedBubble.body.completed) {
            removeCompletedBubble(state.editedBubble.body.identifier);
        }
        state.editedBubble.Delete();
        this.confirmTask();
    }

    setBubbleCompleted(completed) {
        if (!state.editedBubble) return;
        state.editedBubble.SetCompleted(completed);
        if (completed) {
            addCompletedBubble({
                title: state.editedBubble.body.title,
                date: state.editedBubble.body.date,
                color: state.editedBubble.body.color,
                scale: state.editedBubble.body.scaler,
                completed: true,
                identifier: state.editedBubble.body.identifier
            });
            if (!state.completedVisible) {
                this.toggleCompletedTasks();
            }
        } else {
            removeCompletedBubble(state.editedBubble.body.identifier);
        }
        updateCompletedTasksView(state.completedVisible, state.completedBubbles.length);
    }

    handleMouseDown(e) {
        if (e.mouse.button !== '' || e.touch || state.panning) return;
        setLastMouseDownTime(this.engine.timing.timestamp);
        setScaling(false);
        if (state.editedBubble) return;

        if (state.mouseTarget && state.bubbleStack.bodies.includes(state.mouseTarget)) {
            state.mouseTarget.taskBubble.EndPress();
            state.mouseTarget.taskBubble.ClearOutline();
        }

        const target = Query.point([this.addTaskButton.body, ...state.bubbleStack.bodies], this.mouseConstraint.mouse.position)[0];
        setMouseTarget(target);

        if (target) {
            if (target === this.addTaskButton.body) {
                this.addTaskButton.StartPress();
            } else if (state.bubbleStack.bodies.includes(target)) {
                target.taskBubble.StartPress();
                setStartMousePos(Vector.clone(this.mouseConstraint.mouse.position));
            }
        }
    }

    handleMouseUp(e) {
        if (this.addTaskButton.Pressed) this.addTaskButton.EndPress();
        setScaling(true);
        if (state.editedBubble) return;

        const target = Query.point([this.addTaskButton.body, ...state.bubbleStack.bodies], this.mouseConstraint.mouse.position)[0];

        if (state.mouseTarget && state.mouseTarget === target) {
            if (target === this.addTaskButton.body) {
                this.startCreatingTask();
            } else if (state.bubbleStack.bodies.includes(target)) {
                target.taskBubble.EndPress();
                const clickDuration = this.engine.timing.timestamp - state.lastMouseDownTime;
                if (Vector.magnitude(Vector.sub(state.startMousePos, this.mouse.position)) <= cancelMovementBuffer) {
                    if (clickDuration > popHoldDelay) {
                        this.popBubble(target.taskBubble);
                    } else if (clickDuration < editCancelDelay) {
                        this.startEditingTask(target.taskBubble);
                    }
                }
                target.taskBubble.ClearOutline();
            }
        }
        setMouseTarget(null);
    }

    popBubble(bubble) {
        if (bubble.body.title === "Task Name") {
            bubble.Delete();
            this.saveAllData();
            return;
        }
        if (!bubble.body.completed) {
            addCompletedBubble({
                title: bubble.body.title,
                date: bubble.body.date,
                color: bubble.body.color,
                scale: bubble.body.scaler,
                completed: true,
                identifier: bubble.body.identifier
            });
            updateCompletedTasksView(state.completedVisible, state.completedBubbles.length);
        }
        bubble.Pop();
        this.saveAllData();
    }

    handleBeforeUpdate() {
        if (state.scaling) this.scaleBoard();
        this.setBubblesAttraction();

        const scaleX = this.initialBounds.width / (this.render.bounds.max.x - this.render.bounds.min.x);
        const scaleY = this.initialBounds.height / (this.render.bounds.max.y - this.render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        if (state.mouseTarget && state.bubbleStack.bodies.includes(state.mouseTarget) && Vector.magnitude(Vector.sub(state.startMousePos, this.mouse.position)) >= cancelMovementBuffer / scale) {
            state.mouseTarget.taskBubble.EndPress();
            setMouseTarget(null);
        }
    }

    scaleBoard() {
        const currentWidth = this.render.bounds.max.x - this.render.bounds.min.x;
        const currentHeight = this.render.bounds.max.y - this.render.bounds.min.y;
        toggleAutoscaleIcon(currentWidth !== this.initialBounds.width || currentHeight !== this.initialBounds.height);

        let stackBounds = Composite.bounds(state.bubbleStack);
        let xL = stackBounds.min.x;
        let xR = this.initialBounds.max.x - stackBounds.max.x;
        let yL = stackBounds.min.y;
        let yR = this.initialBounds.max.y - stackBounds.max.y;
        let padding = 20;
        const difference = Math.min(xL, xR, yL, yR) - padding;
        let scale = Matter.Common.clamp(1 + difference * 0.00005, 0.01, 1.9);

        if (state.bubbleStack.bodies.length <= 0) {
            setClusterScaler(1);
        } else {
            if (state.ClusterScaler < 0.1 && scale <= 1) return;
            state.bubbleStack.bodies.forEach(bubble => {
                Body.scale(bubble, scale, scale, bubble.position);
            });
            setClusterScaler(state.ClusterScaler * scale);
        }
    }

    setBubblesAttraction() {
        state.bubbleStack.bodies.forEach(bubble => {
            const force = Vector.mult(
                Vector.sub(this.addTaskButton.body.position, bubble.position),
                bubble.area * 0.000000005
            );
            Body.applyForce(bubble, bubble.position, force);
        });
    }

    handleAfterRender() {
        this.addTaskButton.DrawPlus();
        state.bubbleStack.bodies.forEach(bubble => {
            if (bubble.taskBubble) {
                bubble.taskBubble.DrawText();
            }
        });
    }

    saveAllData() {
        const activeTasks = state.bubbleStack.bodies
            .filter(b => b.taskBubble) // only save task bubbles
            .map(b => b.taskBubble.body);
        saveData(activeTasks, state.completedBubbles, state.completedVisible);
    }
}

const app = new App();
app.init();