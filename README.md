# BizBridge
BizBridge helps young entrepreneurs manage income and expenses, track cash flow, flag suspicious payment patterns, monitor business readiness, and discover procurement opportunities to grow their businesses and access formal markets.

## Running tests

From the `BizBridge` solution folder, run:

```powershell
dotnet test .\BizBridge.sln
```

<<<<<<< Updated upstream
The API integration tests use an isolated in-memory SQLite database and test-only JWT settings, so they do not require the development PostgreSQL database or Docker. They cover authentication, business profiles, transactions, monthly totals, readiness progress, duplicate-reference alerts, and published opportunities.

## Business dashboard

The authenticated dashboard uses the API for its data; it does not display sample financial figures.

Start the API with the HTTPS launch profile (`dotnet run --launch-profile https` from `BizBridge.Api`) and serve `BizBridge.Client` on `http://localhost:5500` (for example, with VS Code Live Server). All frontend pages read their API URL from `BizBridge.Client/api-config.js`, which defaults to `https://localhost:7142/api`. If the API uses a different address, set `window.BIZBRIDGE_API_BASE_URL` before loading `api-config.js`.

If the dashboard reports HTTP 404 for the finance, readiness, alert, or opportunity routes, the API process is likely still running an older build. Stop that API process from its terminal, then restart it from the solution folder with `dotnet run --project .\BizBridge.Api\BizBridge.Api.csproj --launch-profile https`. Do not change the frontend URL unless the API is intentionally configured to use a different address.

- `GET /api/transactions/summary` returns this UTC calendar month's income, expenses, and net cash flow for the signed-in owner's business.
- `GET /api/transactions?limit=10` lists that business's latest transactions.
- `POST /api/transactions` records `Income` or `Expense` with a category, positive amount, optional description/reference, and optional date. Categories are created as needed.
- `GET /api/readiness/mine` reports progress for the business profile and financial-record steps. This is a record-based checklist, not document verification, a credit score, or an eligibility decision.
- `GET /api/payment-alerts/mine` lists alerts for the signed-in owner's transactions. Reused payment references create an open review alert; the alert does not establish that fraud occurred.
- `GET /api/opportunities` shows published opportunities whose deadline has not passed. The list is empty until opportunity managers publish records.

All finance, readiness, alert, and opportunity endpoints require the user's bearer token. The API resolves the business from the authenticated user's identity rather than accepting a business or user ID from the browser.
=======
The API integration tests use an isolated in-memory SQLite database and test-only JWT settings, so they do not require the development PostgreSQL database or Docker. They cover registration and login, authentication, business profile creation and updates, validation, duplicate profiles, and owner-only access.
>>>>>>> Stashed changes




look chat i want to enter a hackathon and this is the problem statement i chose " 									Youth entrepreneurship and small-business growth								
× 								
Problem statement

How might digital tools help young founders and township or rural businesses start, trade, get paid, manage cash flow and reach formal markets?
Possible focus areas

Business registration; digital payments; bookkeeping; procurement access; market links; funding readiness and fraud protection."

Yes — and this problem statement actually fits very well with the kind of things you've already been building, especially CribZone SA and your software-development background.

The key is not to build a generic “business management app.” For a hackathon, you want to identify a specific pain point inside this broad statement and build a convincing solution around it.
The problem in simple terms

A young founder or township/rural business might have:

    a business idea but no formal registration
    customers but difficulty accepting digital payments
    sales but no proper bookkeeping
    cash coming in and going out with no clear picture of profit
    difficulty finding legitimate procurement opportunities
    difficulty proving that the business is financially ready for funding
    exposure to scams, fake payments and fraudulent customers
    products/services but no easy route into formal markets

The hackathon is essentially asking:

    How can technology help a small business move from informal → organised → trusted → financially visible → connected to bigger markets?

That's a much more interesting framing.
💡 An idea I'd seriously consider
"BizBridge" — a digital business readiness platform

