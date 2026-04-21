# NAMA Uni Portal

NAMA Uni Portal is a web-based scholarship and university application portal that connects students with universities and scholarship opportunities. The system is designed to help students create accounts, complete their profiles, select academic preferences, and submit applications in a more organized and manageable way.

The project is built with **React + Vite + TypeScript** for the frontend, **Supabase** for backend services and database, and **Resend API** for production-level email verification and notification workflows.

---

## Project Overview

This portal is intended to serve as a bridge between:

- **Students** who want to apply for universities and scholarship opportunities
- **Administrators / management team** who need to manage users, applications, and communication
- **Universities / partner institutions** involved in student admissions and scholarship processing

### Main Purpose
The goal of this project is to make the university and scholarship application process easier by providing one centralized system for:

- student registration
- profile and academic information collection
- university preference selection
- application handling
- email verification and notifications
- admin-side management

---

## How the System is Supposed to Work

### Student Side
1. A student creates an account.
2. The student verifies their email.
3. The student fills in personal and academic information.
4. The student selects study preferences such as:
   - level of study
   - preferred country / university
   - field of study
5. The student submits the required application data.
6. The system stores the data in Supabase.
7. Email notifications can be sent for verification, updates, or application-related communication.

### Admin / Management Side
1. Admin reviews registered students and submitted data.
2. Admin manages application records and portal data.
3. Admin can track users, scholarship-related workflows, and communication.
4. Admin can use notification/email workflows for important updates.

---

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend / Services
- Supabase
- Supabase Edge Functions
- Deno
- Resend API

---

## Prerequisites

Before running this project, make sure your PC has the following installed:

- **Node.js**
- **npm**
- **VS Code**
- **Deno**
- **Supabase CLI** (recommended if you want to run Supabase locally)

---

# 1. How to Set Up PC Environment for This Project

## Install Required Software

### A. Install Node.js
Download and install the latest **LTS** version of Node.js from the official website.

After installation, check:

```bash
node -v
npm -v
```

## ▶️ Install VS Code

Download and install **Visual Studio Code** from the official website:
```bash

👉 https://code.visualstudio.com/
```

### Verify Installation

After installation, open VS Code and ensure it runs correctly.

---

### Recommended VS Code Extensions

Install the following extensions for better development experience:

- ES7+ React/Redux Snippets  
- TypeScript and JavaScript Language Features  
- Tailwind CSS IntelliSense  
- ESLint  
- Prettier  
- Supabase  
- Deno  

To install extensions:
1. Open VS Code  
2. Go to Extensions (Ctrl + Shift + X)  
3. Search and install each extension  

---



### ▶️ Install Deno
Windows (PowerShell)

```bash
irm https://deno.land/install.ps1 | iex
```
```bash
macos
curl -fsSL https://deno.land/install.sh | sh
```

### Verify:

```bash
deno --version
```
---


### ▶️ Install Supabase CLI

```bash
npm install -g supabase
```


### Verify

```bash
supabase --version
```
---

##📥 2. Clone & Setup Project
###Clone Repository
```bash
git clone https://github.com/tanvironb/NAMA_uniPortal.git
cd NAMA_uniPortal
```

### Install Dependencies
```bash
npm install
```

## Setup Environment Variables

### Create .env file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Notes
- VITE_ → frontend variables
- Keep service keys private

---

## 💻 3. Setup Node.js in VS Code
### Steps
1. Open project folder in VS Code
2. Open terminal (Terminal → New Terminal)
3. Run:
   
```bash
node -v
npm -v
```
4. Install dependencies:
```bash
npm install
```

### Recommended Extensions
- ES7+ React Snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Supabase
- Deno

---

## 🧠 4. Setup Deno in VS Code
### Steps
1. Install Deno extension
2. Create .vscode/settings.json

```bash
{
  "deno.enable": true,
  "deno.unstable": true
}
```

---

## ▶️ 5. Run Project
### Start Development Server

```bash
npm run dev
```

### Open in Browser
```bash
http://localhost:8080
```
Requires Docker

---

## 📦 6. Build Production (dist)
### Build Project
```bash
npm run build
```

Output 
```bash
dist/
```

---

## ▶️ Preview Production Build
```bash
npm run preview
```

---

## 🔄 Development Workflow
### Run project
```bash
npm install
npm run dev
```

---

### Build project
```bash
npm run build
```

---

### Run Supabase
```bash
supabase start
```

---


### Deploy Edge Functions
```bash
supabase functions deploy
```

---

## 📜 Available Scripts
```bash
npm run dev
npm run build
npm run build:dev
npm run lint
npm run preview
```

---


## ⚡ Quick Start

```bash
git clone https://github.com/tanvironb/NAMA_uniPortal.git
cd NAMA_uniPortal
npm install
npm run dev
```

---


### 📝 Notes
- React + Vite frontend
- Supabase backend
- Deno for Edge Functions
- Resend API for emails
- Use dist/ for deployment


---

















