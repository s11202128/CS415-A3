package com.bof.mobile.viewmodel

import com.bof.mobile.data.repository.AuthRepository
import com.bof.mobile.model.ApiResult
import com.bof.mobile.model.LoginResponse
import com.bof.mobile.util.MainDispatcherRule
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private fun newViewModel(repo: AuthRepository = mock()): AuthViewModel =
        AuthViewModel(repo)

    @Test
    fun login_with_blank_inputs_sets_validation_error() = runTest {
        val vm = newViewModel()
        vm.login()
        assertEquals(
            "Email or mobile and password are required",
            vm.uiState.value.errorMessage
        )
        assertFalse(vm.uiState.value.isLoggedIn)
    }

    @Test
    fun login_with_invalid_identifier_format_is_rejected() = runTest {
        val vm = newViewModel()
        vm.onEmailChanged("not-an-email")
        vm.onPasswordChanged("password123")
        vm.login()
        assertEquals(
            "Enter a valid email address or mobile number",
            vm.uiState.value.errorMessage
        )
    }

    @Test
    fun successful_login_populates_state_and_falls_back_customer_id_to_user_id() = runTest {
        val repo = mock<AuthRepository>()
        whenever(repo.login(any(), any())).thenReturn(
            ApiResult.Success(
                LoginResponse(
                    token = "TKN",
                    fullName = "Jane Doe",
                    userId = 42,
                    customerId = null,           // intentionally null to exercise fallback
                    email = "jane@example.com",
                    mobile = "+6791234567",
                    nationalId = null,
                    isAdmin = false
                )
            )
        )
        val vm = newViewModel(repo)
        vm.onEmailChanged("jane@example.com")
        vm.onPasswordChanged("hunter2")
        vm.login()
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state.isLoggedIn)
        assertFalse(state.isLoading)
        assertEquals("TKN", state.token)
        assertEquals(42, state.userId)
        assertEquals(42, state.customerId)              // fell back from userId
        assertEquals("Jane Doe", state.fullName)
        assertNull(state.errorMessage)
    }

    @Test
    fun repository_error_is_surfaced_as_error_message() = runTest {
        val repo = mock<AuthRepository>()
        whenever(repo.login(any(), any())).thenReturn(
            ApiResult.Error("Invalid credentials", code = 401)
        )
        val vm = newViewModel(repo)
        vm.onEmailChanged("jane@example.com")
        vm.onPasswordChanged("wrong")
        vm.login()
        advanceUntilIdle()

        val state = vm.uiState.value
        assertFalse(state.isLoggedIn)
        assertFalse(state.isLoading)
        assertEquals("Invalid credentials", state.errorMessage)
    }

    @Test
    fun logout_resets_user_state() = runTest {
        val repo = mock<AuthRepository>()
        whenever(repo.login(any(), any())).thenReturn(
            ApiResult.Success(
                LoginResponse(
                    token = "TKN", fullName = "X", userId = 1, customerId = 1,
                    email = "x@y.com", mobile = null, nationalId = null, isAdmin = false
                )
            )
        )
        val vm = newViewModel(repo)
        vm.onEmailChanged("x@y.com"); vm.onPasswordChanged("p")
        vm.login(); advanceUntilIdle()
        assertTrue(vm.uiState.value.isLoggedIn)

        vm.logout()
        val state = vm.uiState.value
        assertFalse(state.isLoggedIn)
        assertNull(state.token)
        assertNull(state.userId)
        assertNull(state.customerId)
    }
}
