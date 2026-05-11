package com.bof.mobile.ui.auth

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.bof.mobile.data.remote.ApiService
import com.bof.mobile.data.repository.AuthRepository
import com.bof.mobile.viewmodel.AuthViewModel
import java.lang.reflect.Proxy
import org.junit.Rule
import org.junit.Test

/**
 * Compose instrumentation test for the Login screen.
 *
 * Uses a reflection-based no-op ApiService so AuthRepository can be constructed
 * without hitting the network. The screen never reaches the repository in
 * these scenarios — we only assert the validation paths and field bindings.
 */
class LoginScreenTest {

    // --- Setup ---
    @get:Rule
    val composeRule = createComposeRule()

    private fun fakeApiService(): ApiService {
        val classLoader = ApiService::class.java.classLoader
        val handler = java.lang.reflect.InvocationHandler { _, method, _ ->
            throw UnsupportedOperationException("ApiService.${method.name} not stubbed in UI test")
        }
        return Proxy.newProxyInstance(
            classLoader, arrayOf(ApiService::class.java), handler
        ) as ApiService
    }

    private fun newViewModel(): AuthViewModel =
        AuthViewModel(AuthRepository(fakeApiService()))

    @Test
    fun login_screen_renders_core_fields_and_button() {
        composeRule.setContent { LoginScreen(viewModel = newViewModel()) }

        composeRule.onNodeWithText("Email or Mobile").assertIsDisplayed()
        composeRule.onNodeWithText("Password").assertIsDisplayed()
        composeRule.onNodeWithText("Login to your account").assertIsDisplayed()
    }

    @Test
    fun submitting_empty_form_shows_validation_error() {
        composeRule.setContent { LoginScreen(viewModel = newViewModel()) }

        // Find and click the Login button. The screen has a "Login" button label.
        composeRule.onNodeWithText("Login").performClick()

        composeRule
            .onNodeWithText("Email or mobile and password are required")
            .assertIsDisplayed()
    }

    @Test
    fun typing_invalid_email_then_submitting_shows_format_error() {
        val vm = newViewModel()
        composeRule.setContent { LoginScreen(viewModel = vm) }

        composeRule.onNodeWithText("Email or Mobile").performTextInput("not-an-email")
        composeRule.onNodeWithText("Password").performTextInput("password123")
        composeRule.onNodeWithText("Login").performClick()

        composeRule
            .onNodeWithText("Enter a valid email address or mobile number")
            .assertIsDisplayed()
    }
}
