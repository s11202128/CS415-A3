package com.example.app.model

data class Issue(
    val id: String,
    val sessionId: String,
    val customerId: String,
    val adminId: String?,
    val status: String, // "resolved" or "unresolved"
    val createdAt: String,
    val resolvedAt: String?
)