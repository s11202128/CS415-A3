package com.bof.mobile.ui.creditcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import com.bof.mobile.model.CreditCardItem
import com.bof.mobile.ui.components.ScreenHeader
import com.bof.mobile.viewmodel.CreditCardViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Credit Card Screen.
 * Displays credit cards, card details (3D visual), KPI tiles, transaction history, and payment form.
 *
 * @param viewModel The CreditCardViewModel for state management
 * @param canGoBack Whether the back button is enabled
 * @param onBack Callback for back navigation
 */
@Composable
fun CreditCardScreen(
    viewModel: CreditCardViewModel,
    canGoBack: Boolean,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var hideDetails by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadCards()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.Top
        ) {
            ScreenHeader(
                title = "Credit Cards",
                subtitle = "Bank of Fiji Visa",
                onBack = onBack,
                enabled = canGoBack
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.isLoadingCards && uiState.cards.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                return@Column
            }

            if (!uiState.errorMessage.isNullOrBlank()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        text = uiState.errorMessage ?: "An error occurred",
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(12.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            if (!uiState.successMessage.isNullOrBlank()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
                ) {
                    Text(
                        text = uiState.successMessage ?: "Success",
                        color = Color(0xFF2E7D32),
                        modifier = Modifier.padding(12.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            if (uiState.cards.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No credit cards linked to your account",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                return@Column
            }

            val primaryCard = uiState.cards.firstOrNull()
            if (primaryCard != null) {
                // Hide/Show toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = { hideDetails = !hideDetails },
                        modifier = Modifier.height(36.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Text(
                            text = if (hideDetails) "👁️ Show details" else "👁️‍🗨️ Hide details",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }

                // 3D Credit Card Visual
                CreditCardVisual(card = primaryCard, hideDetails = hideDetails)

                Spacer(modifier = Modifier.height(16.dp))

                // KPI Tiles
                KpiTilesSection(card = primaryCard, hideDetails = hideDetails)

                Spacer(modifier = Modifier.height(16.dp))

                // Frozen Badge
                if (primaryCard.frozen) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = "⚠️ This card is frozen",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(12.dp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Recent Transactions
                if (uiState.isLoadingTransactions) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(modifier = Modifier.height(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Loading transactions...",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                } else if (uiState.transactions.isNotEmpty()) {
                    Text(
                        text = "Recent Purchases",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    uiState.transactions.take(10).forEach { tx ->
                        TransactionRow(transaction = tx)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Payment Section
                Text(
                    text = "Make a Payment",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = uiState.paymentAmount,
                    onValueChange = { viewModel.onPaymentAmountChanged(it) },
                    label = { Text("Payment Amount (FJD)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isPayingCard && !primaryCard.frozen
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { viewModel.submitPayment() },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isPayingCard && !primaryCard.frozen,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    if (uiState.isPayingCard) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .height(20.dp)
                                .width(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Submit Payment")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

/**
 * 3D Credit Card Visual.
 */
@Composable
private fun CreditCardVisual(card: CreditCardItem, hideDetails: Boolean) {
    val maskedNumber = if (hideDetails) {
        "•••• •••• •••• ••••"
    } else {
        val num = card.cardNumber
        "${num.take(4)} ${num.drop(4).take(4)} •••• ${num.takeLast(4)}"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A3A52)  // Navy blue
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF1A3A52),
                            Color(0xFF0F5F8F)
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Bank of Fiji",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp
                        )
                        Text(
                            text = "VISA Platinum",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    // Chip placeholder
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(30.dp)
                            .background(Color(0xFFFFA500))
                    )
                }

                Text(
                    text = maskedNumber,
                    color = Color.White.copy(alpha = 0.9f),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 18.sp,
                    letterSpacing = 2.sp
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Column {
                        Text(
                            text = "Card Holder",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp
                        )
                        Text(
                            text = "CUSTOMER",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Expires",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp
                        )
                        Text(
                            text = "12/29",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "CVV",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp
                        )
                        Text(
                            text = if (hideDetails) "•••" else "•••",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

/**
 * KPI Tiles Section showing Available Credit, Outstanding Balance, Min Payment, and Reward Points.
 */
@Composable
private fun KpiTilesSection(card: CreditCardItem, hideDetails: Boolean) {
    val limit = card.creditLimit
    val outstanding = card.currentBalance
    val available = card.availableCredit
    val minPayment = if (outstanding > 0) maxOf(20.0, outstanding * 0.05) else 0.0
    val dueIn = if (card.statementDue != null) {
        try {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val dueDate = sdf.parse(card.statementDue) ?: Date()
            val days = ((dueDate.time - Date().time) / (1000 * 60 * 60 * 24)).toInt()
            maxOf(0, days)
        } catch (e: Exception) {
            0
        }
    } else {
        0
    }
    val points = 12450

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            KpiTile(
                label = "Available Credit",
                value = if (hideDetails) "•••" else "FJD ${"%.2f".format(available)}",
                subtitle = "Limit FJD ${"%.2f".format(limit)}",
                color = Color(0xFF10B981),  // Emerald
                modifier = Modifier.weight(1f)
            )
            KpiTile(
                label = "Outstanding",
                value = if (hideDetails) "•••" else "FJD ${"%.2f".format(outstanding)}",
                color = Color(0xFFF43F5E),  // Rose
                modifier = Modifier.weight(1f)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            KpiTile(
                label = "Min Payment",
                value = if (hideDetails) "•••" else "FJD ${"%.2f".format(minPayment)}",
                subtitle = "Due in $dueIn days",
                color = Color(0xFFFB923C),  // Amber
                modifier = Modifier.weight(1f)
            )
            KpiTile(
                label = "Reward Points",
                value = if (hideDetails) "•••" else points.toString(),
                subtitle = "1 pt = FJ$0.01",
                color = Color(0xFF06B6D4),  // Cyan
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * Single KPI Tile.
 */
@Composable
private fun KpiTile(
    label: String,
    value: String,
    subtitle: String? = null,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(100.dp),
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.15f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            verticalArrangement = Arrangement.SpaceEvenly
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Transaction Row displaying a single transaction.
 */
@Composable
private fun TransactionRow(transaction: com.bof.mobile.model.CreditCardTransactionItem) {
    val formattedDate = try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val date = sdf.parse(transaction.createdAt) ?: Date()
        SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        transaction.createdAt
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.description,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = formattedDate,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = "FJD ${"%.2f".format(transaction.amount)}",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
