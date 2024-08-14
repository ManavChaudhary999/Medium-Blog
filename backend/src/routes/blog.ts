import { Hono } from "hono";

const router = new Hono();

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