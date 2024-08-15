import { Hono } from "hono";
import { sign } from 'hono/jwt';
import {PrismaClient} from '@prisma/client';


type Bindings = {
    JWT_SECRET_KEY: string,
}
type Variables = {
    prisma: PrismaClient,
}
const router = new Hono<{Bindings: Bindings, Variables: Variables}>();

router.post('/signup', async (c) => {
    const prisma = c.get('prisma');

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
    const prisma = c.get('prisma');

    const { email, password } = await c.req.json();

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
                password: password
            }
        })
    
        if(!user) {
            return c.json({message: 'email or password is Incorrect'}, 400);
        }
    
        const token = await sign({ id: user.id }, c.env.JWT_SECRET_KEY)
    
        return c.json({ token });
    }
    catch (error) {
        return c.json({ message: 'Signin failed' }, 501);
    }
});

export default router;