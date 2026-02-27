<div align="center">

# 🚀 QMAZE IDE v2.0 - Pattern Matching Engine
<img src="https://capsule-render.vercel.app/api?type=waving&color=00ff41&height=200&section=header&text=QMAZE%20IDE&fontSize=80&fontColor=000&animation=fadeIn" alt="QMAZE Header">

[![Made with React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Powered by Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-TiDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://pingcap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*An advanced, secure, and competitive coding environment designed for intense pattern-matching challenges.*

[Explore Features](#-core-features) • [Installation](#%EF%B8%8F-installation-guide) • [Architecture](#%EF%B8%8F-system-architecture) • [Security](#-anti-cheat-systems)

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&weight=700&size=24&pause=1000&color=00FF41&center=true&vCenter=true&width=600&lines=High-Speed+Code+Execution;Smart+Queue+Management;Multi-Key+Load+Balancing;Real-Time+Leaderboard;Advanced+Anti-Cheat+System" alt="Typing SVG" />
</p>

</div>

---

## 🌟 Overview

**QMAZE IDE** is a sophisticated web-based compiler and pattern-matching evaluation platform. It provides a highly controlled environment where students can write, execute, and validate C and Java code against predefined patterns. Built to handle heavy concurrent loads during college coding events, the system ensures fairness, speed, and strict security monitoring.

<br>

## ✨ Core Features & Optimizations

We have implemented several enterprise-grade techniques to ensure zero downtime and lightning-fast execution, even when multiple users compile code simultaneously.

| Feature Area | Description | Impact |
| :--- | :--- | :--- |
| **⚡ Smart Execution Queue** | A robust queuing mechanism in Node.js that throttles intensive requests. It processes `C` and `Java` compilations chronologically. | Prevents server crashes and memory leaks during high concurrency. |
| **🛡️ Distributed Compute Engine** | Integrates with high-performance Tier-1 cloud execution instances to compile code swiftly and securely. | Sub-second execution times with strict containerized isolation. |
| **🔄 Intelligent API Rotation** | *Secret Key Rotation Logic:* The backend dynamically cycles through a pool of distinct execution access keys in a continuous loop. | Effectively bypasses standard rate limits, scaling execution quotas infinitely securely. |
| **⏱️ Dynamic Timeout Handling** | Hardcoded execution limits (e.g., 5-10s) to forcefully terminate infinite loops or heavy processing scripts. | Protects the compute engine resources and ensures fair play. |
| **⏳ Active Cooldowns** | Implements a 5-second `Run` button cooldown per user payload to prevent intentional DDoS or spamming. | Maintains queue stability and fair resource distribution. |

<br>

## 🔐 Advanced Anti-Cheat Systems

To maintain the integrity of competitive programming events, QMAZE enforces strict behavioral tracking:

- **🚫 Paste Protection:** Detects and prevents unauthorized pasting from external sources, logging a warning violation immediately.
- **👁️ Focus Monitoring (Window Blur):** Tracks system visibility. Switching tabs, opening new windows, or minimizing the IDE triggers a severe security alert and adds to the user's warning count.
- **⏱️ Master Timer Override:** Admin-controlled session timers are completely synced via backend. Users cannot manipulate the countdown using browser developer tools.

<br>

## ⚙️ System Architecture

<details>
<summary><b>Click to expand Technical Architecture Diagram</b></summary>
<br>

```mermaid
graph TD;
    A[React.js Client IDE] -->|Code Submission via REST API| B(Express.js Backend)
    B --> C{API Key Router}
    C -->|Key 1| D[Sandbox Executor]
    C -->|Key 2| D
    C -->|Key N| D
    D -->|stdout/stderr| B
    B -->|Persists Progress| E[(TiDB Database)]
    B -->|WebSocket/Poller| A
```
</details>

<br>

## 🛠️ Installation Guide

Follow these steps to set up the QMAZE IDE locally.

### 1. Clone the Repository
```bash
git clone https://github.com/Rishidevlx/Pattern-Matching-Application.git
cd Pattern-Matching-Application
```

### 2. Frontend Setup (React)
Open a new terminal and run:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Backend Setup (Node.js)
Open another terminal tab:
```bash
cd backend

# Install dependencies
npm install

# Create environment file (.env) and add necessary credentials
# (Database connection strings, Execution API Keys)

# Start backend server
node server.js
```

<br>

## 🎮 Admin Controls

The system includes a secure Admin Panel (`/admin`) capable of configuring global constraints instantly:
- Enable/Disable Focus and Paste Security globally without code deployment.
- Adjust global session durations.
- Live-monitor active sessions and execution status.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0e1015&height=100&section=footer" alt="Footer">
  
  **Built with 💻 and ☕ by [Rishidevlx](https://github.com/Rishidevlx)**
</div>
