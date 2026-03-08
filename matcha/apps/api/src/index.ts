import app, { server } from './app.js'
import { env } from './config/env/env'


server.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`)
})





