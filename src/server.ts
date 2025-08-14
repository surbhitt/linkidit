import app from './app'

let port: number = 3000

// TODO: get port from config/env variables
app.listen(port, ()=> {
    console.log(`Server routing on port http://localhost:${port}`)
})
