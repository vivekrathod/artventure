# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome Back" [level=1] [ref=e5]
      - paragraph [ref=e6]: Sign in to your account to continue shopping
    - generic [ref=e7]:
      - generic [ref=e8]:
        - button "Continue with Google" [ref=e9]:
          - img [ref=e10]
          - generic [ref=e15]: Continue with Google
        - button "Continue with GitHub" [ref=e16]:
          - img [ref=e17]
          - generic [ref=e19]: Continue with GitHub
      - generic [ref=e22]: OR
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: Email
          - textbox "you@example.com" [ref=e27]: testuser1763400592333pnxreu0u@test.local
        - generic [ref=e28]:
          - generic [ref=e29]: Password
          - textbox "••••••••" [ref=e30]: TestPassword123!
        - button "Sign In" [ref=e31]
      - button "Send Magic Link" [ref=e33]
      - paragraph [ref=e34]:
        - text: Don't have an account?
        - link "Sign up" [ref=e35]:
          - /url: /auth/signup?redirectTo=/
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]:
    - img [ref=e42]
  - alert [ref=e47]
```