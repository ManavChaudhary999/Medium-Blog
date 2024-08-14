import { Hono } from 'hono';

import BlogRouter from './routes/blog';
import UserRouter from './routes/user';

const app = new Hono().basePath('/api/v1');

app.route('/blog', BlogRouter);
app.route('/user', UserRouter);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app;
