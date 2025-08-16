import { Request, Response } from 'express'
import express from 'express'
import { identify } from './controllers/orderController'

const app = express()

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ "message": "access /identify" })
})

app.get('/identify', async (req: Request, res: Response) => {
    if (!req.body) res.status(400).json({'message': 'require atleast phoneNumber or email in req.body'})
    let { phoneNumber, email } = req.body
    let rows = await identify(phoneNumber, email)
    console.log(rows)
    res.status(200).json(rows)
})

export default app
