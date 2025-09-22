# Notifications & Reports Design

## 1. User Daily Progress Email (Mon–Fri, 8pm Nairobi)
**Recipient:** Each user

**Subject:** Your Daily Task Progress Report

**Content:**
- Greeting ("Hello, [User Name]")
- Summary counts:
  - Completed/Closed tasks: [count]
  - Pending tasks: [count]
  - Blockers: [count]
- List of tasks by status:
  - **Completed/Closed**
    - Task title, deadline, (subtasks if any)
  - **Pending**
    - Task title, deadline, (subtasks if any)
  - **Blockers**
    - Task title, deadline, blocker reason, (subtasks if any)
- Motivational closing line

---

## 2. Manager Daily Completed Tasks Summary (Mon–Fri, 8pm Nairobi)
**Recipient:** Manager of each department

**Subject:** Daily Completed Tasks Summary for Your Team

**Content:**
- Greeting ("Hello, [Manager Name]")
- Date of report
- List of users in the department
  - For each user:
    - Completed/Closed tasks: [count]
    - List of completed/closed tasks (title, deadline, subtasks)
- Closing line

---

## 3. Wednesday Weekly Report (Wed, 9am Nairobi)
**Recipient:** Each user

**Subject:** Weekly Progress Report

**Content:**
- Greeting ("Hello, [User Name]")
- Summary counts for the week:
  - Completed/Closed tasks: [count]
  - Pending tasks: [count]
  - Blockers: [count]
- List of tasks by status (as in daily report, but for the week)
- Motivational closing line

---

## 4. Thursday Report (Thu, 4:30pm Nairobi)
**Recipient:** Each user

**Subject:** Thursday Progress & Overdue Tasks Report

**Content:**
- Greeting ("Hello, [User Name]")
- Summary counts for the week (as above)
- List of tasks by status (as above)
- **Overdue Tasks:**
  - List of tasks not completed and past their deadline, which will be worked on next week
    - Task title, original deadline, status, (subtasks if any)
- Closing line

---

## Formatting Notes
- All emails should be styled for clarity (tables or bullet lists for tasks)
- Subtasks should be indented or listed under their parent task
- Blocker tasks should include the blocker reason
- Dates should be formatted in Nairobi local time
