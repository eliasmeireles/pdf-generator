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
const logger = require("../util/logger");
const isDockerContainer = process.env.PUPPETEER_DOCKER;
class PDFGeneratorService {
    constructor() {
        this.getPageLoadConfig = (req) => req.body;
    }
    PDFGenerator(req, res) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pageLoadConfig = this.getPageLoadConfig(req);
                const browser = yield this.createBrowser();
                const page = yield browser.newPage();
                if (pageLoadConfig.htmlBase64) {
                    const htmlContent = Buffer.from(pageLoadConfig.htmlBase64, 'base64').toString('utf8');
                    yield page.setContent(htmlContent);
                } else if (pageLoadConfig.targetUrl) {
                    yield page.goto(pageLoadConfig.targetUrl, {waitUntil: 'networkidle0'});
                } else {
                    res.status(400).send({error: 'Needs to set targetUrl or htmlBase64'});
                    logger.newrelic({
                        level: 'INFO',
                        message: 'Invalid request data',
                        transactionSubType: 'pdf-generator-content-not-set',
                    });
                    return;
                }
                for (const elementId of (_a = pageLoadConfig.requiredElementsIds) !== null && _a !== void 0 ? _a : []) {
                    yield page.waitForSelector(`#${elementId}`, {timeout: Number((_b = pageLoadConfig.elementsWaitTimeout) !== null && _b !== void 0 ? _b : 0)});
                }
                if (pageLoadConfig.checkElementsValue) {
                    for (let checkValueIsPresent of pageLoadConfig.checkElementsValue) {
                        yield this.checkElementWithValue(page, checkValueIsPresent);
                    }
                }
                yield this.tryRemoveUnexpectedElement(page);
                const pdf = yield page.pdf({format: (_c = pageLoadConfig.format) !== null && _c !== void 0 ? _c : 'A4'});
                yield browser.close();
                res.setHeader('Content-Type', 'application/pdf');
                res.send(pdf);
                logger.newrelic({
                    level: 'INFO',
                    transactionSubType: 'pdf-generator-content-generated',
                    message: 'New PDF generated successful.',
                });
            } catch (err) {
                logger.newrelic({
                    level: 'ERROR',
                    transactionSubType: 'pdf-generator-error',
                    message: 'Failed to generate PDF',
                    error: err
                });
                res.status(500).send({
                    message: err.message,
                    error: err,
                });
            }
        });
    }

    checkElementWithValue(page, check) {
        return __awaiter(this, void 0, void 0, function* () {
            const element = yield page.$(`#${check.id}`);
            const innerHTML = element ? yield page.evaluate((el) => el.textContent, element) : null;
            if (check.value !== innerHTML) {
                throw new Error(`Expected value "${check.value}" in element with id "${check.id}" but not found`);
            }
        });
    }

    tryRemoveUnexpectedElement(page) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lastElement = yield page.evaluateHandle(() => document.body.lastElementChild);
                const elementId = yield page.evaluate(el => el.id, lastElement);
                if (elementId && elementId.includes('SvgjsSvg')) {
                    yield page.evaluate(el => el.remove(), lastElement);
                }
            } catch (error) {
                logger.newrelic({
                    level: 'ERROR',
                    transactionSubType: 'pdf-generator-element-rm',
                    message: 'Failed to remove element:',
                    error: error
                });
            }
        });
    }

    createBrowser() {
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
            options['executablePath'] = '/usr/lib64/chromium-browser/chromium-browser';
        }
        return puppeteer_1.default.launch(options);
    }
}
exports.default = new PDFGeneratorService();
//# sourceMappingURL=PDFGeneratorService.js.map
