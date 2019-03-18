import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TasksTreeDataProvider implements vscode.TreeDataProvider<TaskTreeItem> {
	private sha1 = require('sha1');

	private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;

	private packageJsonPath = null;
	private commitMessagePath = null;
	private emptySettings = { lock: false, active: null, sets: { default: { source: 'default', 'name': 'Default', tasks: {} } } };

	constructor(private workspaceRoot: string) {
		if (this.workspaceRoot) {
			this.packageJsonPath = path.join(this.workspaceRoot, ".vscode", "tasks-and-contexts.json");
			this.commitMessagePath = path.join(this.workspaceRoot, ".vscode", "tasks-and-contexts-commit-msg.txt");
			this.packageJson();
		}
	}

	private packageJson() {
		if (this.pathExists(this.packageJsonPath)) {
			return JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8'));
		} else {
			const emptySettings = JSON.stringify(this.emptySettings, null, 2);
			fs.writeFileSync(this.packageJsonPath, emptySettings, { encoding: 'utf-8' });
			return JSON.parse(emptySettings);
		}
	}

	private refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	addTask(): void {
		vscode.window.showInputBox({ placeHolder: 'Enter a task name' })
			.then(taskName => {
				if (taskName !== null && taskName !== undefined) {
					var packageJson = this.packageJson();
					const taskId = this.sha1(taskName);
					if (packageJson.sets.default.tasks[taskId] == undefined) {
						packageJson.sets.default.tasks[taskId] = { 'name': taskName, data: [] };
						fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
						this.refresh();
					} else {
						vscode.window.showErrorMessage("A task with this name already exists");
					}
				}
			});
	}

	async addFromTrello() {
		/*
		"extensionTaskTreeItem": [
			"Ho-Wan.vscode-trello-viewer"
		],
		*/
		var trelloExtension = vscode.extensions.getExtension('Ho-Wan.vscode-trello-viewer');
		if (trelloExtension.isActive) {
			let trelloApi = trelloExtension.exports;
			const boards = await trelloApi.boards();
			let picks = [];
			for (var i in boards) {
				picks.push(boards[i].name);
			}
			const boardName = await vscode.window.showQuickPick(picks, { placeHolder: "Select a Trello Board" });
			if (boardName == undefined) return;
			let boardId = "";
			for (var i in boards) {
				if (boardName == boards[i].name) {
					boardId = boards[i].id;
					break;
				}
			}
			const lists = await trelloApi.lists(boardId);
			picks = [];
			for (var i in lists) {
				picks.push(lists[i].name);
			}
			const listName = await vscode.window.showQuickPick(picks, { placeHolder: "Select a Trello List" });
			if (listName == undefined) return;
			let listId = "";
			for (var i in lists) {
				if (listName == lists[i].name) {
					listId = lists[i].id;
					break;
				}
			}
			const cards = await trelloApi.cards(listId);
			if (cards != undefined) {
				const packageJson = this.packageJson();
				const set = "trello-" + listId;
				for (var i in cards) {
					if (packageJson.sets[set] == undefined)
						packageJson.sets[set] = { source: 'trello', name: boardName + " - " + listName, id: listId, tasks: {} };
					if (packageJson.sets[set].tasks[cards[i].id] == undefined) {
						packageJson.sets[set].tasks[cards[i].id] = { name: cards[i].name, data: [] };
					}
				}
				fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
				this.refresh();
			}
		}
	}

	deleteTask(task: TaskTreeItem): void {
		var packageJson = this.packageJson();
		if (packageJson.sets[task.set].type != 'default') {
			vscode.window.showErrorMessage("You can not delete this type of task");
			return;
		}

		vscode.commands.executeCommand('workbench.action.closeAllEditors');
		const taskName = task.label;
		if (packageJson) {
			if (packageJson.sets[task.set].tasks[task.id] != undefined) {
				delete packageJson.sets[task.set].tasks[task.id];
				packageJson.active = null;
				fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
				this.refresh();
			}
		}
	}

	async refreshTasks() {
		var addCount = 0;
		var delCount = 0;
		var packageJson = this.packageJson();
		if (packageJson) {
			var trelloExtension = vscode.extensions.getExtension('Ho-Wan.vscode-trello-viewer');
			for (var set in packageJson.sets) {
				if (packageJson.sets[set].source == 'trello') {
					if (trelloExtension.isActive) {
						let trelloApi = trelloExtension.exports;
						var listId = packageJson.sets[set].id;
						var cards = await trelloApi.cards(listId);
						if (cards != undefined) {
							var cardIds = [];
							for (var i in cards) {
								cardIds.push(cards[i].id);
								if (packageJson.sets[set].tasks[cards[i].id] == undefined) {
									packageJson.sets[set].tasks[cards[i].id] = { name: cards[i].name, data: [] };
									addCount++;
								}
							}
							for (var taskId in packageJson.sets[set].tasks) {
								if (cardIds.indexOf(taskId) == -1) {
									delCount++;
									delete packageJson.sets[set].tasks[taskId];
								}

							}
						}
					}
				}
			}
			fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
			this.refresh();
			vscode.window.showInformationMessage(addCount + " tasks added, " + delCount + " tasks deleted");
		}
	}

	renameEntry(task: TaskTreeItem): void {
		var packageJson = this.packageJson();
		if (packageJson.sets[task.set].type != 'default') {
			vscode.window.showErrorMessage("You can not rename this type of task");
			return;
		}

		vscode.window.showInputBox({ value: task.label })
			.then(taskName => {
				if (taskName !== null && taskName !== undefined) {
					if (taskName == task.label) {
						vscode.window.showErrorMessage("The task name was not changed");
						return;
					}

					var newTaskId = this.sha1(taskName);

					packageJson.sets[task.set].tasks[newTaskId] = packageJson.sets[task.set].tasks[task.id];
					delete packageJson.sets[task.set].tasks[task.id];
					packageJson.sets[task.set].tasks[newTaskId].name = taskName;
					fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
					this.refresh();
				}
			});
	}

	async activateTask(taskId: string) {
		if (this.pathExists(this.packageJsonPath)) {
			var packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8'));
		} else {
			var packageJson = JSON.parse(JSON.stringify(this.emptySettings));
		}
		packageJson.lock = true;
		fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		packageJson.lock = false;

		packageJson.active = taskId;
		fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
		this.refresh();
		for (var set in packageJson.sets) {
			if (packageJson.sets[set].tasks[taskId] != undefined) {
				for (var i in packageJson.sets[set].tasks[taskId].data) {
					var fileName = packageJson.sets[set].tasks[taskId].data[i];
					let doc = await vscode.workspace.openTextDocument(fileName); // calls back into the provider
					await vscode.window.showTextDocument(doc, { preview: false });
				}
				fs.writeFileSync(this.commitMessagePath, packageJson.sets[set].tasks[taskId].name, { encoding: 'utf-8' });
			}
		}
	}

	private getRealFileName(document): string {
		let fileName = document.fileName;
		const ext = fileName.split('.').pop();
		if (ext == 'git')
			fileName = fileName.substr(0, fileName.lastIndexOf("."));
		return fileName;
	}

	addDocument(document: vscode.TextDocument): void {
		const baseName = document.fileName.replace(/^.*[\\\/]/, '');
		if (document.uri.scheme == 'file') {
			const fileName = this.getRealFileName(document);
			var packageJson = this.packageJson();
			const activeTask = packageJson.active;
			for (var set in packageJson.sets) {
				if (activeTask != null && packageJson.sets[set].tasks[activeTask] != undefined && packageJson.sets[set].tasks[activeTask].data.indexOf(fileName) == -1) {
					packageJson.sets[set].tasks[activeTask].data.push(fileName);
					fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
					this.refresh();
					return;
				}
			}
		}
	}

	removeDocument(document: vscode.TextDocument): void {
		if (document.uri.scheme == 'file') {
			const fileName = this.getRealFileName(document);
			if (this.pathExists(this.packageJsonPath)) {
				var packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8'));
				if (packageJson.lock == true) return;
				const activeTask = packageJson.active;
				if (activeTask != null) {
					for (var set in packageJson.sets) {
						if (packageJson.sets[set].tasks[activeTask] != undefined) {
							var index = packageJson.sets[set].tasks[activeTask].data.indexOf(fileName);
							if (index > -1) {
								packageJson.sets[set].tasks[activeTask].data.splice(index, 1);
								fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf-8' });
								this.refresh();
								return;
							}
						}
					}
				}
			}
		}
	}

	removeDocumentFromTask(document: vscode.TextDocument) {
		if (document == undefined) document = vscode.window.activeTextEditor.document;
		vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		this.removeDocument(document);
	}

	getTreeItem(element: TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TaskTreeItem): Thenable<TaskTreeItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showWarningMessage('Tasks and Contexts needs a workspace to run');
			return Promise.resolve([]);
		}
		if (element) {
			return Promise.resolve(this.getTasksinPackageJson(element.id));
		} else {
			if (this.pathExists(this.packageJsonPath)) {
				return Promise.resolve(this.getSetsinPackageJson());
			} else {
				vscode.window.showInformationMessage('Workspace has no config file for Tasks and Contexts');
				return Promise.resolve([]);
			}
		}
	}

	private getSetsinPackageJson(): TaskTreeItem[] {
		const packageJson = this.packageJson();
		if (packageJson) {
			const toDep = (set: string): TaskTreeItem => {
				return new TaskTreeItem(packageJson.sets[set].name,
					false,
					null,
					null,
					set,
					'set',
					vscode.TreeItemCollapsibleState.Collapsed,
					null);
			}

			var deps = Object.keys(packageJson.sets).map(dep => toDep(dep));
			return deps;
		}
	}

	private getTasksinPackageJson(set: string): TaskTreeItem[] {
		const packageJson = this.packageJson();
		if (packageJson) {
			const toDep = (taskId: string, set: string): TaskTreeItem => {
				var taskName = packageJson.sets[set].tasks[taskId].name;
				if (taskId == packageJson.active) taskName = "* " + taskName;
				return new TaskTreeItem(taskName,
					taskId == packageJson.active,
					set,
					packageJson.sets[set].name,
					taskId,
					'task_' + packageJson.sets[set].source,
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'taskManager.activateTask',
						title: '',
						arguments: [taskId]
					}
				);
			}

			return Object.keys(packageJson.sets[set].tasks).map(dep => toDep(dep, set));
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class TaskTreeItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private active: boolean,
		public set: string,
		public setName: string,
		public id: string,
		public context: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.contextValue = context;
	}

	get tooltip(): string {
		return `${this.label} (${this.setName})`;
	}

	get description(): string {
		return this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'images', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'images', 'dark', 'document.svg')
	};

	contextValue = 'task';
}
