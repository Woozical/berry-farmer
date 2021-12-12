import express from "express";
import { NotFoundError, ExpressError } from "./expressError";

const app: express.Application = express();
const port: number = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({message: "You have reached the BerryFarmer API"});
});

/** Catch missing routes and push on 404 Error */
app.use( (req, res, next) => {
  return next(new NotFoundError());
});

/** Generic error handler, all unhandled errors are caught here. */
app.use((err:ExpressError & Error, req:express.Request, res:express.Response, next:express.NextFunction) => {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  
  const { message, status=500 } = err;
  return res.status(status).json({ error: {message, status} });
});

app.listen(port, () => {
  console.log(`Express App started on http://localhost:${port}/`);
});