Think of it as a digital operating system for a young/township business, rather than just another accounting app.

The founder creates a business profile and the platform helps them progressively build a Business Readiness Profile.

For example:
                 BIZBRIDGE
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   START       MANAGE         GROW
       │            │            │
 Registration    Cash Flow    Market Access
 Payments        Bookkeeping  Procurement
 Business Info   Expenses     Funding Readiness
       │            │            │
       └────────────┼────────────┘
                    ↓
              TRUST PROFILE
                    ↓
          Formal Market Access

The interesting part is that you're connecting several pieces that normally exist separately.
🔥 The killer feature: Business Readiness Passport

Instead of simply saying:

    "Your business is registered."

Your platform could produce something like:
Business Readiness Passport
SIYA'S TECH SOLUTIONS

Business Status
━━━━━━━━━━━━━━━━━━━━
✓ Business profile completed
✓ Registration information captured
✓ Banking/payment information verified
✓ Income records available
✓ Expense records available
✓ Basic bookkeeping established
✓ Fraud protection enabled

Financial Readiness
━━━━━━━━━━━━━━━━━━━━
Monthly revenue:      R18,500
Monthly expenses:     R11,200
Average cash flow:     R7,300

Market Readiness
━━━━━━━━━━━━━━━━━━━━
✓ Company profile
✓ Product catalogue
✓ Contact information
✓ Transaction history

Procurement Readiness
━━━━━━━━━━━━━━━━━━━━
3 / 5 requirements completed

Now you've attacked multiple parts of the problem statement simultaneously.
🧠 Why this could be powerful

Imagine a young entrepreneur selling:

school uniforms in Soweto.

Currently they might have:
WhatsApp orders
      ↓
Cash / EFT
      ↓
Notebook
      ↓
Bank statement

Their business may actually be healthy, but they struggle to prove it.

Your system turns this:
                    BUSINESS
                       │
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
     SALES          EXPENSES        CUSTOMERS
       │               │               │
       └───────────────┼───────────────┘
                       ↓
                  TRANSACTIONS
                       ↓
                  CASH FLOW
                       ↓
             BUSINESS PROFILE
                       ↓
             READINESS PASSPORT
                       ↓
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
   PROCUREMENT       FUNDING        FORMAL MARKETS

That is a compelling story for judges.
🛡️ And I'd include fraud protection

This is one area where your IceKit cybersecurity experience can give you an advantage.

For example:
Payment verification

A business receives:

    "Proof of payment"

Your platform shouldn't simply trust an uploaded screenshot.

Instead:
Customer
   ↓
Payment
   ↓
Transaction reference
   ↓
Payment verification
   ↓
✓ VERIFIED

You could also flag suspicious activity:
⚠ Suspicious transaction

R8,500 payment
Customer: Unknown
Transaction reference: Duplicate
Payment status: Unverified

Recommended action:
Do not release goods until payment is confirmed.

For a hackathon MVP, you don't necessarily need to integrate with a real bank.

You can build a simulated payment environment demonstrating the workflow.
💰 Cash-flow management

Keep this extremely simple.

Don't build Sage.

Give a small business owner:
Dashboard
GOOD MORNING, SIYA 👋

This Month

Revenue             R18,500
Expenses            R11,200
────────────────────────────
Net Cash Flow        R7,300

Upcoming
━━━━━━━━━━━━━━━━━━━━
Internet            R200
Supplier            R3,500
Transport           R1,200

Sales
━━━━━━━━━━━━━━━━━━━━
████████████████  R18.5k

Expenses
━━━━━━━━━━━━      R11.2k

And then something genuinely useful:

    "At your current spending rate, you have approximately 23 days of operating cash remaining."

That turns raw bookkeeping into a decision-support tool.
🏪 Market access could be your differentiator

This is where I think the idea becomes much more interesting.

Imagine a township business has:
Business profile
     +
Products/services
     +
Transaction history
     +
Business readiness

