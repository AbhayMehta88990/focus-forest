
###  [Live Demo → focus-forest-two.vercel.app](https://focus-forest-two.vercel.app)

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, Three.js, STOMP/SockJS, WebRTC |
| Backend | Java, Spring Boot 3, Spring Security, WebSocket |
| Database | MySQL (Aiven Cloud) |
| Deployment | Vercel (frontend), Render (backend) |

---

##  Run Locally

### Prerequisites

- **Node.js** (v18+) — [Download](https://nodejs.org)
- **Java 21** (JDK) — [Download](https://adoptium.net)
- **Maven** — [Download](https://maven.apache.org) (or use the bundled `mvnw`)
- **MySQL** — Local MySQL server running on port 3306
- **Google OAuth Credentials** — [Google Cloud Console](https://console.cloud.google.com)

---

### 1. Clone the repository

```bash
git clone https://github.com/AbhayMehta88990/focus-forest.git
cd focus-forest
```

### 2. Set up the database

Create a MySQL database:

```sql
CREATE DATABASE focusforest;
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3001/login/oauth2/code/google`
4. Add authorized JavaScript origin: `http://localhost:5173`
5. Note your **Client ID** and **Client Secret**

### 4. Start the backend

```bash
cd backend
```

Edit `src/main/resources/application.properties` and set your local values:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/focusforest?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

Then run:

```bash
mvn spring-boot:run
```

Backend will start on **http://localhost:3001**

### 5. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on **http://localhost:5173**

### 6. Open the app

Go to [http://localhost:5173](http://localhost:5173) and sign in with Google!

---
