import app from './app'
import { initDB } from './controllers/orderController'
import fs from 'fs'
import path from 'path'

let port: number = 3000
const dataDir = path.resolve(__dirname, '../data');

// TODO: get port from config/env variables
app.listen(port, async () => {

    // make data folder for the db
    if (!fs.existsSync(dataDir)) {
        console.log('Created data folder')
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // make sure the db is ready
    await initDB()

    console.log(`Db connected`)
    console.log(`Server routing on port http://localhost:${port}`)
})
