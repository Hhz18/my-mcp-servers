---
name: api-test-doc-standard
description: 生成详细后端API测试文档的标准，针对Postman进行了优化。当用户要求生成API测试文档或Postman指南时使用此技能。
license: Complete terms in LICENSE.txt
---

This skill defines the standard format for generating backend API testing documentation. The output should be a Markdown file that users can directly use to configure Postman.

## 1. Documentation Structure

The document must follow this structure:

### 1.1 Global Environment Configuration
- Define a table for Postman Environment variables.
- Must include: `base_url`, `admin_token`, `student_token` (or other role-based tokens).
- Explicitly state how tokens are obtained (e.g., via Login interface).

### 1.2 Modules
- Group interfaces by logical modules (e.g., Auth, User Management, Course Management).
- Use clear H2/H3 headers.
- Specify required **Pre-request Headers** for each module (e.g., `Authorization: Bearer {{token}}`).

## 2. Interface Detail Requirements

For **EACH** interface, you MUST provide:

1.  **URL & Method**: Use environment variables (e.g., `{{base_url}}/auth/login`).
2.  **Description**: Brief explanation of the endpoint's purpose.
3.  **Request Body (Critical)**:
    - For `POST`/`PUT` requests, provide a **COMPLETE JSON EXAMPLE**.
    - Do not use vague descriptions; providing valid, copy-pasteable JSON is mandatory.
    - Comment on optional fields.
4.  **Parameters**:
    - List Query Parameters (`?key=value`) and Path Variables (`/{id}`).
5.  **Postman Tests (Script)**:
    - For Login/Token interfaces, provide the **JavaScript code** to automatically set environment variables.

## 3. Template Example

```markdown
# [Project Name] API Test Guide (Postman)

## 1. Environment
| Variable | Value | Description |
| :--- | :--- | :--- |
| base_url | http://localhost:8080/api | API Base URL |
| token | | Auto-filled after login |

## 2. Auth Module
### 2.1 Login
* **URL**: `{{base_url}}/auth/login`
* **Method**: `POST`
* **Body**:
  ```json
  {
    "username": "admin",
    "password": "123"
  }
  ```
* **Tests**:
  ```javascript
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
  ```

## 3. User Module
**Header**: `Authorization: Bearer {{token}}`

### 3.1 Get User Info
* **URL**: `{{base_url}}/user/info`
* **Method**: `GET`
```

## 4. Key Principles
- **Conciseness**: format nicely with markdown lists.
- **Completeness**: Never omit the JSON body for write operations.
- **Automation**: Always include scripts for token management.
