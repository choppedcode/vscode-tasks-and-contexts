# VS Code - Tasks and Contexts

<a href="https://marketplace.visualstudio.com/items?itemName=choppedcode.tasks-and-contexts" title="Go to VS marketplace">
  <img src="https://vsmarketplacebadge.apphb.com/version-short/choppedcode.vscode-tasks-and-contexts.svg">
</a>
<a href="https://github.com/choppedcode/vscode-tasks-and-contexts" title="Go to Github repo">
  <img src="https://vsmarketplacebadge.apphb.com/installs/choppedcode.vscode-tasks-and-contexts.svg">
</a>

The Tasks and Contexts extension for Visual Studio Code implements a task-focused interface.

You can create as many tasks as you want. Anytime you activate a task, the documents you open are attached to that task.

Switching from one task to another closes the current documents and opens the ones you linked to the new task.

Tasks can also be imported from your issue tracker. Currently, an integratio with Trello is provided.


## Features

### Create tasks
Create new tasks by clicking on the 'Add' button in the Tasks view.

### Switch tasks
Simply click on a task to activate it. This will close all editors.

### Delete tasks
Click on the delete icon when selecting or hovering over a task.

### Rename tasks
Click on the edit icon when selecting or hovering over a task.

### Add documents to tasks
when a task has been activated, any document opened gets added to the task context.

### Remove documents from tasks
To remove a document from a task, use the Shift+Alt+w shortcut or select 'Remove Document From Task' from the document's top bar menu.

### Import Trello cards as tasks
Select the board and list you want to import and the extension auto creates tasks for you.

## Connecting to Trello

To connect to Trello, you need to install a variant of Ho Wan's Trello Viewer extension. 
Our variant includes a change to expose the extension's Trello API.

Please following these steps:
- Download the vsix file [here](https://github.com/choppedcode/vscode-tasks-and-contexts)
- In VS Code, cmd+shift+p
- Search for "Extensions: Install from VSIX

Connect to Trello as per the instructions included in the Trello Viewer extension.

## Git commit messages

Whenever you switch tasks, the extension writes the task name into the file .vscode/tasks-and-contexts-commit-msg.txt

To have your git commit messages pre-filled with the task name, following these instructions.

### Create a pre-commit-message Git hook
Create a file .git/hooks/prepare-commit-msg with the following contents:

```
#!/bin/bash

if [[ -f .vscode/tasks-and-contexts-commit-msg.txt ]]; then
        cat .vscode/tasks-and-contexts-commit-msg.txt > $1
fi
```

### Make the pre-commit-message executable
Run the following command:

```
chmod +x .git/hooks/prepare-commit-msg
```

### Commit via the terminal
Unfortunately, VS Code doesn't run the prepare-commit-msg hook so you need to run `git commit` via the terminal.
Once you've activated a task and you run `git commit` it should pre-fill with the task name.

## Extension Settings

There are currently no settings defined.

## Release Notes

See CHANGELOG.md