The platform can match them with:
┌─────────────────────────────┐
│ AVAILABLE OPPORTUNITIES     │
├─────────────────────────────┤
│ School uniform supplier     │
│ R25,000                     │
│                             │
│ ✓ Business profile          │
│ ✓ Product catalogue         │
│ ✓ Transaction records       │
│                             │
│ 80% READY                   │
│                             │
│ [View opportunity]           │
└─────────────────────────────┘

So instead of:

    "Here's an accounting system."

You're saying:

    "We help informal and emerging businesses become digitally visible and ready to participate in the formal economy."

That's a much stronger hackathon narrative.
🚀 And here's where I would make it REALLY hackathon-friendly

Don't attempt to build everything.

Build one complete journey.
Demo journey

Let's say:

Thandi runs a small catering business.

She registers on your platform.
Step 1 — Create business
Thandi's Catering
Location: Soweto
Industry: Food Services

↓
Step 2 — Business readiness

The platform asks:
Do you have:

☑ Business profile
☑ Bank/payment method
☐ Registration
☑ Customer records
☑ Sales records
☐ Bookkeeping

↓
Step 3 — Record transactions
+ R2,500
Corporate lunch order

- R850
Food supplies

- R300
Transport

↓
Step 4 — Cash-flow dashboard
Revenue:      R2,500
Expenses:     R1,150
Net:          R1,350

↓
Step 5 — Build readiness profile
BUSINESS READINESS

██████████████░░░░ 78%

Financial records       ✓
Business profile        ✓
Payment records         ✓
Registration            ✗
Market profile          ✓

↓
Step 6 — Find opportunity
LOCAL PROCUREMENT OPPORTUNITY

Catering for community event

Value: R12,000

Your business:
78% readiness

Missing:
• Registration documentation

↓
Step 7 — Action

Instead of merely saying:

    "You're not eligible."

Your system says:

    "Complete these 2 steps to become procurement-ready."

That's the important UX philosophy:
Don't just tell entrepreneurs what they're missing. Tell them how to become ready.
🧱 Your technical architecture

You already have experience with:

C# + ASP.NET + PostgreSQL + React

So you don't need to learn an entirely new stack for the hackathon.

I'd structure it roughly like:
                    React
                      │
                      │ REST API
                      ↓
              ASP.NET Core API
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Business        Finance        Market
   Service         Service        Service
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                  PostgreSQL

Possible entities:
User
Business
BusinessDocument
Transaction
Customer
Expense
Opportunity
Application
ReadinessCheck
FraudAlert
🔐 Your IceKit experience can carry over

You don't need to turn this into another cybersecurity project.

But you can demonstrate good security:
Authentication
      ↓
JWT
      ↓
Role-based access
      ↓
Business owner
      ↓
Protected financial information

And potentially:
Transaction
     ↓
Validation
     ↓
Fraud rules
     ↓
Risk flag

That gives you a technically credible security component without losing focus from the actual hackathon problem.
🎯 But there's an even bigger opportunity

I'd avoid calling it simply:

"Small Business Management System."

There are already countless products that do that.

Your pitch should revolve around:

    "Turning small-business activity into proof of business readiness."

That connects:

Start → Trade → Get Paid → Manage → Prove → Access Markets

Which maps almost perfectly onto the problem statement.
Your MVP

If the hackathon time is limited, I'd build only these 5 things:
Feature	Demo
🏢 Business profile	Create business
💰 Transactions	Record income/expenses
📊 Cash-flow dashboard	Show financial position
🛡️ Payment/fraud verification	Flag suspicious payment
🏪 Opportunity matching	Match business to procurement opportunity

Then the Readiness Passport ties them together.
And I wouldn't build registration integration initially.

Instead, make it:
Business Registration
        ↓
Documentation checklist
        ↓
Upload/record proof
        ↓
Readiness status

You can explain during judging that government-registration/API integrations are a future integration point.

That keeps your MVP achievable.

