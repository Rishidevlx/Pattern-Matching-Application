# ⚡ PATTERN MATCHING APPLICATION ⚡  
### 🧠 _Hack the Pattern. Beat the Clock._

> **A Hacker-Style Competitive Pattern Matching Platform**  
> Built for speed, fairness, and real-time execution control.

---

## 🕶️ SYSTEM STATUS
```diff
+ SESSION CONTROLLED
+ EXECUTION QUEUE ACTIVE
+ JAVA JVM PROTECTED
- API OVERLOAD BLOCKED
🧩 WHAT IS THIS?
Pattern Matching Application is a full-stack competitive coding system designed for
⚔️ college contests / hackathons / coding rounds.

Participants write C / Java code to solve pattern problems.
The system handles:

⚙️ Secure code execution

⏱️ Session-based time control

🚦 Queue & cooldown protection

📊 Live leaderboard with college details

All wrapped inside a cyber-punk / hacker-style IDE.

🚀 CORE FEATURES
🖥️ HACKER IDE
Language selector (C / Java – OpenJDK 15)

Live pattern output preview

Locked editor until session starts

Countdown timer synced with backend

🚦 EXECUTION QUEUE SYSTEM (ANTI-CRASH)
Language	Parallel	Cooldown	Memory	Timeout
C	5	5s	64MB	2s
Java	1	10–15s	128MB	2s
→ Direct compiler calls ❌
→ Backend queue control ✅
→ JVM overload ❌
→ Fair execution ✅
🛑 SESSION SECURITY
Global SESSION ACTIVE control (Admin)

Auto disqualification when time runs out

Backend is the single source of truth

Session state persisted (restart safe)

🧑‍💼 ADMIN DASHBOARD
🏆 Leaderboard with College Name

🔍 Participants Search (Lot No / Name / College)

🎛️ Filter by Status (Active / Finished / Disqualified)

▶️ Start / Stop Session Control

🧠 ARCHITECTURE (HIGH LEVEL)
User IDE (Netlify)
     ↓
Backend API (Render)
     ↓
Execution Queue
     ↓
Piston Engine
     ↓
Result → Leaderboard
+ Frontend NEVER talks to compiler directly
+ Backend enforces rules, limits, fairness
🛠️ TECH STACK
Layer	Technology
Frontend	React + Vite
Backend	Node.js + Express
Compiler Engine	Piston (via queue)
Database	MySQL
Hosting	Netlify (FE) + Render (BE)
⚙️ SETUP (LOCAL)
🔹 Clone
git clone https://github.com/Rishidevlx/Pattern-Matching-Application.git
cd Pattern-Matching-Application
🔹 Backend
cd backend
npm install
node server.js
Create .env:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=*****
DB_NAME=pattern_matching
🔹 Frontend
npm install
npm run dev
🔌 KEY API ENDPOINTS
Endpoint	Method	Purpose
/api/execute	POST	Execute code via queue
/api/session/start	POST	Start contest
/api/session/stop	POST	Stop contest
/api/update-progress	POST	Update user status
🧪 SECURITY & SAFETY
+ Infinite loops auto-killed
+ Memory abuse blocked
+ Cooldown prevents spam
+ Session spoofing impossible
No Docker.
No direct execution.
No backend crash.

🏴‍☠️ WHY THIS PROJECT IS DIFFERENT
Most online compilers:

❌ Crash under load

❌ JVM overload

❌ No fairness

This system:

✅ Queue-based execution

✅ Language-aware limits

✅ Contest-grade architecture

Built like real competitive coding platforms.

🤝 CONTRIBUTING
Want to improve the system?

git checkout -b feature/your-feature
git commit -m "Add something cool"
git push
Pull requests are welcome 🧠⚡

📜 LICENSE
MIT License.
Hack it. Learn from it. Improve it.

