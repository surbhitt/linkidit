import app from './app'
import { initDB } from './controllers/orderController'

let port: number = 3000

// TODO: get port from config/env variables
app.listen(port, async () => {
    // make sure the db is ready
    await initDB()
    console.log(`Db connected`)
    console.log(`Server routing on port http://localhost:${port}`)
})
