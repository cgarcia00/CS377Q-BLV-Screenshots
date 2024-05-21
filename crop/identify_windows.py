import sys
import base64
from dotenv import load_dotenv
import os
import openai
import json

load_dotenv()

# Set up OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai.OpenAI()

def read_image(image_path):
    """Read the image file and return its binary content."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
    

def send_image_to_openai(image_data):

    prompt = 'Based on this image of a desktop screen return a json with brief 1-5 word descriptions of each open window. I want the format {"windows": [list of windows]}.Return nothing but the json.'

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{prompt}"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_data}",
                        },
                    },
                ],
                }
            ],
            temperature=0.0,
        )
        response_string = response.choices[0].message.content
        response_string = response_string[response_string.index("{"):response_string.rindex("}")+1]
        return response_string
    except Exception as e:
        return {'error': str(e)}, 500

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    image_data = read_image(image_path)
    
    response = send_image_to_openai(image_data)
    
    if response:
        print(response)










