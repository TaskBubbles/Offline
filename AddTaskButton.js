class AddTaskButton {
    constructor() {
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
    };

    startPos = { x: render.bounds.max.x / 2, y: render.bounds.max.y / 2 };

    StartPress() {
        this.Pressed = true;
        this.body.render.fillStyle = '#50505f';
    }

    EndPress() {
        this.Pressed = false;
        this.body.render.fillStyle = '#29262D';
    }

    DrawPlus() {
        var context = render.context;
        var pos = this.body.position;

        // Calculate the current scale factor
        const scaleX = (initialBounds.width) / (render.bounds.max.x - render.bounds.min.x);
        const scaleY = (initialBounds.height) / (render.bounds.max.y - render.bounds.min.y);
        const scale = Math.min(scaleX, scaleY);

        // Adjust the font size based on the current scale
        var fontSize = 80 * scale;
        context.fillStyle = '#fff';
        context.font = fontSize + 'px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Adjust position to account for zoom and pan
        const adjustedPosX = pos.x - render.bounds.min.x;
        const adjustedPosY = pos.y - render.bounds.min.y;

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
