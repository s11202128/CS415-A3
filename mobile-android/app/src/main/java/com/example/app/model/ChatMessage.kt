package com.example.app.model

data class ChatMessage(
    val id: String,
    val sessionId: String,
    val senderId: String,
    val senderRole: String, // "customer" or "admin"
    val message: String,
    val timestamp: String
)