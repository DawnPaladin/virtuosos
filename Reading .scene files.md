# Scenes and passages

Scenes are divided into passages by `===` fences.

## Name

A passage may start with a name. This goes right after the fence and ends with a colon, like this:

```
===
Angel description:
```

You can put a `!` before a name to indicate to the user that going to this passage will move the story along, so if they want to explore the conversation further they should save this for last.

## Choices

At the end of a passage, you have a `---` marker and a group of choices, like this:

```
---
> "Who are you?" = Who
> "What are you?": Cherubim = What
> "What the &#$!?"
```

A choice that starts with `> ` is a new choice. It will have a **name** (some text for the main character to say or do).

By default, the name and **target** of a choice are the same, but you can specify a different target using a `:`.

Sometimes you want to reuse a choice. You an do that using `=`. Whatever you put after the `=` becomes the choice's new **shortcut**. You can put that on a line by itself anywhere in the scene to make the choice show up again.

### Conditional choices

These choices won't show up for the user unless they meet the requirements. For now the only one is `?saw all of`:

```
?saw all of ["Who are you?", "Cherubim"]: "Power?": "Why are you here?"
```

This choice is named "Power?", targets "Why are you here?", and will only appear if the player has visited both "Who are you?" and "Cherubim?"

### Changing traits

Some choices change the people who make them. Denote this like so:

```
> Stand boldly (Bold +1 Heart +1)
```

If the trait doesn't already exist, it will be initialized at 0. All trait changes are logged to the console.
