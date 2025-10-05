import {
    Composites
} from 'matter-js';

export const state = {
    bubbleStack: Composites.stack(),
    completedBubbles: [],
    editedBubble: null,
    darkTheme: false,
    completedVisible: false,
    idCounter: 1,
    ClusterScaler: 1,
    isEditing: false,
    scaling: true,
    mouseTarget: null,
    lastMouseDownTime: 0,
    startMousePos: {
        x: 0,
        y: 0
    },
    panning: false,
};

export function setClusterScaler(value) {
    state.ClusterScaler = value;
}

export function setLastMouseDownTime(value) {
    state.lastMouseDownTime = value;
}

export function setMouseTarget(target) {
    state.mouseTarget = target;
}

export function setStartMousePos(pos) {
    state.startMousePos = pos;
}

export function setPanning(value) {
    state.panning = value;
}

export function setScaling(value) {
    state.scaling = value;
}

export function setEditing(value) {
    state.isEditing = value;
}

export function setEditedBubble(bubble) {
    state.editedBubble = bubble;
}

export function setCompletedBubbles(bubbles) {
    state.completedBubbles = bubbles;
}

export function addCompletedBubble(bubble) {
    state.completedBubbles.push(bubble);
}

export function removeCompletedBubble(identifier) {
    state.completedBubbles = state.completedBubbles.filter(b => b.identifier !== identifier);
}

export function setCompletedVisible(visible) {
    state.completedVisible = visible;
}

export function setDarkTheme(isDark) {
    state.darkTheme = isDark;
}

export function setIdCounter(counter) {
    state.idCounter = counter;
}