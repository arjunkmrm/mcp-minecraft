import { Application } from './Application.js';

const app = new Application();
app.start().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
