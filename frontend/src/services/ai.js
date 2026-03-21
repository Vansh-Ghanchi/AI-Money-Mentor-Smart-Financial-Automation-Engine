import OpenAI from 'openai';

/**
 * AI Service using OpenRouter API
 * This service handles all AI-related functionalities including:
 * 1. Transaction Parsing (NLP)
 * 2. Chat with AI Financial Assistant
 * 3. Category Prediction
 * 4. Subscription Categorization
 */

// Initialize OpenRouter Client
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": window.location.origin, // Required by OpenRouter for ranking
        "X-Title": "ExpenseAI", // Required by OpenRouter for ranking
    },
    dangerouslyAllowBrowser: true
});

// Primary free model to use via OpenRouter
const MODEL_NAME = "google/gemini-2.0-flash-exp:free";

/**
 * Parses natural language input into structured expense data
 */
export const parseExpenseNLP = async (text) => {
    try {
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                {
                    role: "system",
                    content: "You are an expense parser. Extract transaction details from the user's text. Return a JSON object with a single key 'expenses' containing an array of objects. Each object should have: amount (number), category (string, e.g., Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others), type (expense or income), description (string). Example: 'Spent 500 on food' -> { expenses: [{ amount: 500, category: 'Food', type: 'expense', description: 'food' }] }. Date should be today unless specified. Do not output markdown code blocks, just the raw JSON string."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        let content = completion.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            return parsed.expenses || (Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
            console.error("JSON Parse Error in parseExpenseNLP:", e);
            return null;
        }
    } catch (error) {
        console.error("NLP Parsing Error:", error);
        return null;
    }
};

/**
 * Strictly account-focused AI Chatbot
 */
export const chatWithCFO = async (message, contextData) => {
    try {
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                {
                    role: "system",
                    content: `You are an AI Financial Assistant for a personal expense tracking application. Follow these STRICT rules:

SECURITY RULES:
1. You can ONLY access and discuss the current logged-in user's financial data provided below.
2. NEVER make up, assume, or reference data from other users.
3. All answers must be based EXCLUSIVELY on the provided context data.

RESPONSE RULES:
1. ONLY answer questions related to: account balance, spending, transactions, budget, subscriptions, and financial advice.
2. If the user asks ANYTHING unrelated to their finances (e.g., weather, jokes, general knowledge, sports, news), respond EXACTLY with:
   "I can only help with questions related to your account and finances. Please ask about your balance, spending, budget, or transactions."
3. Use specific numbers from the context. Be concise and direct. Format currency as "₹" + amount.

USER'S FINANCIAL DATA (CONFIDENTIAL):
- Total Balance: ₹${contextData.totalBalance}
- Monthly Budget: ₹${contextData.monthlyBudget}
- This Month's Spending: ₹${contextData.monthlySpend}
- Budget Remaining: ₹${contextData.monthlyBudget - contextData.monthlySpend}
- Wallets: ${JSON.stringify(contextData.wallets)}
- Recent Transactions: ${JSON.stringify(contextData.transactions.slice(0, 10))}
- Subscriptions: ${JSON.stringify(contextData.subscriptions)}`
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Chatbot Error:", error);
        return "I'm having trouble connecting to my financial brain right now. Please ensure your OpenRouter API key is correctly configured.";
    }
};

// Comprehensive Local Keyword Mapping for high-accuracy pre-classification
const KEYWORD_MAP = {
    'Food': [
        'burger', 'pizza', 'sandwich', 'hot dog', 'french fries', 'nuggets', 'wrap', 'roll', 'frankie',
        'dal', 'dal fry', 'dal makhani', 'rice', 'jeera rice', 'fried rice', 'roti', 'chapati', 'naan', 'butter naan',
        'paneer', 'shahi paneer', 'kadhai paneer', 'chole', 'rajma', 'sambhar', 'idli', 'dosa', 'vada',
        'biryani', 'veg biryani', 'chicken biryani', 'pulao', 'khichdi', 'chicken curry', 'butter chicken',
        'fish curry', 'fish fry', 'mutton curry', 'rogan josh', 'tikka', 'kebab', 'egg curry', 'omelette',
        'noodles', 'hakka noodles', 'chowmein', 'manchurian', 'spring roll', 'momos', 'ramen',
        'samosa', 'kachori', 'pakora', 'bhaji', 'pav bhaji', 'vada pav', 'misal pav', 'poha', 'upma',
        'bhel puri', 'pani puri', 'sev puri', 'corn', 'popcorn', 'cake', 'pastry', 'ice cream',
        'gulab jamun', 'rasgulla', 'jalebi', 'kheer', 'halwa', 'ladoo', 'brownie', 'donut',
        'tea', 'coffee', 'chai', 'milkshake', 'juice', 'soft drink', 'soda', 'lassi', 'starbucks', 'zomato', 'swiggy', 'maggi',
        // Common eating/food related words
        'eat', 'ate', 'eating', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'snack', 'drink', 'restaurant'
    ],
    'Transport': [
        'uber', 'ola', 'rapido', 'taxi', 'cab', 'auto', 'rickshaw',
        'car', 'bike', 'scooter', 'cycle', 'motorcycle', 'truck', 'van',
        'fuel', 'petrol', 'diesel', 'cng', 'ev', 'charging',
        'service', 'repair', 'maintenance', 'oil change',
        'tyre', 'puncture', 'air filling', 'battery',
        'bus', 'metro', 'train', 'local', 'subway', 'tram',
        'railway', 'platform', 'ticket', 'pass',
        'flight', 'airline', 'airport', 'indigo', 'air india', 'vistara',
        'boarding', 'baggage', 'luggage',
        'parking', 'toll', 'fastag', 'challan', 'fine',
        'car rental', 'bike rental', 'zoomcar', 'revv',
        'ride', 'travel', 'commute', 'journey', 'trip', 'route',
        'pickup', 'drop', 'destination',
        'delivery', 'courier', 'shipment', 'logistics',
        'boat', 'ferry', 'ship',
        'helmet', 'license', 'rc', 'insurance'
    ],
    'Shopping': [
        'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal',
        'shopping', 'mall', 'store', 'shop',
        'clothes', 'dress', 'jeans', 'shirt', 'tshirt', 'jacket',
        'shoes', 'footwear', 'sandals', 'slippers',
        'electronics', 'gadget', 'appliance',
        'laptop', 'mobile', 'phone', 'tablet', 'charger', 'earphones',
        'watch', 'smartwatch',
        'bag', 'wallet', 'belt',
        'cosmetics', 'makeup', 'skincare',
        'zudio', 'pantaloons', 'trends', 'reliance digital'
    ],
    'Bills': [
        'rent', 'house rent',
        'electricity', 'power', 'light bill',
        'water', 'water bill',
        'gas', 'lpg',
        'internet', 'wifi', 'broadband',
        'recharge', 'topup', 'mobile recharge', 'data pack',
        'bill', 'utility bill',
        'dth', 'cable',
        'phone bill', 'postpaid', 'prepaid',
        'maintenance', 'society maintenance',
        'sewer', 'garbage', 'municipal tax'
    ],
    'Entertainment': [
        'movie', 'cinema', 'theatre', 'film',
        'netflix', 'prime video', 'hotstar', 'zee5', 'sonyliv',
        'spotify', 'apple music', 'gaana', 'wynk',
        'youtube',
        'game', 'gaming', 'videogame', 'playstation', 'xbox',
        'concert', 'show', 'event',
        'ott', 'streaming',
        'ticket', 'match'
    ],
    'Health': [
        'doctor', 'hospital', 'clinic',
        'medicine', 'medicines', 'tablet', 'capsule', 'syrup',
        'pharmacy', 'chemist',
        'dental', 'dentist',
        'gym', 'fitness', 'workout', 'exercise',
        'health', 'healthcare',
        'checkup', 'test', 'scan', 'xray', 'blood test',
        'therapy', 'physiotherapy',
        'insurance', 'medical insurance'
    ],
    'Education': [
        'book', 'books', 'notebook', 'copy', 'register',
        'pen', 'pencil', 'eraser', 'sharpener', 'marker', 'highlighter',
        'stationery', 'school supplies',
        'course', 'class', 'training', 'workshop',
        'fees', 'fee',
        'school', 'college', 'university',
        'tuition', 'coaching',
        'exam', 'test', 'entrance', 'mock test',
        'study', 'education', 'learning',
        'online course', 'certificate',
        'udemy', 'coursera', 'byjus', 'unacademy',
        'lecture', 'assignment', 'homework', 'project',
        'library', 'lab', 'practical'
    ],
    'Salary': [
        'salary', 'income', 'pay',
        'paycheck', 'payslip',
        'bonus', 'incentive',
        'commission', 'allowance',
        'wages', 'stipend',
        'overtime', 'arrears',
        'ctc', 'gross salary', 'net salary',
        'monthly pay', 'annual pay'
    ],
    'Investment': [
        'investment', 'invest',
        'stock', 'stocks', 'share', 'shares', 'equity',
        'mutual fund', 'mutual funds', 'mf',
        'sip', 'lumpsum', 'nav',
        'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'altcoin',
        'trading', 'trade', 'intraday', 'futures', 'options',
        'portfolio', 'asset', 'allocation',
        'dividend', 'yield',
        'bond', 'bonds', 'debenture',
        'gold', 'silver', 'commodity',
        'nifty', 'sensex', 'banknifty',
        'etf', 'index fund',
        'ipo', 'allotment',
        'broker', 'brokerage',
        'zerodha', 'upstox', 'groww',
        'demat', 'trading account',
        'returns', 'profit', 'loss',
        'wealth', 'capital'
    ]
};

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
};

/**
 * Predicts the most likely category for a transaction description
 */
export const predictCategory = async (text) => {
    if (!text) return "Others";
    const lowerText = text.toLowerCase().trim();

    const matchedCategories = new Set();
    const words = lowerText.split(/\s+/);

    // 1. Keyword Match with word boundaries for better accuracy
    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(keyword => {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
            return regex.test(lowerText);
        })) {
            matchedCategories.add(category);
        }
    }

    if (matchedCategories.size > 0) {
        return Array.from(matchedCategories).join(' & ');
    }

    // 2. Fuzzy Match for Food (handles typos like "cak" -> "cake", "piza" -> "pizza")
    for (const word of words) {
        if (word.length >= 3) { // Only check words with 3+ characters
            for (const foodKeyword of KEYWORD_MAP['Food']) {
                const distance = levenshteinDistance(word, foodKeyword);
                if (distance <= 1 && distance > 0) { // Stricter distance for reliability
                    matchedCategories.add('Food');
                }
            }
        }
    }

    if (matchedCategories.size > 0) {
        return Array.from(matchedCategories).join(' & ');
    }

    // 3. AI Prediction Fallback (Specifically tuned for FOOD and TYPOS)
    try {
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                {
                    role: "system",
                    content: `You are an expert at categorizing expenses. Your task is to identify ALL relevant categories for a given description.

CRITICAL RULES:
1. Identify all categories that apply (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Salary, Investment).
2. If multiple categories apply, return them joined by ' & ' (e.g., 'Bills & Food').
3. Detect items even with common typos (e.g., 'cak' for cake, 'piza' for pizza).
4. Be balanced; do not favor one category over others unless the context clearly points to it.

EXAMPLES:
"car" -> Transport
"I ate a pizza and paid electricity bill" -> Bills & Food
"uber to hospital" -> Transport & Health
"netflix subscription" -> Entertainment
"grocery shopping" -> Food & Shopping
"cak" -> Food

Return ONLY the category name(s) (e.g., 'Food' or 'Bills & Food'). If nothing matches, return 'Others'.`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });

        const result = completion.choices[0].message.content.trim();
        const validCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Others'];

        // Match logic
        const matched = validCategories.find(c => result.toLowerCase().includes(c.toLowerCase()));

        return matched || "Others";
    } catch (error) {
        console.error("Category Prediction Error:", error);
        return "Others";
    }
};


