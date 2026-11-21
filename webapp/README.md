# 🏛️ Elena Hughes · LeverageX Crypto Trading Terminal & Signals
> **Next-Generation Liquid Glass Telegram Mini App, Quantitative Signal Engine & Automated Trading Bot**

[![GitHub Pages](https://img.shields.io/badge/Live-Demo%20Terminal-00c851?style=for-the-badge&logo=telegram)](https://eticin60.github.io/elena-terminal/index.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TradingView](https://img.shields.io/badge/TradingView-Universal%20Charts-2962FF?style=for-the-badge&logo=tradingview&logoColor=white)](https://www.tradingview.com/)
[![Web3 Non-Custodial](https://img.shields.io/badge/Security-Non--Custodial-gold?style=for-the-badge&logo=ethereum)](https://eticin60.github.io/elena-terminal/terms.html)

---

## 🌟 Overview & Key Architecture

**Elena Hughes (Елена Хьюз · Crypto Signals / LeverageX)** is an institutional-grade crypto trading ecosystem designed for high-frequency volatility scanning, automated risk discipline, and seamless cross-platform execution.

It unifies a **Python-powered quantitative scanning engine (Termux/Linux server)** with a **Liquid Glass Fullscreen Telegram Mini App (HTML5/CSS3/Vanilla JS)**.

```
                        ┌────────────────────────────────────────────────────────┐
                        │            Telegram Client (Desktop / Mobile)          │
                        └───────────────────────────┬────────────────────────────┘
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      ▼                                                           ▼
        ┌───────────────────────────┐                               ┌───────────────────────────┐
        │   Global Search Main App  │                               │   Chat Menu Mini App      │
        │   (eticin60.github.io)    │                               │   (Live Tunnel / Server)  │
        └─────────────┬─────────────┘                               └─────────────┬─────────────┘
                      │                                                           │
                      └─────────────────────────────┬─────────────────────────────┘
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │    LeverageX Glass Terminal   │
                                    │  (Rehber, Piyasa, TV Chart)   │
                                    └───────────────┬───────────────┘
                                                    │ REST / CORS API
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │   Elena Core Server Engine    │
                                    │  • 0-10 Multi-Indicator Scan  │
                                    │  • Auto-Bot TP/SL Trailing    │
                                    │  • Non-Custodial Web3 Vault   │
                                    │  • Binance/Bybit API Gateway  │
                                    └───────────────────────────────┘
```

---

## 🚀 Core Features

### 1. 📚 Interactive Step-by-Step User Guide (First Tab)
- Onboarding for beginners: 6 clear modules covering non-custodial wallet connection, 0–10 signal grading, automated trailing TP/SL, exchange API key security, and TradingView webhooks.
- Multi-language switchable on-the-fly (`TR`, `RU`, `EN`, `UK`, `DE`, `ES`, `FR`, `AR`).

### 2. 📊 Universal Live TradingView Charting Engine
- Full asset search beyond crypto:
  - 🥇 **Commodities:** Gold (`TVC:GOLD`, `XAUUSD`), Silver (`TVC:SILVER`), Crude Oil (`TVC:USOIL`), Brent (`TVC:UKOIL`).
  - 💶 **Forex & Indices:** `EURUSD`, `GBPUSD`, `USDTRY`, `DXY`, `SPX`, `NASDAQ`.
  - 🪙 **Crypto:** All Binance Futures/Spot pairs with direct quick chips (`BTC`, `ETH`, `SOL`, `PEPE`, `SUI`, `DOGE`, `XRP`).
- One-tap chart inspection directly from 24h Volume Leaders and Gainers/Losers lists.
- Built-in multi-timeframe selector: `15m`, `1h`, `4h`, `1D`.

### 3. 🤖 Auto-Bot & Algorithmic Execution
- Multi-indicator confirmation engine: Supertrend, MavilimW, EMA (20/50/200), RSI, MACD, ADX, Volume Surge.
- Quantitative scoring: Signals graded from `0` to `10` (Tier A–D).
- Automatic partial take-profit ladder: **TP1 (conservative), TP2 (balanced), TP3 (runner)** with breakeven stop-loss movement.

### 4. 🔒 Enterprise Safety & Exchange Locks
- **API Guard:** The Auto-Bot and Manual Trading panels stay safely locked (`🔒`) until valid read/trade API keys are connected via the Exchange tab.
- **Strict Non-Custodial Vault:** Private keys and seed phrases are strictly forbidden and never requested. Read-only Web3 address verification via WalletConnect v2 (Reown).
- **Global Compliance:** Fully documented Terms of Service (`terms.html`) and Privacy Policy (`privacy.html`) protecting brand liability ($0 limitation).

---

## 🗂️ Project Structure

```bash
elena-terminal/
├── index.html          # Main Telegram WebApp Terminal (Liquid Glass UI)
├── admin.html          # Real-time Broadcast & Admin Telemetry Console
├── privacy.html        # Institutional GDPR & KVKK Privacy Policy
├── terms.html          # Global High-Risk Disclaimers & Terms of Service
├── style.css           # Premium frosted glass styling & responsive safe-areas
├── app.js              # State manager, TV chart router, CORS API client & i18n
├── admin.js            # Admin panel controller, user metrics & live broadcasting
└── assets/             # 30+ vector coin SVGs, exchange badges & branding logos
```

---

## ⚖️ Legal & Disclaimer

*Elena Hughes / LeverageX provides algorithmic market research and quantitative decision support software. This software does not provide financial or investment advice. Derivative trading involves substantial risk of capital loss. Operators assume zero liability.*

---

**Crafted with excellence by [@eticin60](https://github.com/eticin60)**
