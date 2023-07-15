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

@Controller("summary")
class TestController {

    @Get
    @Produces(value = ["application/pdf"])
    fun summary(@Parameter url: String): HttpResponse<ByteArray> {
        val options = ChromeOptions()
        options.addArguments("--no-sandbox")
        options.addArguments("--headless")
        options.addArguments("--disable-dev-shm-usage")
        options.addArguments("--remote-allow-origins=*")

        val drive = ChromeDriver(options)
        val printOptions = PrintOptions()
        printOptions.orientation = PrintOptions.Orientation.LANDSCAPE
        printOptions.shrinkToFit = false

        LoggerFactory.getLogger(javaClass).info("Generating pdf from {}", url)
        drive.get(url)
        Thread.sleep(1000)

        val print = drive.print(printOptions)
        drive.close()
        return HttpResponse.ok(OutputType.BYTES.convertFromBase64Png(print.content))
    }
}
