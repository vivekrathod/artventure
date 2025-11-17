# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Create Account" [level=1] [ref=e5]
      - paragraph [ref=e6]: Join us to discover unique handcrafted jewelry
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
          - generic [ref=e26]: Full Name
          - textbox "John Doe" [ref=e27]: New Test User
        - generic [ref=e28]:
          - generic [ref=e29]: Email
          - textbox "you@example.com" [ref=e30]: test-signup-1763356714994@example.com
        - generic [ref=e31]:
          - generic [ref=e32]: Password
          - textbox "••••••••" [ref=e33]: TestPassword123!
          - paragraph [ref=e34]: At least 6 characters
        - button "Create Account" [ref=e35]
      - paragraph [ref=e36]:
        - text: Already have an account?
        - link "Sign in" [ref=e37] [cursor=pointer]:
          - /url: /auth/signin?redirectTo=/
  - status [ref=e43]: Email address "test-signup-1763356714994@example.com" is invalid
  - button "Open Next.js Dev Tools" [ref=e49] [cursor=pointer]:
    - img [ref=e50]
  - alert [ref=e53]
```