# Contributing to Unit Conversion Hub

Thank you for contributing to **Unit Conversion Hub**! This project is an open-source, high-precision unit converter and reference engine built by **Musfiqur Rahman Saimon**.

## How You Can Contribute

- Adding missing physical measurement categories or rare units
- Improving conversion precision or edge-case handling
- Adding automated tests under `tests/`
- Improving documentation, guides, or accessibility (WCAG 2.1 AA)

## Development Setup

```bash
git clone https://github.com/britsync07-prog/unit-conversion-hub.git
cd unit-conversion-hub
npm install
npm test
npm run dev
```

## Pull Request Guidelines

1. Fork the repository and create a descriptive branch: `git checkout -b feat/add-astronomical-units`.
2. Ensure every new unit or category has SI base unit mappings and round-trip unit tests.
3. Verify that `npm test` passes 100%.
4. Submit your pull request to the `main` branch.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). We maintain a friendly, inclusive, and professional environment.
