package com.example.app.model

data class Rating(
    val id: String,
    val issueId: String,
    val customerId: String,
    val rating: Int, // 1-5
    val comment: String?,
    val createdAt: String
)