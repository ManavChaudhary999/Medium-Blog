import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'


const router = new Hono<{
	Bindings: {
		DATABASE_URL: string
	}
}>();

router.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const { name, email, password } = await c.req.json();
    try {
        const user = await prisma.user.create({
            data: { name, email, password },
        });
    
        return c.json({ user });
    }
    catch (error) {
        console.error(error);
        return c.json({ message: 'Signup failed' }, 400);
    }
});

router.post('/signin', (c) => {
    return c.text('Sign in');
});

export default router;