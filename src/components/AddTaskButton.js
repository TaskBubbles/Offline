export class AddTaskButton {
    constructor(render, initialBounds, Bodies) {
        this.render = render;
        this.initialBounds = initialBounds;
        this.startPos = { x: this.render.bounds.max.x / 2, y: this.render.bounds.max.y / 2 };
        this.body = Bodies.circle(this.startPos.x, this.startPos.y, window.innerWidth * 0.025 + window.innerHeight * 0.025,
            {
                isStatic: true,
                render: {
                    fillStyle: '#29262D'
                },
            }
        );
        this.body.taskBubble = this;
        this.body.identifier = 1;
        this.Pressed = false;
    }

    StartPress() {
        this.Pressed = true;
        this.body.render.fillStyle = '#50505f';
    }

    EndPress() {
        this.Pressed = false;
        this.body.render.fillStyle = '#29262D';
    }

    DrawPlus() {
        var context = this.render.context;
        var pos = this.body.position;

        // Calculate the current scale factor
        const scaleX = (this.initialBounds.width) / (this.render.bounds.max.x - this.render.bounds.min.x);
        const scaleY = (this.initialBounds.height) / (this.render.bounds.max.y - this.render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        // Adjust the font size based on the current scale
        var fontSize = 80 * scale;
        context.fillStyle = '#fff';
        context.font = fontSize + 'px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Adjust position to account for zoom and pan
        const adjustedPosX = pos.x - this.render.bounds.min.x;
        const adjustedPosY = pos.y - this.render.bounds.min.y;

        // Apply the scale factor
        const finalPosX = adjustedPosX * scale;
        const finalPosY = adjustedPosY * scale;

        // Measure the text for vertical centering
        var metrics = context.measureText('+');
        var textHeight = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent;

        // Draw the plus sign centered in the circle
        context.fillText('+', finalPosX, finalPosY + textHeight / 2);
    }
}