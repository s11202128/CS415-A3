package com.bof.mobile.viewmodel

import com.bof.mobile.data.repository.AccountRepository
import com.bof.mobile.data.repository.TransferRepository
import com.bof.mobile.model.ApiResult
import com.bof.mobile.util.MainDispatcherRule
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
class TransferViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private suspend fun newViewModel(
        accountResult: ApiResult<List<com.bof.mobile.model.AccountItem>> =
            ApiResult.Success(emptyList())
    ): Pair<TransferViewModel, TransferRepository> {
        val accountRepo = mock<AccountRepository>()
        whenever(accountRepo.getAccounts()).thenReturn(accountResult)
        val transferRepo = mock<TransferRepository>()
        return TransferViewModel(transferRepo, accountRepo, loggedInCustomerId = 1) to transferRepo
    }

    @Test
    fun submit_with_unresolved_source_account_sets_error() = runTest {
        val (vm, _) = newViewModel()
        advanceUntilIdle()
        vm.submitTransfer()
        assertEquals(
            "Source account must be resolved to a valid account ID",
            vm.uiState.value.errorMessage
        )
    }

    @Test
    fun submit_with_zero_amount_sets_error() = runTest {
        val (vm, _) = newViewModel()
        advanceUntilIdle()
        vm.onFromAccountIdChanged("123")
        vm.onAmountChanged("0")
        vm.submitTransfer()
        assertEquals("Amount must be greater than 0", vm.uiState.value.errorMessage)
    }

    @Test
    fun submit_above_daily_limit_sets_error() = runTest {
        val (vm, _) = newViewModel()
        advanceUntilIdle()
        vm.onFromAccountIdChanged("123")
        vm.onAmountChanged("999999")
        vm.submitTransfer()
        assertEquals("Amount exceeds daily transfer limit", vm.uiState.value.errorMessage)
    }

    @Test
    fun internal_transfer_to_same_account_is_rejected() = runTest {
        val (vm, _) = newViewModel()
        advanceUntilIdle()
        vm.onFromAccountIdChanged("123")
        vm.onInternalDestinationAccountIdChanged("123")
        vm.onAmountChanged("50")
        vm.submitTransfer()
        assertEquals(
            "Source and destination accounts must be different",
            vm.uiState.value.errorMessage
        )
    }

    @Test
    fun validateTransferReady_returns_false_for_blank_amount() = runTest {
        val (vm, _) = newViewModel()
        advanceUntilIdle()
        assertFalse(vm.validateTransferReady())
    }

    @Test
    fun account_load_error_propagates_to_state() = runTest {
        val (vm, _) = newViewModel(ApiResult.Error("Network down"))
        advanceUntilIdle()
        assertEquals("Network down", vm.uiState.value.errorMessage)
        assertNotNull(vm.uiState.value)
    }
}
