import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    dangerouslyAllowBrowser: true // Client-side usage
});

export const parseExpenseNLP = async (text) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                {
                    role: "system",
                    content: "You are an expense parser. Extract transaction details from the user's text. Return a JSON object with a single key 'expenses' containing an array of objects. Each object should have: amount (number), category (string, e.g., Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other), type (expense or income), description (string). Example: 'Spent 500 on food' -> { expenses: [{ amount: 500, category: 'Food', type: 'expense', description: 'food' }] }. Date should be today unless specified. Do not output markdown code blocks, just the raw JSON string."
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });

        console.log("Raw AI Response:", completion.choices[0].message.content);
        let content = completion.choices[0].message.content;

        // Regex to find the first JSON object or array
        const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

        if (jsonMatch) {
            content = jsonMatch[0];
        } else {
            console.warn("No JSON structure found in response");
            return null;
        }

        try {
            const parsed = JSON.parse(content);
            console.log("Parsed AI Data:", parsed);
            return parsed.expenses || (Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Failed Content:", content);
            return null;
        }
    } catch (error) {
        console.error("NLP Error:", error);
        return null;
    }
};

export const chatWithCFO = async (message, contextData) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                {
                    role: "system",
                    content: `You are an AI CFO (Chief Financial Officer) for a personal expense tracker. 
          You have access to the user's financial data: ${JSON.stringify(contextData)}. 
          Analyze their spending, answer questions, and give advice. Be professional but friendly. 
          Keep answers concise.`
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Chat Error:", error);
        return "I'm having trouble connecting to my financial brain right now. Please try again later.";
    }
};

export const predictCategory = async (text) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                {
                    role: "system",
                    content: `You are an advanced NLP expense classifier. Analyze the user's description and extract the category.
          
          Rules:
          1. **Keyword & Synonym Detection**: Recognize words like 'lunch' (Food), 'cab' (Transport), 'shirt' (Shopping).
          2. **Context Understanding**: Infer meaning even without keywords (e.g., 'monthly pass' -> Transport, 'dining out' -> Food).
          3. **Spelling Correction**: Handle typos (e.g., 'burgr' -> Food, 'shping' -> Shopping).
          4. **Priority**: If multiple clues exist, choose the main intent (e.g., 'medicine while traveling' -> Health).
          
          Categories:
          - Food
          - Transport
          - Shopping
          - Bills
          - Entertainment
          - Health
          - Education
          - Salary
          - Investment
          - Other
          
          Return ONLY the category name as a string. Do not add punctuation.`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Category Prediction Error:", error);
        return null;
    }
};

export const predictSubscriptionCategory = async (serviceName) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                {
                    role: "system",
                    content: `You are an AI subscription category classifier. Analyze the service name and predict the correct category.
          
          Rules:
          1. **Entertainment**: Netflix, Prime Video, Disney+, Spotify, YouTube Premium, Apple Music, JioHotstar, JioSaavn, Hotstar, SonyLIV, Zee5, Hulu, HBO, Gaming, Steam, PlayStation, Xbox → Entertainment
          2. **Bills**: Electricity, Water, Gas, Internet, WiFi, Mobile, Phone, Recharge, Broadband, DTH, Rent, Maintenance, Company Services, SaaS, Software, Cloud, Adobe, Microsoft, Google One, iCloud → Bills
          3. **Health**: Hospital, Insurance, Health Insurance, Medical, Medicine, Pharmacy, Gym, Fitness, Workout, Yoga, Doctor, Clinic → Health
          4. **Default**: Anything else → Other
          
          Categories (ONLY these):
          - Entertainment
          - Bills
          - Health
          - Other
          
          Return ONLY the category name. No explanation, no punctuation.`
                },
                {
                    role: "user",
                    content: serviceName
                }
            ]
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Subscription Category Prediction Error:", error);
        return null;
    }
};
