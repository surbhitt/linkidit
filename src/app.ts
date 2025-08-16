import { Request, Response } from 'express'
import express from 'express'
import { identify } from './controllers/orderController'

const app = express()

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ "message": "access /identify" })
})

// Basic validaton check for phone and email
const isValidBody = (phoneNumber: string, email: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    const isPhoneValid = phoneRegex.test(phoneNumber);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isEmailValid = emailRegex.test(email);

    return isPhoneValid && isEmailValid;
}

app.post('/identify', async (req: Request, res: Response) => {
    if (!req.body) res.status(400).json({ 'message': 'require atleast phoneNumber or email in req.body' })
    let { phoneNumber, email } = req.body
    if (!isValidBody(phoneNumber, email)) res.status(400).json({ 'message': 'invalid phoneNumber(10 digits required) or email(abc@def.com format required)' })

    try {
        let consolidated = await identify(phoneNumber, email)
        res.status(200).json(consolidated)
    } catch (err) {
        res.status(500).json({ "message": err })
    }
})

export default app
