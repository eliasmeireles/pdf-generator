"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const puppeteer_1 = __importDefault(require("puppeteer"));
const isDockerContainer = process.env.PUPPETEER_DOCKER;
class PDFGeneratorService {
    constructor() {
        this.getPageLoadConfig = (req) => req.body;
    }
    PDFGenerator(req, res) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                    ],
                };
                if (isDockerContainer) {
                    console.log('App running under a container. Add /usr/bin/chromium-browser on config options.');
                    options['executablePath'] = '/usr/lib64/chromium-browser';
                }
                const pageLoadConfig = this.getPageLoadConfig(req);
                const browser = yield puppeteer_1.default.launch(options);
                const page = yield browser.newPage();
                if (pageLoadConfig.htmlBase64) {
                    const htmlContent = Buffer.from(pageLoadConfig.htmlBase64, 'base64').toString('utf8');
                    yield page.goto('data:text/html;charset=UTF-8,' + encodeURI(htmlContent), {
                        waitUntil: 'networkidle0' // Wait until the page is fully loaded
                    });
                } else if (pageLoadConfig.targetUrl) {
                    yield page.goto(pageLoadConfig.targetUrl, {waitUntil: 'networkidle0'});
                } else {
                    res.status(400).send({error: 'Needs to set targetUrl or htmlBase64'});
                    return;
                }
                for (const ele of (_a = pageLoadConfig.requiredElements) !== null && _a !== void 0 ? _a : []) {
                    yield page.waitForSelector(ele, {timeout: Number((_b = pageLoadConfig.elementsWaitTimeout) !== null && _b !== void 0 ? _b : 0)});
                }
                try {
                    const lastElement = yield page.evaluateHandle(() => document.body.lastElementChild);
                    const elementId = yield page.evaluate(el => el.id, lastElement);
                    if (elementId && elementId.includes('SvgjsSvg')) {
                        yield page.evaluate(el => el.remove(), lastElement);
                    }
                } catch (error) {
                    console.log('Failed to remove element:', error);
                }
                const pdf = yield page.pdf({format: (_c = pageLoadConfig.format) !== null && _c !== void 0 ? _c : 'A4'});
                yield browser.close();
                res.setHeader('Content-Type', 'application/pdf');
                res.send(pdf);
            } catch (err) {
                console.log(err);
                res.status(500).send({error: 'Failed to generate PDF'});
            }
        });
    }
}
exports.default = new PDFGeneratorService();
//# sourceMappingURL=PDFGeneratorService.js.map
