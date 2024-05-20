import z from 'zod'

export const createBlogInput = z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    published: z.boolean().default(false),
})

export type CreateBlogInput = z.infer<typeof createBlogInput>