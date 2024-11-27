const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('debugasourus.startChat', () => {
    const panel = vscode.window.createWebviewPanel(
      'chatInterface',
      'Chat Interface',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.command === 'sendMessage') {
          const userInput = message.text;

          // Call the Python script with the user's input
          const pythonProcess = spawn('python', [
            path.join(__dirname, 'openai_call.py'),
            userInput,
          ]);

          let output = '';
          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            vscode.window.showErrorMessage(`Error: ${data.toString()}`);
          });

          pythonProcess.on('close', (code) => {
            try {
              const result = JSON.parse(output);
              if (result.error) {
                vscode.window.showErrorMessage(`Error: ${result.error}`);
              } else {
                panel.webview.postMessage({ command: 'receiveMessage', text: result.response });
              }
            } catch (err) {
              vscode.window.showErrorMessage(`Error parsing response: ${err.message}`);
            }
          });
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat Interface</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; }
        .chat-window { flex-grow: 1; padding: 10px; overflow-y: auto; border: 1px solid #ddd; }
        .chat-input { display: flex; border-top: 1px solid #ddd; }
        .chat-input input { flex-grow: 1; padding: 10px; border: none; border-right: 1px solid #ddd; }
        .chat-input button { padding: 10px; border: none; background-color: #007acc; color: white; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="chat-window" id="chat-window"></div>
      <div class="chat-input">
        <input type="text" id="message-input" placeholder="Type a message..." />
        <button id="send-button">Send</button>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const chatWindow = document.getElementById('chat-window');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        sendButton.addEventListener('click', () => {
          const message = messageInput.value;
          if (message) {
            addMessageToWindow('User', message);
            vscode.postMessage({ command: 'sendMessage', text: message });
            messageInput.value = '';
          }
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message.command === 'receiveMessage') {
            addMessageToWindow('Assistant', message.text);
          }
        });

        function addMessageToWindow(sender, text) {
          const messageDiv = document.createElement('div');
          messageDiv.textContent = \`\${sender}: \${text}\`;
          chatWindow.appendChild(messageDiv);
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      </script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = { activate, deactivate };
