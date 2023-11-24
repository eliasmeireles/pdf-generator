import {PaperFormat} from "puppeteer";

export interface PageLoadConfig {
    targetUrl?: string
    htmlBase64?: string
    elementsWaitTimeout?: number
    requiredElements?: string[]
    format?: PaperFormat
}
