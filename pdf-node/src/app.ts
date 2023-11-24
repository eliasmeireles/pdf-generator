import express from "express";

import bodyParser from "body-parser";

import {PDFGenerate} from "./app/router/Router";

const app = express();

app.use(bodyParser.json({limit: '100mb'}));

app.post('/', PDFGenerate);

const port = process.env.PDF_GENERATOR_SERVER_PORT || 3100;

app.listen(port, () => console.log(`Server running on port ${port}`));
