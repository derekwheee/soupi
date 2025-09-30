import express from 'express'
import prisma from '../prisma'

const app = express()

app.use(express.json())

// app.post(`/post`, async (req, res) => {
//     const { title, content, authorEmail } = req.body
//     const result = await prisma.post.create({
//         data: {
//             title,
//             content,
//             author: { connect: { email: authorEmail } },
//         },
//     })
//     res.json(result)
// })

// app.put('/post/:id/views', async (req, res) => {
//     const { id } = req.params

//     try {
//         const post = await prisma.post.update({
//             where: { id: Number(id) },
//             data: {
//                 viewCount: {
//                     increment: 1,
//                 },
//             },
//         })

//         res.json(post)
//     } catch (error) {
//         res.json({ error: `Post with ID ${id} does not exist in the database` })
//     }
// })

// app.put('/publish/:id', async (req, res) => {
//     const { id } = req.params

//     try {
//         const postData = await prisma.post.findUnique({
//             where: { id: Number(id) },
//             select: {
//                 published: true,
//             },
//         })

//         const updatedPost = await prisma.post.update({
//             where: { id: Number(id) || undefined },
//             data: { published: !postData?.published },
//         })
//         res.json(updatedPost)
//     } catch (error) {
//         res.json({ error: `Post with ID ${id} does not exist in the database` })
//     }
// })

// app.delete(`/post/:id`, async (req, res) => {
//     const { id } = req.params
//     const post = await prisma.post.delete({
//         where: {
//             id: Number(id),
//         },
//     })
//     res.json(post)
// })

app.get('/recipes', async (req, res) => {
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true } })
    res.json(recipes)
})

// app.get('/user/:id/drafts', async (req, res) => {
//     const { id } = req.params

//     const drafts = await prisma.post.findMany({
//         where: {
//             authorId: Number(id),
//             published: false,
//         },
//     })

//     res.json(drafts)
// })

// app.get(`/post/:id`, async (req, res) => {
//     const { id }: { id?: string } = req.params

//     const post = await prisma.post.findUnique({
//         where: { id: Number(id) },
//     })
//     res.json(post)
// })

app.listen(process.env.PORT, () =>
    console.log(`Server ready at: http://localhost:${process.env.PORT}`)
)
