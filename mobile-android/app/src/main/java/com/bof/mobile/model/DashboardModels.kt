package com.bof.mobile.model

data class DashboardResponse(
    val customer: DashboardCustomer,
    val accounts: List<DashboardAccount>,
    val recentTransactions: List<DashboardTransaction>
)

data class DashboardCustomer(
    val id: Int,
    val fullName: String,
    val email: String,
    val mobile: String?,
    val nationalId: String?
)

data class DashboardAccount(
    val id: Int,
    val accountNumber: String,
    val accountHolder: String,
    val accountType: String,
    val balance: Double,
    val status: String
)

data class DashboardTransaction(
    val id: Int,
    val accountNumber: String,
    val type: String,
    val amount: Double,
    val description: String,
    val createdAt: String
)
