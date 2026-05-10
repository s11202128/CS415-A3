package com.example.app.api

import com.example.app.model.ChatMessage
import com.example.app.model.Issue
import com.example.app.model.Rating
import retrofit2.Call
import retrofit2.http.*

interface ChatApiService {
    @POST("/api/chat/start")
    fun startChat(@Body body: Map<String, String>): Call<Issue>

    @POST("/api/chat/message")
    fun sendMessage(@Body message: Map<String, String>): Call<ChatMessage>

    @GET("/api/chat/{sessionId}/messages")
    fun getMessages(@Path("sessionId") sessionId: String): Call<List<ChatMessage>>

    @GET("/api/issues")
    fun getIssues(): Call<List<Issue>>

    @PATCH("/api/issues/{id}/resolve")
    fun resolveIssue(@Path("id") id: String): Call<Issue>

    @PATCH("/api/issues/{id}/unresolve")
    fun unresolveIssue(@Path("id") id: String): Call<Issue>

    @POST("/api/issues/{id}/rating")
    fun submitRating(@Path("id") id: String, @Body rating: Map<String, Any>): Call<Rating>
}