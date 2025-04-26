import express from  "express"
import userRoute from "./routers/user"
import workerRoute from "./routers/worker"
import cors from "cors"

const app = express();

app.use(express.json());
app.use(cors());

app.use("/v1/user", userRoute);
app.use("/v1/worker", workerRoute);


app.listen(3000)