"use strict";

import express from "express";
import { NotFoundError, ExpressError } from "./expressError";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import farmRoutes from "./routes/farms";
import berryRoutes from "./routes/berries";
import cropRoutes from "./routes/crops";
import locationRoutes from "./routes/locations";
import Farm from "./models/farm";
import User from "./models/user";
import GeoProfile from "./models/geoProfiles";
import cors from "cors";

const app: express.Application = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/farms", farmRoutes);
app.use("/berries", berryRoutes);
app.use("/crops", cropRoutes);
app.use("/locations", locationRoutes);
app.get('/', async (req, res) => {
  const [farms, users, locations] = await Promise.all([Farm.getCount(), User.getCount(), GeoProfile.getCount()]);
  return res.json({ message: "You have reached the BerryFarmer API.", farms, users, locations });
});

/** Catch missing routes and push on 404 Error */
app.use( (req, res, next) => {
  return next(new NotFoundError());
});

/** Generic error handler, all unhandled errors are caught here. */
app.use( (err:ExpressError & Error, req:express.Request, res:express.Response, next:express.NextFunction) => {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  
  const { message, status=500 } = err;
  return res.status(status).json({ error: {message, status} });
});

export default app;