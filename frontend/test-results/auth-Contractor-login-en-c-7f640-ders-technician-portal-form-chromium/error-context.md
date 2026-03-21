# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Technician Portal" [level=1] [ref=e9]
      - paragraph [ref=e10]: DetailWash
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email
        - textbox "you@example.com" [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - link "Forgot password?" [ref=e18] [cursor=pointer]:
            - /url: /en/forgot-password?from=contractor
        - textbox "••••••••" [ref=e19]
      - button "Sign in" [ref=e20]
    - generic [ref=e21]:
      - paragraph [ref=e22]:
        - text: New technician?
        - link "Apply here" [ref=e23] [cursor=pointer]:
          - /url: /en/register?next=/en/contractors/apply
      - link "← Back to home" [ref=e24] [cursor=pointer]:
        - /url: /en
  - alert [ref=e25]
```