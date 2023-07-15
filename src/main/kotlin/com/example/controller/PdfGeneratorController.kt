package com.example.controller

import io.micronaut.context.annotation.Parameter
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Produces
import org.openqa.selenium.OutputType
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.print.PrintOptions
import org.slf4j.LoggerFactory

@Controller("/")
class PdfGeneratorController {

    private val options = ChromeOptions()
    private val printOptions = PrintOptions()

    init {
        options.addArguments("--no-sandbox")
        options.addArguments("--headless")
        options.addArguments("--disable-dev-shm-usage")
        options.addArguments("--remote-allow-origins=*")

        printOptions.orientation = PrintOptions.Orientation.LANDSCAPE
        printOptions.shrinkToFit = false
    }

    @Get
    @Produces(value = ["application/pdf"])
    fun summary(@Parameter url: String): HttpResponse<ByteArray> {
        LoggerFactory.getLogger(javaClass).info("Generating pdf from {}", url)

        val drive = ChromeDriver(options)

        drive.run { get(url) }

        Thread.sleep(2000)

        val print = drive.print(printOptions)
        drive.close()
        return HttpResponse.ok(OutputType.BYTES.convertFromBase64Png(print.content))
    }
}
