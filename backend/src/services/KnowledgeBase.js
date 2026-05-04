/**
 * KnowledgeBase - keyword-driven Q&A entries used by the chatbot.
 *
 * Each entry is matched by checking whether ANY of its keywords appears
 * inside the lowercased customer query. The first matching entry wins.
 * If nothing matches, ChatbotService falls back to "other" / unresolved.
 */

const KNOWLEDGE_BASE = [
  // ─── ACCOUNT ────────────────────────────────────────────────────────
  {
    keywords: ["balance", "check balance", "how much money", "account summary", "current balance"],
    category: "account",
    answer:
      "You can check your account balance by logging in to internet banking and opening the Accounts tab. The Overview screen shows your total balance across all linked accounts.",
  },
  {
    keywords: ["deposit", "add money", "put money in", "top up"],
    category: "account",
    answer:
      "You can deposit money at any Bank of Fiji branch, through ATM cash deposit, or by receiving an internal/external transfer. Online deposits between your own accounts are instant.",
  },
  {
    keywords: ["withdraw", "take out money", "withdrawal", "cash out"],
    category: "account",
    answer:
      "You can withdraw cash from any Bank of Fiji ATM or branch counter. Savings Account holders get one free withdrawal per month; additional withdrawals incur a $5.00 fee.",
  },
  {
    keywords: ["open account", "new account", "create account", "sign up account"],
    category: "account",
    answer:
      "We offer three account types: Access (everyday transactions), Savings (interest earning), and Business. Visit a branch with photo ID and proof of address, or apply online via Internet Banking.",
  },
  {
    keywords: ["close account", "cancel account", "shut account"],
    category: "account",
    answer:
      "To close an account, please visit your nearest branch with photo ID. Any remaining balance will be paid out via cheque or transferred to a nominated account.",
  },
  {
    keywords: ["business eligibility", "open business account", "business account rules"],
    category: "account",
    answer:
      "Business accounts are available to registered businesses in Fiji. You will need your business registration certificate, TIN, and director ID. The monthly fee is $20 if your net input is under $2,000.",
  },

  // ─── FEES ───────────────────────────────────────────────────────────
  {
    keywords: ["access account fee", "access fee", "$0.90", "0.90", "0.9"],
    category: "fees",
    answer: "The Access Account has a flat monthly fee of $0.90.",
  },
  {
    keywords: ["savings fee", "savings account fee", "withdrawal charge", "withdrawal fee", "$5"],
    category: "fees",
    answer:
      "The Savings Account is free for the first withdrawal each month. Each additional withdrawal in the same month is charged $5.00.",
  },
  {
    keywords: ["business fee", "business monthly", "$20", "maintenance fee", "net input"],
    category: "fees",
    answer:
      "Business Accounts are charged a $20 monthly maintenance fee if the net input for the month is less than $2,000. Otherwise the monthly fee is waived.",
  },
  {
    keywords: ["fee", "fees", "monthly fee", "charge", "cost", "deduction"],
    category: "fees",
    answer:
      "Monthly fees: Access Account $0.90 flat, Savings Account $5.00 per withdrawal after the first free one, Business Account $20.00 if net input is under $2,000.",
  },

  // ─── CARD ───────────────────────────────────────────────────────────
  {
    keywords: ["credit card", "card limit", "available credit", "credit limit"],
    category: "card",
    answer:
      "You can view your credit card limit and available credit under the Business / Credit Card panel after logging in. To request a limit increase, contact us at 132 888.",
  },
  {
    keywords: ["lost card", "stolen card", "block card", "cancel card", "report card"],
    category: "card",
    answer:
      "If your card is lost or stolen, block it immediately by calling our 24/7 hotline 132 888 or by using the 'Block Card' option in Internet Banking. A replacement card will be issued within 5 working days.",
  },
  {
    keywords: ["card payment", "pay with card", "card bill", "credit card payment"],
    category: "card",
    answer:
      "You can pay your credit card bill by transferring from any linked Bank of Fiji account, via the Bill Payments tab, or at any branch.",
  },
  {
    keywords: ["link card", "add card"],
    category: "card",
    answer:
      "To link a credit card to internet banking, log in and open the Credit Card panel under the Business tab, then choose 'Link existing card'.",
  },

  // ─── LOAN ───────────────────────────────────────────────────────────
  {
    keywords: ["loan", "borrow money", "personal loan", "loan application"],
    category: "loan",
    answer:
      "Bank of Fiji offers personal, vehicle, and home loans. You can apply through the Loans tab in Internet Banking or visit any branch. Approval typically takes 3-5 business days.",
  },
  {
    keywords: ["mortgage", "home loan", "house loan"],
    category: "loan",
    answer:
      "Our home loan products offer competitive rates from 4.99% p.a. with terms up to 25 years. Speak to a mortgage specialist by booking an appointment via the Loans tab.",
  },
  {
    keywords: ["interest rate", "loan rate", "repayment"],
    category: "loan",
    answer:
      "Interest rates vary by product: Personal loans from 8.99% p.a., Home loans from 4.99% p.a., Vehicle loans from 6.50% p.a. Check the Loans tab for an indicative repayment calculator.",
  },
  {
    keywords: ["term deposit", "fixed deposit", "investment account"],
    category: "loan",
    answer:
      "Term Deposits are available from 3 to 60 months with rates up to 4.25% p.a. Minimum deposit is $1,000. Apply at any branch or via Internet Banking.",
  },

  // ─── TRANSFER ───────────────────────────────────────────────────────
  {
    keywords: ["transfer", "send money", "move money"],
    category: "transfer",
    answer:
      "You can transfer money between your own accounts, to another Bank of Fiji customer, or to other banks via the Transfers tab. Transfers between BoF accounts are instant.",
  },
  {
    keywords: ["international", "overseas", "wire transfer", "swift", "remittance", "foreign exchange", "forex"],
    category: "transfer",
    answer:
      "International transfers can be sent via SWIFT from any branch or through Internet Banking. You will need the recipient's name, bank, SWIFT/BIC code and account number. Standard fee is FJD 30 plus correspondent bank charges.",
  },

  // ─── GENERAL ────────────────────────────────────────────────────────
  {
    keywords: ["branch", "location", "address", "where are you", "nearest branch"],
    category: "general",
    answer:
      "Bank of Fiji has branches in Suva, Lautoka, Nadi, Labasa, Ba, Sigatoka and Savusavu. Visit our website's Branch Locator or call 132 888 for the nearest branch to you.",
  },
  {
    keywords: ["hours", "opening hours", "open", "close", "business hours"],
    category: "general",
    answer:
      "Standard branch hours are Mon-Thu 9:00am-4:00pm, Fri 9:00am-5:00pm. Selected branches are open Saturday mornings. Internet Banking and the chatbot are available 24/7.",
  },
  {
    keywords: ["contact", "phone number", "email", "call us", "support number"],
    category: "general",
    answer:
      "Contact us 24/7 on 132 888, or email support@bankoffiji.com.fj. For urgent card issues, use the lost/stolen card hotline.",
  },
  {
    keywords: ["password", "reset password", "forgot password", "login help", "cannot login"],
    category: "general",
    answer:
      "Click 'Forgot Password' on the login screen and follow the email/SMS verification steps. If you no longer have access to your registered email or phone, please visit a branch with photo ID.",
  },
  {
    keywords: ["update details", "change address", "change phone", "personal info", "update profile"],
    category: "general",
    answer:
      "You can update your contact details under the Profile tab in Internet Banking. To change your name or registered ID, please visit a branch with supporting documents.",
  },
  {
    keywords: ["internet banking", "online banking", "register", "sign up", "enroll"],
    category: "general",
    answer:
      "To register for Internet Banking, click 'Register' on the login page and enter your account number plus a one-time PIN sent to your registered mobile. New customers can register at any branch.",
  },
  {
    keywords: ["dispute", "wrong transaction", "incorrect charge", "chargeback"],
    category: "general",
    answer:
      "To dispute a transaction, open the Statements tab, locate the transaction and click 'Dispute'. Our team will respond within 5 business days. For card disputes, please call 132 888.",
  },
  {
    keywords: ["accessibility", "support service", "disability", "assistance"],
    category: "general",
    answer:
      "Bank of Fiji provides accessible banking services including wheelchair-friendly branches, assisted banking, large-print statements and a TTY line. Ask any branch for our Accessibility Guide.",
  },

  // ─── FRAUD ──────────────────────────────────────────────────────────
  {
    keywords: ["fraud", "scam", "suspicious", "unauthorized", "hack", "hacked"],
    category: "fraud",
    answer:
      "If you suspect fraud, immediately call 132 888 (24/7), block your card, and change your Internet Banking password. We will investigate and refund any confirmed unauthorised transactions.",
  },
  {
    keywords: ["report fraud", "stolen identity", "phishing", "phish"],
    category: "fraud",
    answer:
      "Report suspected fraud or phishing to fraud@bankoffiji.com.fj or call 132 888. Forward suspicious emails as attachments and do NOT click any links inside them.",
  },
];

