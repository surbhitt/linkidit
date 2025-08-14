import {Request, Response} from 'express'
import express from 'express'

const app = express()

app.use(express.json())

app.get( '/', (req: Request, res: Response) => {
    res.status(200).json({"message" : "access /identify"})
})

app.get( '/identify', (req: Request, res: Response) => {
    let {phone, email} = req.body
    console.log(phone, email)
    res.status(200).json(req.body)
})

export default app
