"use strict";
import app from "./app";
import { PORT } from "./config";

app.listen(PORT, () => {
  console.log(`Express App started on http://localhost:${PORT}/`);
});