/**
 * Levenshtein distance between two short strings (iterative DP).
 * Used for typo-tolerant single-word matching ("balence" -> "balance").
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

/**
 * Returns true if there is a query token within edit distance 1 of `word`,
 * provided the word is long enough that a single typo isn't ambiguous.
 */
function fuzzyHas(tokens, word) {
  if (tokens.has(word)) return true;
  if (word.length < 5) return false; // avoid false positives on tiny words
  for (const t of tokens) {
    if (Math.abs(t.length - word.length) > 1) continue;
    if (levenshtein(t, word) <= 1) return true;
  }
  return false;
}

/**
 * Find the best knowledge base entry for the query.
 *
 * Matching rules (in order):
 *   1. Tokenise the query into lowercase word characters.
 *   2. For each keyword, the keyword is "matched" if EVERY word inside it
 *      appears in the query token set (with single-typo tolerance for
 *      words >= 5 chars), so "lost card" matches "I lost my card" and
 *      "balence" still matches "balance".
 *   3. The match score is the number of words in the longest matched keyword.
 *      The entry with the highest score wins; ties resolve to the first entry,
 *      which lets us order more-specific entries (e.g. "business fee") above
 *      more-general ones (e.g. "business account") in the array.
 *
 * @param {string} query - Raw customer query.
 * @returns {{answer: string, category: string} | null}
 */
function findMatch(query) {
  const text = String(query || "").toLowerCase();
  if (!text.trim()) return null;
  const tokens = new Set(text.match(/[a-z0-9$.]+/g) || []);
  if (tokens.size === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    for (const kw of entry.keywords) {
      const kwLower = String(kw).toLowerCase();
      const kwWords = kwLower.match(/[a-z0-9$.]+/g) || [];
      if (kwWords.length === 0) continue;

      const allTokens = kwWords.every((w) => fuzzyHas(tokens, w));
      const substring = text.includes(kwLower);
      if (!allTokens && !substring) continue;

      const score = kwWords.length;
      if (score > bestScore) {
        best = { answer: entry.answer, category: entry.category };
        bestScore = score;
      }
    }
  }
  return best;
}

module.exports = {
  KNOWLEDGE_BASE,
  findMatch,
};
