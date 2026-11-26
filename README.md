# Prompt Master

Prompt Master rewrites a rough, quickly typed prompt into a clear, well-structured one before you send it. Type your draft in the prompt box and a "✨ Prompt Master" button appears just above it. Click it and the draft is replaced with an improved version that keeps your intent, facts, names and code, then you review and send. An Undo button restores your original draft. The /prompt-master slash command does the same thing. Each rewrite is one small model call billed to your session.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-master --marketplace Mazmataz/prompt-master
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```bash
claude plugin install prompt-master --marketplace Mazmataz/prompt-master
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `Mazmataz/prompt-master`, then Add plugin.

If the repository is private, it installs only for people who can read it on GitHub and whose machine already has a git credential for github.com (an SSH key, or `gh auth login` then `gh auth setup-git`).
