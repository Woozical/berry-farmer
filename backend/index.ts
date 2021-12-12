"use strict";
import app from "./app";

const port: number = 3001;

app.listen(port, () => {
  console.log(`Express App started on http://localhost:${port}/`);
});
