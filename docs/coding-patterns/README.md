# Coding Patterns

This folder documents patterns defined during the development of this application.

A coding pattern is some structural guide about how to achieve some functionality. They can apply to both the frontend 
and backend. 

A pattern doesn't necessarily fit for every use-case and may be challenged in the future. As long as 
there are no reasons against it, it should be enforced as documented. 

These patterns ensure maintainability through similar approaches and can keep code clean. 

## Introducing new coding patterns

A new pattern should be documented every time something was done in a similar way or was noted multiple times during a 
code review. 

Follow this process to add the new pattern: 
- Write down the pattern in a new Markdown file in this directory 
  - Concentrate on the how and why 
  - Try to keep example code minimal and prefer linking to real implementations
- Add the pattern to [.coderabbit.yml](../../.coderabbit.yml)
- Think about whether a second factor could help enforcing the new pattern 
  - Custom Linting Rule 
  - Unit Test
