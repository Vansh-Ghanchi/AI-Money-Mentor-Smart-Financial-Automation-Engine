# 🤖 AI Money Mentor

> **Making expert financial planning as accessible as checking WhatsApp.** <br>
> An intelligent, multi-agent AI mentor that turns confused savers into confident investors. Built for the 95% of Indians without a financial plan.

[![Hackathon Submission](https://img.shields.io/badge/Hackathon-Submission-blueviolet.svg)](#)
![React](https://img.shields.io/badge/Frontend-React-blue.svg)
![Node](https://img.shields.io/badge/Backend-Node.js-green.svg)
![AI Agents](https://img.shields.io/badge/AI-Multi--Agent_System-orange.svg)

## 📌 The Problem
**95% of Indians don't have a financial plan.** Professional financial advisors charge upwards of ₹25,000+ per year, gatekeeping expert advice and catering only to High Net-worth Individuals (HNIs). For the average earner, accessing personalized, reliable financial advice—whether it's for tax planning (CA) or mutual funds—is too expensive and overwhelming.

## 💡 Our Solution
**AI Money Mentor** breaks down the wealth-management barrier. We have built an **AI-powered ecosystem** that lives right alongside your daily finances. 

## 🤖 Multi-Agent Architecture (Scalable System)

### Active Agents (V1 Implementation)
*   **🏦 Core Finance Agent:** Evaluates income metrics against SIP goals to construct personalized, dynamic wealth-building roadmaps.
*   **⚖️ Tax Advisory Agent:** Optimizes Indian tax obligations by modeling old vs. new tax regimes and structuring Section 80C/80D deductions.

### Planned Ecosystem Expansion (In Progress)
*   **🏥 Insurance & Coverage Agent (Planned):** Identifies critical protection gaps based on dependents, age, and existing life/health policies.
*   **📉 Debt & Liability Manager (Planned):** Structures optimized repayment waterfalls for high-interest vehicles like personal loans and credit cards.
*   **📈 Portfolio Analysis Agent (Planned):** Processes CAMS/KFintech statements for deep mutual fund XIRR and asset overlap diagnostics.
*   **🎯 Life Event Architect (Planned):** Re-calibrates the entire financial plan triggered by milestones such as marriage, childbirth, or inheritance.

### Architecture Insight
> Engineered dynamically on a modular intent-routing backend, allowing the system to scale and securely onboard new domain-specific LLM agents without architectural rewrites.

## ✨ Key Technical Highlights
- **Multi-Agent Framework**: Intelligent intent classification that routes the user's prompt to the appropriate domain-expert LLM agent.
- **Context-Aware Memory**: Our agents remember your financial health score, risk profile, and existing portfolios to give personalized advice, not generic Google search answers.
- **Seamless Integrations**: Built on top of a robust MERN stack backend allowing secure data handling and user authentication.

## 🚀 Hackathon Features (Implemented & Planned)
- [x] **Specialized AI Agents Ecosystem** (Finance Agent, CA / Tax Expert)
- [x] **Expense Tracking Foundation** (The "ET" Core)
- [ ] **Money Health Score**: A rapid 5-minute onboarding flow giving a comprehensive financial wellness score.
- [ ] **Tax Wizard & FIRE Planner**: Future modules to automate Form 16 parsing and build month-by-month retirement roadmaps.
- [ ] **Mutual Fund (MF) Portfolio X-Ray**: Extensible architecture ready to process CAMS/KFintech statements for deep portfolio insights.

## 🛠 Tech Stack
| Tier | Technology |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **AI Intelligence**| LLM Integration, Multi-Agent Architecture |
| **Authentication**| JWT (JSON Web Tokens) |

## 🏁 Quick Start for Judges

### 1. Clone the repository
```bash
git clone https://github.com/your-username/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Environment Variables (`backend/.env`)
```env
PORT=5001
MONGODB_URI=your_mongodb_cluster_url
JWT_SECRET=your_secret_key
# ADD YOUR AI API KEY HERE (e.g., OPENAI_API_KEY)
```

### 3. Run the Application
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
npm install
npm run dev
```

## 📂 Project Structure Snapshot
```text
📦 ai-money-mentor
 ┣ 📂 agents         # 🧠 Multi-Agent Logic (CA Agent, Finance Agent, Router)
 ┣ 📂 backend        # Node.js + Express API & DB Models
 ┣ 📂 src            # React UI, Chat Interface, Dashboards
 ┗ 📜 README.md
```

## 🏆 Why this wins
This isn't just a wrapper around ChatGPT. By using a **Multi-Agent workflow**, we ensure that a user asking about Section 80C deductions gets answered by an AI explicitly prompted and fine-tuned for Indian Taxation (CA Agent), while someone asking about retirement gets the Finance Agent. **It's scalable, modular, and directly solves the accessibility issue of HNI-only financial advisory.**

---
*Built with ❤️ for [Hackathon Name/Community]*
