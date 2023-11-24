"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const Router_1 = require("./app/router/Router");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json({limit: '100mb'}));
app.post('/', Router_1.PDFGenerate);
const port = process.env.PDF_GENERATOR_SERVER_PORT || 3100;
app.listen(port, () => console.log(`Server running on port ${port}`));
//# sourceMappingURL=app.js.map
