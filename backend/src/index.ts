import express from  "express"
import userRoute from "./routers/user"
import workerRoute from "./routers/worker"

const app = express();

export const JWT_SECRET = "shash"; 

app.use("/v1/user", userRoute);
app.use("/v1/worker", workerRoute);


app.listen(3000)