package com.bof.mobile.model

/**
 * Represents a single credit card belonging to the current user.
 */
data class CreditCardItem(
    val cardNumber: String,
    val customerId: String,
    val creditLimit: Double,
    val currentBalance: Double,
    val availableCredit: Double,
    val statementDue: String?,
    val frozen: Boolean
)

/**
 * API response containing a list of the current user's credit cards.
 */
data class MyCreditCardsResponse(
    val count: Int,
    val items: List<CreditCardItem>
)

/**
 * Represents a single transaction (charge or payment) on a credit card.
 */
data class CreditCardTransactionItem(
    val id: Int,
    val cardNumber: String,
    val customerId: String,
    val kind: String,  // "charge" or "payment"
    val amount: Double,
    val description: String,
    val balanceAfter: Double,
    val createdAt: String
)

/**
 * API response containing transaction history for a credit card.
 */
data class CreditCardTransactionsResponse(
    val count: Int,
    val items: List<CreditCardTransactionItem>
)

/**
 * Request body for making a payment on a credit card.
 */
data class CreditCardPaymentRequest(
    val amount: Double
)

/**
 * Response after successfully making a payment or charge on a credit card.
 */
data class CreditCardPaymentResponse(
    val cardNumber: String,
    val currentBalance: Double,
    val availableCredit: Double
)
