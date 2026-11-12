# Testing

- Never write unit tests after you write code.
- Highly prefer E2E tests as the sole testing mechanism. Use them to verify complex features work. At the end of E2E tests, produce a verifiable and repeatable artifact.
- If you must test a system in isolation, first write down all the ways it could fail, then write the code.
- Keep an isolated test only when it catches a concrete, meaningful bug that the E2E coverage misses.
- Distinguish HTTP integration coverage from browser E2E coverage. Test artifacts must state what was exercised, the result, and the exact command to reproduce it; exclude credentials and personal financial data.

