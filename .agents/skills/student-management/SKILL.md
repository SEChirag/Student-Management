---
name: student-management
description: >-
  Workflows, build procedures, architecture guidelines, and operational runbook for the
  Student-Management (Campus Dashboard) Spring Boot application. Use this skill when
  developing, testing, debugging, building, running, or extending the Student-Management project.
---

# Student Management System (Campus Dashboard)

This skill provides the architectural reference, environment setup, build and run instructions,
API catalog, security model, and troubleshooting guide for the **Student-Management** codebase.

---

## 1. Project Overview & Tech Stack

The application is a full-stack student information and assignment management system ("Campus").

- **Backend Framework**: Spring Boot 3.3.2
- **Language**: Java (Target: 17 or 21)
- **Database**: PostgreSQL (Hibernate / Spring Data JPA)
- **Security**: Spring Security 6 with stateless JWT authentication & BCrypt password hashing
- **API Documentation**: SpringDoc OpenAPI 2.6.0 with Scalar UI (`/scalar.html`)
- **Email Service**: Spring Boot Starter Mail with asynchronous event listener (`@Async`, `@TransactionalEventListener`)
- **Frontend**: Vanilla HTML5, modern CSS3 (`style.css`), and JavaScript (`script.js`) served from `src/main/resources/static/`
- **Build Tool**: Apache Maven 3.9+

---

## 2. Directory & Component Structure

```text
Student-Management/
├── pom.xml                                    # Maven dependencies & build configuration
├── README.md                                  # Project documentation
├── src/
│   ├── main/
│   │   ├── java/com/test/
│   │   │   ├── Main.java                      # Spring Boot main entry point
│   │   │   ├── DataInit.java                  # CommandLineRunner for initial SuperAdmin seeding
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java        # Security filter chains, CORS, and endpoint rules
│   │   │   │   ├── JwtFilter.java             # OncePerRequestFilter for Bearer JWT parsing
│   │   │   │   └── SwaggerConfig.java         # OpenAPI / Swagger definition
│   │   │   ├── AuthController/
│   │   │   │   └── AuthController.java        # Login, registration, token generation, profiles
│   │   │   ├── Controller/
│   │   │   │   ├── StudentController.java     # Admin operations on students & assignments (/API)
│   │   │   │   ├── UserStudentController.java # Student portal endpoints (/student)
│   │   │   │   ├── DoubtController.java       # Q&A doubt system for students & admins
│   │   │   │   ├── SuperadminController.java  # User approval & account administration (/superadmin)
│   │   │   │   └── UserController.java        # (Legacy/commented-out controller)
│   │   │   ├── Service/
│   │   │   │   ├── AuthService.java           # Authentication, JWT issuing, profile linking
│   │   │   │   ├── StudentService.java        # Student & assignment business logic
│   │   │   │   ├── DoubtService.java          # Doubt query & answer logic
│   │   │   │   ├── SuperadminService.java     # User account approval/rejection logic
│   │   │   │   └── EmailService.java          # Mail sending on student account creation
│   │   │   ├── Entity/
│   │   │   │   ├── User.java                  # System user credentials, status, role
│   │   │   │   ├── Model.java                 # Student academic record (marks, section, roll number)
│   │   │   │   ├── StudentProfile.java        # Student profile metadata (full name, section)
│   │   │   │   ├── AdminProfile.java          # Admin profile metadata (department)
│   │   │   │   ├── AssignmentsList.java       # Master assignment definitions
│   │   │   │   ├── StudentAssignments.java    # Per-student assignment completion status
│   │   │   │   ├── Doubt.java                 # Student doubt ticket and admin response
│   │   │   │   └── LoginRequest.java          # DTO for auth requests
│   │   │   ├── Repository/
│   │   │   │   ├── UseRepository.java         # User repository (User entity)
│   │   │   │   ├── repository.java            # Student repository (Model entity)
│   │   │   │   ├── StudentProfileRepository.java
│   │   │   │   ├── AdminProfileRepository.java
│   │   │   │   ├── AssignmentRepo.java
│   │   │   │   ├── StudentAssignmentRepo.java
│   │   │   │   └── DoubtRepository.java
│   │   │   ├── Event/
│   │   │   │   └── StudentAccountCreateEvent.java # Event published when a student is created
│   │   │   ├── Exceptions/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── StudentNotFoundException.java
│   │   │   ├── dto/
│   │   │   │   └── AdminSummary.java
│   │   │   └── util/
│   │   │       ├── JwtUtil.java               # JWT creation, signing, parsing, claims
│   │   │       └── CredentialGenerator.java   # Username & random temporary password generator
│   │   └── resources/
│   │       ├── application.properties         # Database, server port, JPA, and SMTP config
│   │       └── static/
│   │           ├── index.html                 # Single-page web dashboard
│   │           ├── scalar.html                # Scalar API reference UI
│   │           ├── css/style.css              # Frontend styling
│   │           └── js/script.js               # Frontend JavaScript logic
│   └── test/java/com/test/
│       └── Service/StudentServiceTest.java    # Unit tests (Mock-based JUnit 5 tests)
```

