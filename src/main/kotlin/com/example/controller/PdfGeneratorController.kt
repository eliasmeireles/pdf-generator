package com.example.controller

import io.micronaut.context.annotation.Parameter
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Produces
import okhttp3.ResponseBody
import org.slf4j.LoggerFactory
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.jackson.JacksonConverterFactory
import retrofit2.converter.scalars.ScalarsConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

data class PrintRequest(val targetUrl: String)

interface RetrofitService {
    @POST("/")
    fun doPost(@Body printRequest: PrintRequest): Call<ResponseBody>
}


@Controller("/")
class PdfGeneratorController {

    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl("http://127.0.0.1:3100")
        .addConverterFactory(JacksonConverterFactory.create())
        .addConverterFactory(ScalarsConverterFactory.create())
        .build()

    private val service = retrofit.create(RetrofitService::class.java)

    @Get
    @Produces(value = ["application/pdf"])
    fun summary(@Parameter url: String): HttpResponse<ByteArray> {
        val logger = LoggerFactory.getLogger(javaClass)

        logger.info("Generating pdf from {}", url)

        val response = service.doPost(PrintRequest(targetUrl = url)).execute()
        return if (response.isSuccessful) {
            HttpResponse.ok(response.body()?.bytes())
        } else {
            logger.info("Generating pdf from {} with error {}", url, response.errorBody())
            HttpResponse.unprocessableEntity()
        }
    }
}
