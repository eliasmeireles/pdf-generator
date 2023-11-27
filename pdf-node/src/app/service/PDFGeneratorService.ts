import {CheckElementValue, PageLoadConfig} from "../model/PageLoadConfig";
import {Request, Response} from 'express';

import puppeteer, {Browser, ElementHandle, Page, PuppeteerLaunchOptions} from "puppeteer";

const logger = require("../util/logger");

const isDockerContainer = process.env.PUPPETEER_DOCKER

class PDFGeneratorService {

    async PDFGenerator(req: Request, res: Response) {
        try {

            const pageLoadConfig = this.getPageLoadConfig(req)

            const browser = await this.createBrowser();
            const page = await browser.newPage();

            if (pageLoadConfig.htmlBase64) {
                const htmlContent = Buffer.from(pageLoadConfig.htmlBase64, 'base64').toString('utf8');
                await page.setContent(htmlContent)
            } else if (pageLoadConfig.targetUrl) {
                await page.goto(pageLoadConfig.targetUrl, {waitUntil: 'networkidle0'});
            } else {
                res.status(400).send({error: 'Needs to set targetUrl or htmlBase64'});
                logger.newrelic({
                    level: 'INFO',
                    message: 'Invalid request data',
                    transactionSubType: 'pdf-generator-content-not-set',
                })
                return
            }

            for (const elementId of pageLoadConfig.requiredElementsIds ?? []) {
                await page.waitForSelector(`#${elementId}`, {timeout: Number(pageLoadConfig.elementsWaitTimeout ?? 0)});
            }

            if (pageLoadConfig.checkElementsValue) {
                for (let checkValueIsPresent of pageLoadConfig.checkElementsValue) {
                    await this.checkElementWithValue(page, checkValueIsPresent);
                }
            }

            await this.tryRemoveUnexpectedElement(page)

            const pdf = await page.pdf({format: pageLoadConfig.format ?? 'A4'});

            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdf);
            logger.newrelic({
                level: 'INFO',
                transactionSubType: 'pdf-generator-content-generated',
                message: 'New PDF generated successful.',
            })
        } catch (err) {
            logger.newrelic({
                level: 'ERROR',
                transactionSubType: 'pdf-generator-error',
                message: 'Failed to generate PDF',
                error: err
            })
            res.status(500).send({
                message: err.message,
                error: err,
            });
        }
    }

    private async checkElementWithValue(page: Page, check: CheckElementValue): Promise<void> {
        const element: ElementHandle | null = await page.$(`#${check.id}`);
        const innerHTML: string | null = element ? await page.evaluate((el) => el.textContent, element) : null;

        if (check.value !== innerHTML) {
            throw new Error(`Expected value "${check.value}" in element with id "${check.id}" but not found`);
        }
    }

    private async tryRemoveUnexpectedElement(page: Page): Promise<void> {
        try {
            const lastElement = await page.evaluateHandle(() => document.body.lastElementChild);

            const elementId = await page.evaluate(el => el.id, lastElement);
            if (elementId && elementId.includes('SvgjsSvg')) {
                await page.evaluate(el => el.remove(), lastElement);
            }
        } catch (error) {
            logger.newrelic({
                level: 'ERROR',
                transactionSubType: 'pdf-generator-element-rm',
                message: 'Failed to remove element:',
                error: error
            })
        }
    }

    private createBrowser(): Promise<Browser> {
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
        } as PuppeteerLaunchOptions


        if (isDockerContainer) {
            options['executablePath'] = '/usr/lib64/chromium-browser/chromium-browser'
        }

        return puppeteer.launch(options)
    }

    getPageLoadConfig = (req: Request): PageLoadConfig =>
        req.body as PageLoadConfig
}

export default new PDFGeneratorService()
