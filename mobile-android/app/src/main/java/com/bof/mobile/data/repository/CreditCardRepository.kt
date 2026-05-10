package com.bof.mobile.data.repository

import com.bof.mobile.data.remote.ApiService
import com.bof.mobile.model.ApiResult
import com.bof.mobile.model.CreditCardPaymentRequest
import com.bof.mobile.model.CreditCardPaymentResponse
import com.bof.mobile.model.CreditCardTransactionsResponse
import com.bof.mobile.model.MyCreditCardsResponse
import retrofit2.HttpException
import java.io.IOException

/**
 * Repository for credit card operations.
 * Handles API calls related to fetching credit cards, transactions, and making payments.
 */
class CreditCardRepository(private val apiService: ApiService) {

    /**
     * Fetches the current user's credit cards.
     */
    suspend fun getMyCreditCards(): ApiResult<MyCreditCardsResponse> {
        return try {
            ApiResult.Success(apiService.getMyCreditCards())
        } catch (e: HttpException) {
            ApiResult.Error(message = parseHttpError(e, "Failed to load credit cards"), code = e.code())
        } catch (e: IOException) {
            ApiResult.Error(message = "Network unavailable. Please try again.")
        } catch (e: Exception) {
            ApiResult.Error(message = e.message ?: "Unexpected error")
        }
    }

    /**
     * Fetches transaction history for a specific credit card.
     * @param cardNumber The credit card number
     * @param limit Maximum number of transactions to fetch (default 50)
     */
    suspend fun getCreditCardTransactions(
        cardNumber: String,
        limit: Int = 50
    ): ApiResult<CreditCardTransactionsResponse> {
        return try {
            ApiResult.Success(
                apiService.getCreditCardTransactions(
                    cardNumber = cardNumber,
                    kind = "charge",  // Show only charges, not payments
                    limit = limit
                )
            )
        } catch (e: HttpException) {
            ApiResult.Error(message = parseHttpError(e, "Failed to load transactions"), code = e.code())
        } catch (e: IOException) {
            ApiResult.Error(message = "Network unavailable. Please try again.")
        } catch (e: Exception) {
            ApiResult.Error(message = e.message ?: "Unexpected error")
        }
    }

    /**
     * Makes a payment on a credit card.
     * @param cardNumber The credit card number
     * @param amount The payment amount
     */
    suspend fun payCreditCard(
        cardNumber: String,
        amount: Double
    ): ApiResult<CreditCardPaymentResponse> {
        return try {
            ApiResult.Success(
                apiService.payCreditCard(
                    cardNumber = cardNumber,
                    request = CreditCardPaymentRequest(amount = amount)
                )
            )
        } catch (e: HttpException) {
            ApiResult.Error(message = parseHttpError(e, "Failed to process payment"), code = e.code())
        } catch (e: IOException) {
            ApiResult.Error(message = "Network unavailable. Please try again.")
        } catch (e: Exception) {
            ApiResult.Error(message = e.message ?: "Unexpected error")
        }
    }
}