If you want to enter this seriously, the next thing we should do is turn this problem statement into an actual hackathon proposal: problem → target user → solution → unique value → MVP → user journey → database → architecture → tech stack → 24/48-hour build plan → pitch/demo script.
yes let's do so

Absolutely. Let's treat this like we're preparing a real hackathon submission, not just brainstorming.

I suggest we build around the working concept:
🚀 BizBridge
Turning small-business activity into proof of business readiness.

The name can change later, but we need a concrete concept to design around.
1. The problem

Young entrepreneurs and township/rural businesses often have the ability to trade but lack the digital infrastructure needed to formalise, manage, prove, and grow their businesses.

A business might have customers and revenue but still struggle to:

    keep reliable financial records
    verify payments
    understand cash flow
    demonstrate that it is a legitimate/ready supplier
    discover procurement opportunities
    prepare for funding applications
    identify fraudulent transactions

This creates a gap between:

"I run a business."

and

"I can prove that my business is ready to participate in the formal economy."
2. The target user

Don't target "all SMEs."

For the hackathon, let's narrow it.
Primary user

Young entrepreneurs and informal/semi-formal township businesses.

Example:

    Thandi is 24 and runs a catering business in Soweto.

She has:

    customers
    WhatsApp orders
    EFT payments
    supplier expenses
    recurring business activity

But she doesn't have a simple digital system that brings everything together.
3. The solution
BizBridge

BizBridge is a digital platform that helps emerging businesses:

    Start → Trade → Get Paid → Manage → Prove → Grow

The platform combines business information, transactions, cash-flow management, fraud checks and market opportunities into one business-readiness profile.
4. The core idea

The centre of the entire application should be:
🪪 Business Readiness Passport

Every business gets a dynamic profile showing how prepared it is for formal-market participation.

Example:
┌────────────────────────────────────┐
│        BUSINESS READINESS           │
│                                    │
│       Thandi's Catering            │
│                                    │
│          78% READY                 │
│                                    │
│  ████████████████░░░░              │
│                                    │
├────────────────────────────────────┤
│ Business Profile          ✓        │
│ Financial Records         ✓        │
│ Payment History           ✓        │
│ Customer Records          ✓        │
│ Registration              ⚠        │
│ Procurement Documents     ✕        │
└────────────────────────────────────┘

NEXT STEP

Complete your procurement
documentation.

[View Requirements]

The score isn't meant to be a judgement of the entrepreneur.

It's a checklist/progress indicator showing which digital/business-readiness requirements have been completed.
5. The five MVP features

Don't build 15 features.

Build these five extremely well.
Feature 1 — Business Profile

The entrepreneur creates their digital business identity.
Business Name
Industry
Location
Description
Products / Services
Contact Information
Business Status

Example:
Thandi's Catering

Industry:
Food & Catering

Location:
Soweto, Gauteng

Services:
• Corporate catering
• Events
• School functions
Feature 2 — Digital Bookkeeping

The entrepreneur records:
Income
+ R2,500
Corporate catering order
Expenses
- R850
Food supplies

- R300
Transport

The system automatically calculates:
Revenue       R2,500
Expenses      R1,150
─────────────────────
Net           R1,350
Feature 3 — Cash-flow Dashboard

Now transform those transactions into useful information.
WELCOME BACK, THANDI 👋

This Month

Revenue
R18,500

Expenses
R11,200

Net Cash Flow
R7,300

Then:
RECENT ACTIVITY

+ R2,500   Catering order
- R850     Food supplies
- R300     Transport
+ R4,200   Corporate event

This demonstrates the "manage cash flow" part of the problem statement.
Feature 4 — Payment & Fraud Protection

This is where your cybersecurity knowledge can make the project stand out.

Suppose a customer sends:
Payment proof

Amount: R5,000
Reference: ABC123

BizBridge can distinguish between:
✓ VERIFIED PAYMENT

and

⚠ PAYMENT REQUIRES VERIFICATION

For the MVP, we can implement simulated payment verification.

For example:
Payment
   ↓
