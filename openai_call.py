import os
import sys
from openai import OpenAI
from dotenv import load_dotenv
import json

# Load the API key from the .env file
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def fetch_json_data(file_name):
    try:
        current_directory = os.path.dirname(__file__)
        file_path = os.path.join(current_directory, file_name)

        with open(file_path, 'r') as json_file:
            data = json.load(json_file)

        return data
    except Exception as e:
        return {"error": str(e)}

def create_message(system_prompt, user_message):
    return system_prompt + user_message

def call_chatgpt(client, prompt):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="gpt-3.5-turbo",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # Accept user input from command-line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    user_input = sys.argv[1]

    # Load system prompts
    system_prompts = fetch_json_data("system_prompts.json")

    # Step 1: Semantic check
    semantic_message = create_message(system_prompts["system_prompts"]["semantic_check"], user_input)
    gpt_response = call_chatgpt(client, semantic_message)

    # Step 2: Branch based on GPT's response
    if gpt_response == "CODE":
        branch_message = create_message(system_prompts["system_prompts"]["code_finish"], user_input)
    elif gpt_response == "GIT":
        branch_message = create_message(system_prompts["system_prompts"]["git_help"], user_input)
    else:
        print(json.dumps({"error": "Invalid GPT response"}))
        sys.exit(1)

    final_response = call_chatgpt(client, branch_message)
    print(json.dumps({"response": final_response}))