---

## 3. Build & Run Procedures

### Prerequisites
- JDK 17+ installed (`java -version`)
- Maven 3.9+ (`mvn -version`)

### Compilation & Build Commands

**Run Unit Tests:**
```bash
mvn clean test
```

**Standard Maven Build:**
```bash
mvn clean package -DskipTests
```

**Running the Application (Local Mode - H2 in-memory DB, port 8081):**
```bash
mvn spring-boot:run
```

**Running with External PostgreSQL Database:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```
Or set environment variable:
```bash
export SPRING_PROFILES_ACTIVE="postgres"
mvn spring-boot:run
```

Or run the packaged jar:
```bash
java -jar target/Mannual_code-0.0.1-SNAPSHOT.jar
```

Access Points:
- Web App: `http://localhost:8081/`
- API Scalar UI: `http://localhost:8081/scalar.html`
- OpenAPI Specification: `http://localhost:8081/v3/api-docs`

---

## 4. Role & Security Architecture

The system defines 4 user roles:
1. `SUPER_ADMIN`: Seeds on first startup (`superadmin` / `superadmin123`). Approves or rejects newly registered admins and users.
2. `ADMIN`: Manages students, creates assignments, answers doubts, views reports.
3. `USER` / `STUDENT`: Students viewing their marks, personal assignments, and submitting doubts.

### Default Initial User
Seeded by `DataInit.java`:
- Username: `superadmin`
- Password: `superadmin123`
- Role: `SUPER_ADMIN`
- Status: `APPROVED`

### Endpoint Authorization Matrix
| Endpoint Pattern | Allowed Roles | Purpose |
| :--- | :--- | :--- |
| `/auth/login`, `/auth/register`, `/auth/oauth/token` | Public | Authentication endpoints |
| `/auth/me`, `/auth/profile/**` | Authenticated / Public | Profile querying and updating |
| `/student/**` | `ROLE_USER`, `ROLE_STUDENT`, `ROLE_ADMIN` | Student portal APIs |
| `/API/**` | `ROLE_ADMIN`, `ROLE_SUPER_ADMIN` | Admin management APIs |
| `/superadmin/**` | `ROLE_SUPER_ADMIN` | Account approvals & user management |
| `/v3/api-docs/**`, `/scalar.html`, static assets | Public | Documentation & static assets |

---

## 5. Known Gotchas & Troubleshooting Runbook

1. **Java Version Mismatch (`release version 21 not supported`)**:
   - Issue: `pom.xml` targets Java 21, but the system JDK is Java 17.
   - Fix: Update `pom.xml` `<java.version>17</java.version>` and compiler plugin `<source>17</source><target>17</target>`, or install JDK 21.

2. **Role Mismatch on Student Creation**:
   - Issue: `StudentService.addStudent()` sets role to `"STUDENT"`, while `SecurityConfig` and `UserStudentController` expect `"USER"`.
   - Fix: Either set `ROLE_STUDENT` in `SecurityConfig` / `PreAuthorize`, or set `studentUser.setRole("USER")`.

3. **Infinite Recursion in `AuthService.saveProfile()`**:
   - Issue: If role is `"ADMIN"`, `saveProfile(profile)` calls itself instead of saving to `adminProfileRepo`.
   - Fix: Delegate to `saveAdminProfile(profile)`.

4. **Student Assignment Assignment ID Bug**:
   - Issue: In `StudentService.addAssignments()`, `sa.setStudentId(saved.getStudentId())` is called inside `students.stream()`, instead of `sa.setStudentId(student.getId())`.
   - Fix: Use `sa.setStudentId(student.getId())`.

5. **Missing `@EnableAsync`**:
   - Issue: `EmailService` uses `@Async`, but `@EnableAsync` is not on `Main.java`, causing emails to send synchronously and block the request thread.
   - Fix: Add `@EnableAsync` to `Main.java` or a configuration class.

6. **Frontend Static Resource Paths**:
   - Issue: `index.html` references `../css/style.css` and `../js/script.js`.
   - Fix: Use `/css/style.css` and `/js/script.js` or `css/style.css` and `js/script.js`.

