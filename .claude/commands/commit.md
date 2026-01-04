---
name: commit
description: Generate commit message and commit
---

请执行以下步骤：

1. 执行 `git status` 和 `git diff` 查看变更
2. 分析变更内容，生成符合 Conventional Commits 规范的 commit message
3. 格式：`type(scope): description`
      - type: FEAT/FIX/REFACTOR/DOCS/TEST
      - 描述需要清楚说明「做了什么」以及「为什么」，并且用中文
4. 直接执行 commit，不需要通过我确认 message。
5. 输出提交的 message
