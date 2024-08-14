import { Hono } from 'hono';

import BlogRouter from './routes/blog';
import UserRouter from './routes/user';
import getPrismaClient from './db';

type Bindings = {
  DATABASE_URL: string,
  JWT_SECRET_KEY: string,
}

type Variables = {
  prisma: any,
}

const app = new Hono<{Bindings: Bindings, Variables: Variables}>().basePath('/api/v1');

app.use("*", async (c, next) => {
  const prisma = await getPrismaClient(c.env.DATABASE_URL);
  c.set('prisma', prisma);
  await next();
})

app.route('/blog', BlogRouter);
app.route('/user', UserRouter);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app;
