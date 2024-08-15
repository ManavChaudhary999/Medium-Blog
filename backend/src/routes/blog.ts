import { Hono } from "hono";
import { verify } from 'hono/jwt';
import {PrismaClient} from '@prisma/client';


type Bindings = {
    JWT_SECRET_KEY: string,
}
type Variables = {
    userId: string,
    prisma: PrismaClient,
}
const router = new Hono<{Bindings: Bindings, Variables: Variables}>();

// Middleware
router.use('/*', async (c, next)=> {
    const authorization = c.req.header('Authorization');

    if(!authorization || !authorization.startsWith('Bearer ')) {
        return c.json({ message: 'Invalid authorization'}, 401)
    }

    try {
        const token = authorization.slice(7);
        const payload = await verify(token, c.env.JWT_SECRET_KEY);
        
        if(!payload) {
            return c.json({ message: 'Invalid token'}, 401)
        }
    
        // @ts-ignore
        c.set('userId', payload.id);
        await next();
    }
    catch(error){
        return c.json({ message: 'Somethings Wrong'}, 403)
    }
});

// Routes
//  TODO: Add Pagination
router.get('/bulk', async (c) => {
    const prisma = c.get('prisma');
    
    const posts = await prisma.post.findMany();

    return c.json(posts);
});

router.post('/', async (c) => {
    const prisma = c.get('prisma');
    const userId = c.get('userId');

    const {title, content, published} = await c.req.json();

    if(!title ||!content) {
        return c.json({ message: 'Title and content are required'}, 400);
    }

    try {
        const post = await prisma.post.create({
            data: {title, content, published, authorId: userId}
        });

        return c.json(post);
    }
    catch(error) {
        return c.json({ message: 'Could not create post'}, 400);
    }
});

router.get('/:id', async (c) => {
    const prisma = c.get('prisma');
    const userId = c.get('userId');

    const postId = c.req.param('id');

    try{
        const post = await prisma.post.findUnique({
            where: {id: postId, authorId: userId}        
        });

        if(!post) return c.json({ message: 'Post not found'}, 400);

        return c.json(post);
    }
    catch(error) {
        return c.json({ message: 'Something Wrong While fetching data'}, 501);  
    }
});

router.put('/:id', async (c) => {
    const prisma = c.get('prisma');
    const userId = c.get('userId');
    
    const postId = c.req.param('id');
    const {title, content, published} = await c.req.json();

    if(!title && !content && !published) return c.json({ message: 'Title and content are required'}, 400);

    try {
        const post = await prisma.post.update({
            where: {id: postId, authorId: userId},
            data: {title, content, published}
        });

        return c.json(post);
    }
    catch(error) {
        return c.json({ message: 'Could not update post'}, 400);
    }

});

export default router;