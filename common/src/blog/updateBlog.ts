import z from 'zod'

export const updateBlogInput = z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    id: z.string().uuid(),
    published: z.boolean().default(false),
})

export type UpdateBlogInput = z.infer<typeof updateBlogInput>