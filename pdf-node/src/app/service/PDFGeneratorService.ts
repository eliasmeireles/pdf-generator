import {PageLoadConfig} from "../model/PageLoadConfig";
import {Request, Response} from 'express';


import puppeteer, {Browser, PuppeteerLaunchOptions} from "puppeteer";
const  logger =  require("../util/logger");

const isDockerContainer = process.env.PUPPETEER_DOCKER

class PDFGeneratorService {

    createBrowser(): Promise<Browser> {
        const options = {
            headless: true,
            args: [
                '--no-sandbox',
                '--window-size=1920,1080',
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

    async PDFGenerator(req: Request, res: Response) {
        try {

            const pageLoadConfig = this.getPageLoadConfig(req)

            const browser = await this.createBrowser();
            const page = await browser.newPage();

            if (pageLoadConfig.htmlBase64) {
                const htmlContent = Buffer.from(pageLoadConfig.htmlBase64, 'base64').toString('utf8');
                await page.goto('data:text/html;charset=UTF-8,' + encodeURI(htmlContent), {
                    waitUntil: 'networkidle0' // Wait until the page is fully loaded
                });
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

            for (const ele of pageLoadConfig.requiredElements ?? []) {
                await page.waitForSelector(ele, {timeout: Number(pageLoadConfig.elementsWaitTimeout ?? 0)});
            }

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

            const pdf = await page.pdf({format: pageLoadConfig.format ?? 'A4'});

            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdf);
            logger.newrelic({
                level: 'INFO',
                transactionSubType: 'pdf-generator-content-generated',
                message: 'New PDF generated succesfful.',
            })
        } catch (err) {
            logger.newrelic({
                level: 'ERROR',
                transactionSubType: 'pdf-generator-error',
                message: 'Failed to generate PDF',
                error: err
            })
            res.status(500).send({error: 'Failed to generate PDF'});
        }
    }

    getPageLoadConfig = (req: Request): PageLoadConfig =>
        req.body as PageLoadConfig
}

export default new PDFGeneratorService()