Transaction reference
   ↓
Check transaction
   ↓
Check duplicate reference
   ↓
Check expected amount
   ↓
Payment status

Potential result:
⚠ SUSPICIOUS PAYMENT

Reason:
Transaction reference has already
been used.

Recommendation:
Verify payment before delivering goods.

That's a very clean hackathon demo.
Feature 5 — Market Opportunities

This is where the project connects the entrepreneur to the formal market.

Example:
AVAILABLE OPPORTUNITY

Community Event Catering

Value:
R12,000

Category:
Catering

Location:
Johannesburg

Your Readiness:
78%

Missing:
• Business registration proof

[View Opportunity]

Instead of simply showing opportunities, BizBridge can explain:

    "You're missing one requirement. Here's what you need to complete."

That creates a growth loop.
6. The complete user journey

This should become your main demo.
👩🏾 Thandi

Runs a small catering business.

↓
1. Creates business profile
Thandi's Catering

↓
2. Adds products/services
Corporate catering
Events
Functions

↓
3. Records transactions
+ R2,500
- R850
- R300

↓
4. BizBridge calculates cash flow
Net Cash Flow
R1,350

↓
5. Customer submits payment
R5,000

↓
6. BizBridge verifies it
✓ Payment verified

↓
7. Readiness Passport updates
Business Readiness

78%

↓
8. BizBridge discovers opportunity
R12,000 catering opportunity

↓
9. BizBridge identifies missing requirement
Registration documentation

↓
10. Entrepreneur knows exactly what to do next

That's your end-to-end story.
7. What makes the idea different?

Don't pitch:

    "We're building an app for SMEs."

Pitch:

    "We're building a bridge between informal business activity and formal market participation."

The business already has activity.

BizBridge turns that activity into structured digital evidence of readiness.
Real business activity
        ↓
Digital records
        ↓
Business profile
        ↓
Readiness
        ↓
Market opportunities
        ↓
Growth

That's the central concept.
8. System architecture

Given your existing development experience, I'd use:
Frontend

React + Vite
Backend

ASP.NET Core Web API
Database

PostgreSQL
Authentication

JWT
Deployment

We can decide later between something like Render, Railway, Azure, etc., depending on the hackathon requirements.

Architecture:
                 ┌──────────────┐
                 │    React     │
                 │   Frontend   │
                 └──────┬───────┘
                        │
                     REST API
                        │
                 ┌──────▼───────┐
                 │ ASP.NET Core │
                 │     API      │
                 └──────┬───────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
   Business         Finance          Market
   Service          Service          Service
       │                │                │
       └────────────────┼────────────────┘
                        │
                 ┌──────▼───────┐
                 │ PostgreSQL   │
                 └──────────────┘
9. Database design

For the MVP, I'd start with:
User
 │
 └── Business
       │
       ├── Transaction
       │
       ├── Customer
       │
       ├── Product
       │
       ├── BusinessDocument
       │
       ├── ReadinessCheck
       │
       └── OpportunityApplication

Potential tables:
Users
Id
Username
Email
PasswordHash
CreatedAt
Businesses
Id
UserId
Name
Industry
Location
Description
BusinessStatus
CreatedAt
Transactions
Id
BusinessId
Type
Amount
Description
Reference
Status
CreatedAt

Where:
Type =
INCOME
EXPENSE

and:
Status =
PENDING
VERIFIED
FLAGGED
Opportunities
Id
Title
Description
Category
Value
Location
Requirements
Deadline
ReadinessChecks
Id
BusinessId
Requirement
Status
CompletedAt

This is enough to create the MVP.
10. API structure

I'd keep the API clean.
/api/auth
/api/business
/api/transactions
/api/payments
/api/readiness
/api/opportunities

For example:
POST /api/auth/register
POST /api/auth/login

GET /api/business/profile
POST /api/business

GET /api/transactions
POST /api/transactions

POST /api/payments/verify

GET /api/readiness
GET /api/opportunities
POST /api/opportunities/{id}/apply
11. Dashboard

