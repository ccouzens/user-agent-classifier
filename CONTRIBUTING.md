# Contributing

## Reporting problems and code changes

If you run into a bug, missing feature, or edge case, the best first step is to
open a [GitHub issue](https://github.com/ccouzens/user-agent-classifier/issues)
describing the problem.

AI-assisted work is welcome, though my preference is usually to make code
changes myself (possibly with my own robot) as robot assisted work is often hard
to review. Opening an issue to describe the problem first helps avoid wasted
effort.

## Contributing misclassification examples

Focused examples of a `User-Agent` string that was misclassified are useful.
When sharing an example, please include:

- The `User-Agent` string
- What classification you expected vs. what `user-agent-classifier` produced
- When the `User-Agent` was observed

## Contributing observed User-Agent datasets

Real-world `User-Agent` samples are valuable for keeping classification rules
accurate as browsers and bots evolve. If you are happy for the dataset to be
widely shared, attach or paste it in a
[GitHub issue](https://github.com/ccouzens/user-agent-classifier/issues).
Otherwise, open an issue to let me know and I will get in touch and keep the
data private.

- **Format**: A CSV of `User-Agent` strings and counts is best (for example,
  `user_agent,count`).
- **Source and date**: If you are allowed to share it, include where the data
  came from and the approximate date window or day it was collected. This makes
  it possible to expire old entries years from now.
- **Audience**: A short description of the site's users (for example, consumers
  in Brazil or office workers in India).
- **Anonymising traffic volume**: You can anonymise how much traffic your site
  receives by omitting the length of the collection window and only sharing
  which day it is from.
- **Privacy and redactions**: Some browsers and in-app WebViews (for example,
  Instagram) include a large amount of device or environment detail in their
  `User-Agent` strings. If you remove any rows or apply substitutions for the
  anonymity of your users, please mention what was removed or substituted so the
  data is not misinterpreted.
