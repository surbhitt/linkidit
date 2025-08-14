import {Request, Response} from 'express'
import express from 'express'
import { identify } from './controllers/orderController'

const app = express()

app.use(express.json())

app.get( '/', (req: Request, res: Response) => {
    res.status(200).json({"message" : "access /identify"})
})

app.get( '/identify', async (req: Request, res: Response) => {
    let {phoneNumber, email} = req.body
    let rows = await identify(phoneNumber, email)
    console.log(rows)
    res.status(200).json(req.body)
})

export default app