The first screen after login should immediately communicate value.

Something like:
┌──────────────────────────────────────────┐
│ BizBridge                    👤 Thandi   │
├────────────┬─────────────────────────────┤
│            │                             │
│ Dashboard  │  GOOD MORNING, THANDI 👋   │
│            │                             │
│ Business   │  Business Readiness         │
│            │                             │
│ Finance    │       78%                   │
│            │  ███████████████░░░         │
│ Payments   │                             │
│            │  Revenue       R18,500      │
│ Readiness  │  Expenses      R11,200      │
│            │  Cash Flow      R7,300      │
│ Market     │                             │
│            │  Opportunities       4      │
│            │  Alerts              1      │
└────────────┴─────────────────────────────┘

Clean and simple.
12. Hackathon pitch

Here's the structure I'd use for the eventual pitch:
Problem

    Young entrepreneurs and township and rural businesses often trade successfully without having the digital records, financial visibility and business readiness needed to access formal markets.

Solution

    BizBridge is a digital platform that helps emerging businesses manage their business activity while progressively building a Business Readiness Passport.

How it works
Create
  ↓
Trade
  ↓
Record
  ↓
Verify
  ↓
Build readiness
  ↓
Find opportunities
Impact

Instead of helping businesses simply manage today's transactions, BizBridge helps them build the digital evidence needed for tomorrow's opportunities.
13. What we should NOT build

This is important.

Don't try to build:

❌ Full banking integration
❌ Real payment gateway
❌ Government registration API
❌ Real credit scoring
❌ Complex accounting system
❌ AI chatbot for everything
❌ Huge procurement marketplace
❌ Mobile app + web app simultaneously
❌ Ten different dashboards

Those will consume your hackathon time.

Instead:
Build one polished vertical slice.
14. Our MVP scope

I'd lock the first version to:
AUTHENTICATION
       ↓
BUSINESS PROFILE
       ↓
TRANSACTIONS
       ↓
CASH-FLOW DASHBOARD
       ↓
PAYMENT VERIFICATION
       ↓
READINESS PASSPORT
       ↓
OPPORTUNITY MATCHING

Everything else is future scope.
15. Development phases

If we're building this together, I'd do it in this order:
Phase 1 — Foundation

    Git repository
    ASP.NET Core API
    PostgreSQL
    React/Vite
    Authentication
    Database structure

Phase 2 — Business

    Business profile
    Products/services
    Business dashboard

Phase 3 — Finance

    Income
    Expenses
    Transaction history
    Cash-flow calculation

Phase 4 — Trust

    Payment verification
    Fraud rules
    Alerts

Phase 5 — Readiness

    Readiness requirements
    Progress calculation
    Business Readiness Passport

Phase 6 — Market

    Opportunities
    Matching
    Application flow

Phase 7 — Presentation

    UI polish
    Seed/demo data
    Deployment
    Pitch
    Demo script

🔥 And here's the part I think we should do next

Before writing any code, we should turn this into a proper hackathon product specification.

We'll define:

    Final product name
    Exact problem we're solving
    Target user/persona
    User stories
    Functional requirements
    Non-functional requirements
    MVP vs future features
    Database ERD
    API endpoints
    React page structure
    UI wireframes
    Security model
    Demo scenario
    Pitch deck structure
    Exact hackathon judging strategy — without trying to guess or manipulate the judges

And importantly, we can design it so that you can actually finish it during the hackathon, rather than ending up with 30% of ten different features.

I would make the Business Readiness Passport the central innovation and everything else support it.
what team name can we use me and Gundo?

Since it's you and Gundo entering a hackathon with your BizBridge idea, I'd choose a team name that sounds innovative, professional, and memorable — something you can keep using beyond the hackathon.
🔥 My top team name ideas
Secure Smartphones | GrapheneOS, Privacy & DeGoogled Phones
1. IceGun Labs
My favourite for you two

