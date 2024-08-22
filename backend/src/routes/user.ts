import { Hono } from "hono";
import { sign, verify } from 'hono/jwt';
import {PrismaClient} from '@prisma/client';


type Bindings = {
    JWT_SECRET_KEY: string,
    MAILGUN_API_KEY: string
    MAILGUN_DOMAIN: string
}
type Variables = {
    prisma: PrismaClient,
    userId: string,
}
const router = new Hono<{Bindings: Bindings, Variables: Variables}>();

// Helper
function generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
async function SendMail(MAILGUN_API_KEY : string, MAILGUN_DOMAIN : string, to : string, otp : string) {
    const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
    const auth = `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`

    const response = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
        from: `999manavchaudhary@gmail.com`,
        to,
        subject: 'OTP Authentication',
        text: otp,
        }),
    })
    if(!response.ok) throw new Error(`Failed to send email: ${response.statusText}`);
}

// Middleware
router.use('/verification', async (c, next)=> {
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

router.post('/verification', async (c) => {
    const prisma = c.get('prisma');
    const userId = c.get('userId');
    const {otp} = await c.req.json();

    try {
        const otpRecord = await prisma.otp.findFirst({
            where: { authorId: userId, value: otp }
        })

        console.log(otpRecord);

        if (!otpRecord || otpRecord.expiresAt < new Date()) return c.json({ message: 'Invalid OTP' }, 400);

        await prisma.user.update({
            where: { id: userId },
            data: { verified: true }
        })
        
        await prisma.otp.deleteMany({
            where: { authorId: userId }
        })

        return c.json({ message: 'OTP verified' }, 200);
    }
    catch (error) {
        return c.json({ message: 'Verification failed' }, 400);
    }
});

router.post('/signup', async (c) => {
    const prisma = c.get('prisma');
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, JWT_SECRET_KEY } = c.env

    const { name, email, password } = await c.req.json();

    try {
        const user = await prisma.user.create({
            data: { name, email, password },
        });

        const generatedOtp = generateOtp();

        const otp = await prisma.otp.create({
            data: {
                value: generatedOtp,
                expiresAt: new Date(Date.now() + 300000),
                author: { connect: { id: user.id } }
            }
        })

        await SendMail(MAILGUN_API_KEY, MAILGUN_DOMAIN, email, generatedOtp);

        const token = await sign({id: user.id}, JWT_SECRET_KEY);
    
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