import {Request, Response} from 'express'
import express from 'express'

const app = express()

app.use(express.json())

app.get( '/', (req: Request, res: Response) => {
    console.log('hello express world')
    res.status(200).json({"message" : "hello from express"})
})

export default app
