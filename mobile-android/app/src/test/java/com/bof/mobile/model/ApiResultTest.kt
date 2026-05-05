package com.bof.mobile.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Sanity tests for the ApiResult sealed class.
 */
class ApiResultTest {

    @Test
    fun success_holds_data_and_equals_works() {
        val a = ApiResult.Success("hello")
        val b = ApiResult.Success("hello")
        val c = ApiResult.Success("world")
        assertEquals(a, b)
        assertNotEquals(a, c)
        assertEquals("hello", a.data)
    }

    @Test
    fun error_default_code_is_null() {
        val e = ApiResult.Error("boom")
        assertEquals("boom", e.message)
        assertNull(e.code)
    }

    @Test
    fun exhaustive_when_compiles_for_both_branches() {
        val results: List<ApiResult<Int>> = listOf(
            ApiResult.Success(1),
            ApiResult.Error("nope", code = 500)
        )
        val labels = results.map {
            when (it) {
                is ApiResult.Success -> "ok:${it.data}"
                is ApiResult.Error -> "err:${it.code}:${it.message}"
            }
        }
        assertTrue(labels.contains("ok:1"))
        assertTrue(labels.contains("err:500:nope"))
    }
}
