import { Hono } from "hono";
import { verify } from 'hono/jwt';


type Bindings = {
    DATABASE_URL: string,
    JWT_SECRET_KEY: string,
}

type Variables = {
    userId: string,
}

const router = new Hono<{Bindings: Bindings, Variables: Variables}>();


// Middleware
router.use('/*', async (c, next)=> {
    const authorization = c.req.header('Authorization');

    if(!authorization || !authorization.startsWith('Bearer ')) {
        return c.json({ message: 'Invalid authorization'}, 401)
    }

    const token = authorization.slice(7);
    const payload = await verify(token, c.env.JWT_SECRET_KEY);
    
    if(!payload) {
        return c.json({ message: 'Invalid token'}, 401)
    }

    c.set('userId', payload.id);

    await next();
});

// Routes
router.get('/bulk', (c) => {
    return c.text('Get All blog');
});

router.get('/:id', (c) => {
    const {id} = c.req.param();
    return c.text('Get blog for: ' + id);
});

router.post('/', (c) => {
    return c.text('Post blog');
});

router.put('/', (c) => {
    return c.text('Put blog');
});

export default router;