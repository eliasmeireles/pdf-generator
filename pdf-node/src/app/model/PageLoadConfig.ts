import {PaperFormat} from "puppeteer";

export interface CheckElementValue {
    id: string
    value: string
}

export interface PageLoadConfig {
    targetUrl?: string
    htmlBase64?: string
    elementsWaitTimeout?: number
    requiredElementsIds?: string[]
    format?: PaperFormat
    checkElementsValue?: CheckElementValue[]
}
