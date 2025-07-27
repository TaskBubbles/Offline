# Task Bubbles

Task Bubbles is an experimental todo manager that displays tasks as floating bubbles using the Matter.js physics engine.

## Development

Install dependencies and start a local development server:

```bash
npm install
npm start
```

The `start` script uses `http-server` to serve the project at `http://localhost:8080`.

## Project Structure

- `index.html` – entry point
- `styles.css` – basic styling
- `app.js` – main application logic
- `TaskBubble.js`, `AddTaskButton.js` – task bubble classes
- `save.js` – localStorage persistence
- `audioManager.js` – manages sound effects

The project includes a service worker that caches assets for offline usage.
