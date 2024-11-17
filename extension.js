// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')

const { checkGitErrors } = require('./features/gitError');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate (context) {
  console.log('Congratulations, your extension "debugasourus" is now active!')

  const disposable = vscode.commands.registerCommand(
    'debugasourus.helloWorld',
    function () {
      console.log('WE CALLED')
      vscode.window.showWarningMessage('Hello World from debugasourus!')
    }
  )

  const gitErrorCheck = vscode.commands.registerCommand(
    'debugasourus.checkGitErrors',
    async function () {
      await checkGitErrors()
    }
  )

  const provider1 = vscode.languages.registerCompletionItemProvider(
    '*',
    {
      provideCompletionItems (document, position) {
        const linePrefix = document
          .lineAt(position)
          .text.slice(0, position.character)

        //   this only works when console. is detected
        if (!linePrefix.endsWith('console.')) {
          return undefined
        }

        // lets just see what the extension can see
        console.log(document.getText())

        return [
          new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
          new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
          new vscode.CompletionItem('error', vscode.CompletionItemKind.Method)
        ]
      }
    },
    '.' // triggered whenever a '.' is being typed
  )

  context.subscriptions.push(provider1, disposable, gitErrorCheck)
}

// This method is called when your extension is deactivated
function deactivate () {}

module.exports = {
  activate,
  deactivate
}
