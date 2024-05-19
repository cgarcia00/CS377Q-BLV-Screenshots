import sys
import base64
from dotenv import load_dotenv
import os
import requests

load_dotenv()

# Replace with your OpenAI API key
api_key = os.environ.get("OPENAI_API_KEY")

def read_image(image_path):
    """Read the image file and return its binary content."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
    

def send_image_to_openai(image_data):

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    data = {
        "model": "gpt-4-turbo",  # Specify the model
        "messages": [
            {"role": "system", 
             "content": [
                {
                "type": "text",
                "text": "The following is a base64-encoded image. Please analyze it and answer the question: How many windows are present in this screenshot? List the windows you identify."
                },
                {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_data}"
                }
                }
            ]},
        ], 
        "max_tokens": 300  # Specify the maximum number of tokens to generate
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    image_data = read_image(image_path)
    
    response = send_image_to_openai(image_data)
    
    if response:
        print(response)










