const puppeteer = require('puppeteer')
const pt = require('promise-timeout')

const logger = require('../util/logger')

const isDockerContainer = process.env.PUPPETEER_DOCKER

const pagePromiseTimeout = isDockerContainer ? process.env.PAGE_PROMISE_TIMEOUT : 30000

const pageNavigationTimeout = isDockerContainer ? process.env.NAVIGATION_TIMEOUT : 30000

const maxPages = isDockerContainer ? process.env.MAX_PAGES : 5

const maxHtmlSize = isDockerContainer ? process.env.MAX_HTML_SIZE : 10000000

function createBrowser() {
    const options = {
        headless: 'old',
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
    }

    if (isDockerContainer) options.executablePath = '/usr/bin/chromium-browser'

    return puppeteer.launch(options)
}

let browserPromise = createBrowser()

let creatingBrowser = false
let openedPages = 0

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

exports.createPdf = async (file, convertionId, token, res) => {
    if (file.length > maxHtmlSize) {
        const maxHtmlSizeErrorMessage = `HTML muito grande. Tamanho máximo permitido: ${maxHtmlSize} bytes`
        logger.error(maxHtmlSizeErrorMessage)
        logger.newrelic('ERROR', convertionId, token, maxHtmlSizeErrorMessage, 0)
        return res.status(413).send(maxHtmlSizeErrorMessage)
    }

    let transactionSubType = 'CONVERTED_PDF'
    let message
    let status = 200
    let buffer
    let startTime
    let endTime

    return browserPromise.then(async (browser) => {
        try {
            while (creatingBrowser || openedPages >= maxPages)
                // Esperar enquanto cria navegador ou enquanto já está com o máximo de páginas abertas
                await sleep(5)
            openedPages += 1 // Abriu página

            startTime = new Date()

            const pagePromise = browser.newPage()

            const page = await pt.timeout(pagePromise, pagePromiseTimeout)

            page.setDefaultNavigationTimeout(pageNavigationTimeout)
            await page.setContent(file.toString())
            await page.screenshot()
            buffer = await page.pdf({format: 'A4', printBackground: true})
            await page.close()
            openedPages -= 1 // Fechou página
        } catch (err) {
            openedPages -= 1

            if (err instanceof pt.TimeoutError) {
                status = 504
            } else {
                status = 500
            }

            if (!creatingBrowser) {
                // Se já não estiver sendo criado a gente cria um novo
                creatingBrowser = true
                while (openedPages > 0)
                    // Enquanto tiver página aberta vamos esperar pra poder recriar o navegador
                    await sleep(5)
                browserPromise = createBrowser()
                creatingBrowser = false
            }

            logger.error(err)
            transactionSubType = 'ERROR'
            message = err.message
        }

        endTime = new Date()
        const ms = endTime - startTime

        logger.newrelic(transactionSubType, convertionId, token, message, ms)
        res.type('application/pdf')

        res.status(status).send(buffer)
    })
}
