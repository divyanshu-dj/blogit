import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from 'hono';
import { sign } from 'hono/jwt'
import { signupInput } from '@nobody010/medium-common/dist/user/signup';
import { loginInput } from '@nobody010/medium-common/dist/user/login';

// Create the main Hono app
const user = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	}
}>();

// async function hashPassword(password: string, salt?: string) {
//     if (!salt) {
//         // Generate a random salt if not provided
//         // Generate a random salt
// 		const salt = crypto.getRandomValues(new Uint8Array(16));

// 		// Convert salt to hexadecimal string for storage
// 		const saltHex = Array.prototype.map.call(salt, x => ('00' + x.toString(16)).slice(-2)).join('');
//     }

//     // Convert password to buffer
//     const passwordBuffer = new TextEncoder().encode(password);

//     // Convert salt to buffer
//     const saltBuffer = new TextEncoder().encode(salt);

//     // Concatenate password and salt
//     const concatenatedBuffer = new Uint8Array(passwordBuffer.length + saltBuffer.length);
//     concatenatedBuffer.set(passwordBuffer);
//     concatenatedBuffer.set(saltBuffer, passwordBuffer.length);

//     // Hash the concatenated buffer using SHA-256
//     const hashBuffer = await crypto.subtle.digest('SHA-256', concatenatedBuffer);

//     // Convert hashed password to hexadecimal string for storage
//     const hashedPassword = Array.prototype.map.call(new Uint8Array(hashBuffer), x => ('00' + x.toString(16)).slice(-2)).join('');

//     return { hashedPassword, salt };
// }

user.post('/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const { success } = signupInput.safeParse(body);
	if ( !success) {
		c.status(411);
		return c.json({ error: 'Invalid input' });
	}
	try {
		// const { hashedPassword, salt } = await hashPassword(body.password);

		const user = await prisma.user.create({
			data: {
				name: body.name,
				email: body.email,
				password: body.password,
			}
		});

		const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET);
		const response = "Bearer " + jwt;

		return c.json({response});
	} catch(e) {
		console.error('Error during user signup:', e);
		c.status(403);
		return c.json({ error: (e as Error).message});
	}
});

user.post('/login', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    
	const body = await c.req.json();

	const { success } = loginInput.safeParse(body);
            if ( !success ) {
                c.status(411)
                return c.json({ error: 'invalid input' })
            }

	if (!body.email || !body.password) {
		c.status(400);
		return c.json({ error: 'Email and password are required' });
	}
	
	const user = await prisma.user.findUnique({
		where: { email: body.email }
	});
	if ( !user ) {
		c.status(403);
		return c.json({ error: 'User not found' });
	}

	if ( body.password === user.password ) {
		const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET);
		return c.json({ jwt });
	}
});

export default user;
