import {PageLoadConfig} from "../model/PageLoadConfig";
import {Request, Response} from 'express';

import puppeteer from "puppeteer";

class PDFGeneratorService {

    async PDFGenerator(req: Request, res: Response) {
        try {
            const pageLoadConfig = this.getPageLoadConfig(req)

            const browser = await puppeteer.launch({headless: true});
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
                return
            }

            for (const ele of pageLoadConfig.requiredElements ?? []) {
                await page.waitForSelector(ele, {timeout: Number(pageLoadConfig.elementsWaitTimeout ?? 0)});
            }

            const pdf = await page.pdf({format: pageLoadConfig.format ?? 'A4'});

            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdf);
        } catch (err) {
            res.status(500).send({error: 'Failed to generate PDF'});
        }
    }

    getPageLoadConfig = (req: Request): PageLoadConfig =>
        req.body as PageLoadConfig
}

export default new PDFGeneratorService()