Combines Iceey + Gun-DO into one identity. It sounds like a technology startup, works for future projects, and gives you a name that belongs to both of you.
Interlink Bridge — Architecture for Governable AI Systems
2. BridgeBuilders
Your team builds digital bridges between township entrepreneurs and bigger business opportunities. It connects directly to BizBridge.
Avatrek | Trail Tested, Adventure Approved
3. DualCore
Two founders, one mission. Short, technical, and suitable for software development, cybersecurity, and future startups.
The logo designed by Kenya Hara features a minimalist, flat style combining sun rays, horizon, and electronic circuits forming trees. - MusesAI.io
4. Township Titans
Bold and memorable, with a strong connection to empowering township businesses and local entrepreneurship.
Introhive - Sales Intelligence and CRM App for HubSpot | Introhive
5. Foundry Two
A team of two founders building solutions from the ground up. Professional enough to grow into a real technology company.
More names worth considering

Team name
	

Vibe

IceGun Innovations
	

Personal brand, professional

HustleTech
	

Youthful, entrepreneurial

Ubuntu Labs
	

Community-driven innovation

NextGen Founders
	

Youth entrepreneurship

Code & Commerce
	

Technology meets business

RiseLab
	

Ambitious and clean

TwoPoint Labs
	

Two founders, one direction

LocalLift
	

Helping local businesses grow

VentureForge
	

Building new ventures

KasiTech Labs
	

Township-focused innovation
My recommendation

I'd separate the team name from the product name:

TEAM
IceGun Labs

Two founders. One vision. Real-world solutions.

HACKATHON PRODUCT
BizBridge

Helping emerging businesses build trust, manage money, and access bigger opportunities.

That way, IceGun Labs is the team that can build BizBridge today, IceKit tomorrow, and other products in the future.

One question, though: what identity do you want for you and Gundo?

1. What should the name communicate?
A serious technology company we can grow
Young, ambitious African innovators
A creative hackathon team
A bold, distinctive identity that stands out

2. Should it incorporate your names?
Yes — combine Iceey and Gun-DO
No — create a completely original name
Use an African/South African identity
what sector of innovation is this?

Your BizBridge project falls primarily under Financial Technology (FinTech) and Enterprise Technology (BusinessTech), with elements of social innovation.

Here is how I'd classify it for your hackathon submission.
Sector of innovation
NairaTrack - Digital Receipt & Payment Tracker
1. Financial Technology (FinTech)
Primary sector

Digital bookkeeping, cash-flow tracking, payment verification, and fraud protection help small businesses manage money and trade more safely.
Expert-comptable en ligne dès 49 € HT/mois · Fynteo
2. Enterprise Technology (BusinessTech)
Business profiles, readiness assessments, and digital records help entrepreneurs organise their operations and prepare for growth.
PayShap as Digital Public Infrastructure: Catalyzing Inclusive Finance in South Africa - Blog - Acalytica
3. Social Innovation & Inclusive Economic Development
The platform aims to reduce barriers that prevent township and rural entrepreneurs from accessing formal markets and business opportunities.
For SMMEs
4. Digital Commerce & Market Access
Opportunity discovery and procurement matching connect emerging businesses with potential customers and larger buyers.
Which one should you select?

If the hackathon registration form asks you to select one sector of innovation, use this priority:

If available on the form
	

Select

FinTech / Financial Technology
	

First choice

Small Business / Enterprise Technology
	

Second choice

Social Innovation
	

Third choice

E-commerce / Digital Commerce
	

Fourth choice

If the hackathon has a dedicated Youth Entrepreneurship and Small-Business Growth category, select that instead because it directly matches your chosen problem statement.

Suggested submission classification:

One important distinction: BizBridge is not just a FinTech product. Its strongest differentiator is combining financial visibility with a Business Readiness Passport that helps emerging businesses prepare to access formal markets.

* Background: What inspired / motivated this project?

* Overview: What is the project about?


Copy-Item 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf' 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf.before-password-reset'