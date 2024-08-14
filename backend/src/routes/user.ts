import { Hono } from "hono";
import { sign } from 'hono/jwt';

import getPrismaClient from '../db';

type Bindings = {
    DATABASE_URL: string,
    JWT_SECRET_KEY: string,
}

const router = new Hono<{Bindings: Bindings}>();

router.post('/signup', async (c) => {
    const prisma = await getPrismaClient(c.env.DATABASE_URL);

    const { name, email, password } = await c.req.json();
    try {
        const user = await prisma.user.create({
            data: { name, email, password },
        });

        const token = await sign({id: user.id}, c.env.JWT_SECRET_KEY);
    
        return c.json({ token });
    }
    catch (error) {
        console.error(error);
        return c.json({ message: 'Signup failed' }, 400);
    }
});

router.post('/signin', async (c) => {
    const prisma = await getPrismaClient(c.env.DATABASE_URL);

    const { email, password } = await c.req.json();

    const user = await prisma.user.findUnique({
        where: {
            email: email,
            password: password
        }
    })

    if(!user) {
        return c.json({message: 'Signin Failed'}, 400);
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET_KEY)

    return c.json({ token });
});

export default router;