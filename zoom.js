//Zoom Script
(function () {
    const panIntensity = 1.2;
    const zoomFactor = 1.2;
    let isDragging = false;
    let lastMousePosition = { x: 0, y: 0 };
    let pinchStartDistance = 0;
    const initialBounds = {
        min: { x: render.bounds.min.x, y: render.bounds.min.y },
        max: { x: render.bounds.max.x, y: render.bounds.max.y },
        width: render.bounds.max.x - render.bounds.min.x,
        height: render.bounds.max.y - render.bounds.min.y
    };

    // Function to calculate distance between two touch points
    function getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Function to center the view
    function centerView() {
        render.bounds.min.x = initialBounds.min.x;
        render.bounds.min.y = initialBounds.min.y;
        render.bounds.max.x = initialBounds.max.x;
        render.bounds.max.y = initialBounds.max.y;
        Render.lookAt(render, initialBounds);
    }

    // Function to update bounds for zoom and pan
    function updateBounds(scaleFactor, middlePoint) {
        const newWidth = (render.bounds.max.x - render.bounds.min.x) * scaleFactor;
        const newHeight = (render.bounds.max.y - render.bounds.min.y) * scaleFactor;

        if (newWidth > initialBounds.width || newHeight > initialBounds.height) {
            centerView();
        } else {
            const newBounds = {
                min: {
                    x: middlePoint.x * (render.bounds.max.x - render.bounds.min.x) * (1 - scaleFactor) + render.bounds.min.x,
                    y: middlePoint.y * (render.bounds.max.y - render.bounds.min.y) * (1 - scaleFactor) + render.bounds.min.y
                },
                max: {
                    x: middlePoint.x * (render.bounds.max.x - render.bounds.min.x) * (scaleFactor - 1) + render.bounds.max.x,
                    y: middlePoint.y * (render.bounds.max.y - render.bounds.min.y) * (scaleFactor - 1) + render.bounds.max.y
                }
            };
            Render.lookAt(render, newBounds);
        }
    }

    // Event listener for mouse wheel to handle zoom
    window.addEventListener('wheel', function (event) {
        event.preventDefault();

        const delta = Math.sign(event.deltaY);
        let scaleFactor = delta < 0 ? 1 / zoomFactor : zoomFactor;

        const mousePosition = {
            x: event.clientX / render.options.width,
            y: event.clientY / render.options.height
        };

        updateBounds(scaleFactor, mousePosition);
    }, { passive: false });

    // Event listeners for mouse down, up, and move to handle panning
    render.canvas.addEventListener('mousedown', function (event) {
        if (event.button === 1) { // Middle mouse button
            const currentWidth = render.bounds.max.x - render.bounds.min.x;
            const currentHeight = render.bounds.max.y - render.bounds.min.y;
            if (currentWidth < initialBounds.width && currentHeight < initialBounds.height) {
                isDragging = true;
                lastMousePosition = { x: event.clientX, y: event.clientY };
            }
        }
    });

    window.addEventListener('mousemove', function (event) {
        if (isDragging) {
            const deltaX = event.clientX - lastMousePosition.x;
            const deltaY = event.clientY - lastMousePosition.y;

            lastMousePosition = { x: event.clientX, y: event.clientY };

            const boundsWidth = render.bounds.max.x - render.bounds.min.x;
            const boundsHeight = render.bounds.max.y - render.bounds.min.y;

            const panFactorX = deltaX * boundsWidth / render.options.width;
            const panFactorY = deltaY * boundsHeight / render.options.height;

            render.bounds.min.x -= panFactorX;
            render.bounds.max.x -= panFactorX;
            render.bounds.min.y -= panFactorY;
            render.bounds.max.y -= panFactorY;
        }
    });

    window.addEventListener('mouseup', function (event) {
        if (event.button === 1) { // Middle mouse button
            isDragging = false;
        }
    });

    // Handle touch events for pinch-to-zoom and two-finger drag-to-pan
    render.canvas.addEventListener('touchstart', function (event) {
        mouseConstraint.constraint.stiffness = 0;
        World.remove(engine.world, mouseConstraint);
        bubbleStack.bodies.forEach(body => {
            body.taskBubble.EndPress();
        });
        if (event.touches.length >= 2) {

            if (mouseTarget != null) {
                mouseTarget = null;
            }

            panning = true;
            if (mouseConstraint.body != null) {
                if (mouseConstraint.body.taskBubble != null) {
                    mouseConstraint.body.taskBubble.EndPress();
                }
            }
            pinchStartDistance = getPinchDistance(event.touches);
            lastMousePosition = { x: (event.touches[0].clientX + event.touches[1].clientX) / 2, y: (event.touches[0].clientY + event.touches[1].clientY) / 2 };
        }
        else {
            mouseConstraint.constraint.stiffness = 1;
            World.add(engine.world, mouseConstraint);
        }
    });

    render.canvas.addEventListener('touchmove', function (event) {
        if (event.touches.length >= 2) {
            if (mouseConstraint.body != null) {
                if (mouseConstraint.body.taskBubble != null) {
                    mouseConstraint.body.taskBubble.EndPress();
                }
            }
            event.preventDefault();
            const pinchDistance = getPinchDistance(event.touches);
            const scaleFactor = pinchStartDistance / pinchDistance; // Reverse the scale factor calculation

            const middlePoint = {
                x: (event.touches[0].clientX + event.touches[1].clientX) / 2 / render.options.width,
                y: (event.touches[0].clientY + event.touches[1].clientY) / 2 / render.options.height
            };

            updateBounds(scaleFactor, middlePoint);
            pinchStartDistance = pinchDistance;

            // Handle panning
            const deltaX = (((event.touches[0].clientX + event.touches[1].clientX) / 2) - lastMousePosition.x) * panIntensity;
            const deltaY = (((event.touches[0].clientY + event.touches[1].clientY) / 2) - lastMousePosition.y) * panIntensity;

            lastMousePosition = { x: (event.touches[0].clientX + event.touches[1].clientX) / 2, y: (event.touches[0].clientY + event.touches[1].clientY) / 2 };

            const boundsWidth = render.bounds.max.x - render.bounds.min.x;
            const boundsHeight = render.bounds.max.y - render.bounds.min.y;

            const panFactorX = deltaX * boundsWidth / render.options.width;
            const panFactorY = deltaY * boundsHeight / render.options.height;

            render.bounds.min.x -= panFactorX;
            render.bounds.max.x -= panFactorX;
            render.bounds.min.y -= panFactorY;
            render.bounds.max.y -= panFactorY;
        }
    });


    render.canvas.addEventListener('touchend', function (event) {
        if (event.touches.length == 0) {
            pinchStartDistance = 0;
            isDragging = false;
            World.add(engine.world, mouseConstraint);
            mouseConstraint.constraint.stiffness = 1;
            panning = false;
        }
    });

    // Function to reset the zoom to the initial state
    function resetZoom() {
        centerView();
    }

    // Expose the resetZoom function to the global scope
    window.resetZoom = resetZoom;
})();
