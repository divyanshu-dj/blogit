import z from 'zod'

export const loginInput = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export type LodginInput = z.infer<typeof loginInput>