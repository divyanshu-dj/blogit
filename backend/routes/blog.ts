import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { createBlogInput } from '@nobody010/medium-common/dist/blog/createBlog'
import { updateBlogInput } from '@nobody010/medium-common/dist/blog/updateBlog'

const blog = new Hono<{
    Bindings: {
        JWT_SECRET: string
        DATABASE_URL: string
    }
    Variables: {
        userId: string
        
    }
}>()

blog.use('/*', async (c, next) => {
    const header = c.req.header('Authorization') || "";
    const token = header.split(' ')[1];
    try {
        const payload = await verify(token, c.env.JWT_SECRET);
        if (!payload) {
            c.status(401);
            return c.json({ error: "unauthorized" });
        }
        c.set('userId', payload.id);
        await next()
    } catch (error) {
        c.status(403)
        return c.json({ msg: 'you are not logged in' })
    }
})

blog
    //create a new blog post
    .post('/', async (c) => {
        const prisma = new PrismaClient({
            datasourceUrl: c.env?.DATABASE_URL,
        }).$extends(withAccelerate());

        try {
            const body = await c.req.json();

            const { success } = createBlogInput.safeParse(body);
            if ( !success ) {
                c.status(411)
                return c.json({ error: 'invalid input' })
            }

            const post = await prisma.post.create({
                data: {
                    title: body.title,
                    content: body.content,
                    authorId: c.get('userId')
                }
            })

            return c.json({ id: post.id})
        } catch (error: any) {
            c.status(411)
            return c.json({ error: error.message as string })
        }
    })
    //Update a blog post
    .put(async (c) => {
        const prisma = new PrismaClient({
            datasourceUrl: c.env?.DATABASE_URL,
        }).$extends(withAccelerate());

        try {
            const body = await c.req.json();

            const { success } = updateBlogInput.safeParse(body);
            if ( !success ) {
                c.status(411)
                return c.json({ error: 'invalid input' })
            }

            const blog = await prisma.post.update({
                where: {
                    id: body.id
                },
                data: {
                    title: body.title,
                    content: body.content,
                }
            })

            return c.json({ id: blog.id})
        } catch (error: any) {
            c.status(411)
            return c.json({ error: error.message as string })
        }
    })

blog.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany()

    return c.json({ blogs})
})
    
    
// get blog post by id
blog.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const id = c.req.param('id')

        const blog = await prisma.post.findFirst({
            where: {
                id
            }
        })

        return c.json({ blog})
    } catch (error: any) {
        c.status(411)
        return c.json({ error: error.message as string })
    }
})


export default blog