package com.bof.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bof.mobile.data.repository.CreditCardRepository
import com.bof.mobile.model.ApiResult
import com.bof.mobile.model.CreditCardItem
import com.bof.mobile.model.CreditCardTransactionItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * UI state for the credit card screen.
 */
data class CreditCardUiState(
    val isLoadingCards: Boolean = false,
    val isLoadingTransactions: Boolean = false,
    val isPayingCard: Boolean = false,
    val cards: List<CreditCardItem> = emptyList(),
    val selectedCardNumber: String? = null,
    val transactions: List<CreditCardTransactionItem> = emptyList(),
    val paymentAmount: String = "",
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val lastUpdatedAtEpochMs: Long? = null
)

/**
 * ViewModel for credit card screen.
 * Manages loading cards, selecting a card, viewing transactions, and making payments.
 */
class CreditCardViewModel(private val creditCardRepository: CreditCardRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(CreditCardUiState())
    val uiState: StateFlow<CreditCardUiState> = _uiState

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    /**
     * Loads the current user's credit cards.
     */
    fun loadCards() {
        if (_uiState.value.isLoadingCards) {
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoadingCards = true,
                    errorMessage = if (it.cards.isNotEmpty()) it.errorMessage else null
                )
            }

            when (val result = creditCardRepository.getMyCreditCards()) {
                is ApiResult.Success -> {
                    val cards = result.data.items
                    val selected = _uiState.value.selectedCardNumber ?: cards.firstOrNull()?.cardNumber
                    _uiState.update {
                        it.copy(
                            isLoadingCards = false,
                            cards = cards,
                            selectedCardNumber = selected,
                            errorMessage = null,
                            lastUpdatedAtEpochMs = System.currentTimeMillis()
                        )
                    }
                    selected?.let { cardNumber ->
                        loadTransactions(cardNumber)
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoadingCards = false,
                            errorMessage = sanitizeUiError(result.message)
                        )
                    }
                }
            }
        }
    }

    /**
     * Selects a credit card and loads its transactions.
     */
    fun selectCard(cardNumber: String) {
        _uiState.update { it.copy(selectedCardNumber = cardNumber) }
        loadTransactions(cardNumber)
    }

    /**
     * Loads transaction history for a specific credit card.
     */
    fun loadTransactions(cardNumber: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingTransactions = true, errorMessage = null) }

            when (val result = creditCardRepository.getCreditCardTransactions(cardNumber)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoadingTransactions = false,
                            transactions = result.data.items,
                            errorMessage = null,
                            lastUpdatedAtEpochMs = System.currentTimeMillis()
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoadingTransactions = false,
                            errorMessage = sanitizeUiError(result.message)
                        )
                    }
                }
            }
        }
    }

    /**
     * Updates the payment amount input.
     */
    fun onPaymentAmountChanged(value: String) {
        _uiState.update { it.copy(paymentAmount = value) }
    }

    /**
     * Submits a payment for the selected credit card.
     */
    fun submitPayment() {
        val state = _uiState.value
        val cardNumber = state.selectedCardNumber
        val amountStr = state.paymentAmount.trim()

        if (cardNumber.isNullOrBlank()) {
            _uiState.update { it.copy(errorMessage = "No card selected") }
            return
        }

        if (amountStr.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Please enter a payment amount") }
            return
        }

        val amount = amountStr.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            _uiState.update { it.copy(errorMessage = "Please enter a valid amount greater than 0") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isPayingCard = true, errorMessage = null) }

            when (val result = creditCardRepository.payCreditCard(cardNumber, amount)) {
                is ApiResult.Success -> {
                    // Update the card balance in the local list
                    val updatedCards = _uiState.value.cards.map { card ->
                        if (card.cardNumber == cardNumber) {
                            card.copy(
                                currentBalance = result.data.currentBalance,
                                availableCredit = result.data.availableCredit
                            )
                        } else {
                            card
                        }
                    }

                    _uiState.update {
                        it.copy(
                            isPayingCard = false,
                            cards = updatedCards,
                            paymentAmount = "",
                            successMessage = "Payment of FJD ${"%.2f".format(amount)} submitted successfully",
                            errorMessage = null,
                            lastUpdatedAtEpochMs = System.currentTimeMillis()
                        )
                    }

                    // Reload transactions
                    loadTransactions(cardNumber)
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isPayingCard = false,
                            errorMessage = sanitizeUiError(result.message)
                        )
                    }
                }
            }
        }
    }

    private fun sanitizeUiError(message: String): String {
        val normalized = message.trim()
        if (normalized.isBlank()) return "Request failed. Please try again."

        val technicalPrefixes = listOf("java.", "kotlin.", "retrofit2.", "okhttp3.")
        if (technicalPrefixes.any { normalized.startsWith(it, ignoreCase = true) }) {
            return "Unable to process credit card request right now. Please try again."
        }

        if (normalized.contains("IllegalStateException", ignoreCase = true) ||
            normalized.contains("snapshot", ignoreCase = true)
        ) {
            return "Unable to process credit card request right now. Please try again."
        }

        return normalized
    }
}
