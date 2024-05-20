import openai
import os
import base64
import json
from PIL import Image

# Set up your OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai.OpenAI()

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def crop_browser_window(image_path, output_path):
    base64_image = encode_image(image_path)
    with Image.open(image_path) as img:
        width, height = img.size

    prompt = f"""
    I have an image with dimensions {width}x{height}. 
    Please provide the coordinates to crop this image to only contain the browser window. 
    Format the response as 'left, top, right, bottom' in json and say nothing else.
    """

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
                        "url": f"data:image/png;base64,{base64_image}",
                    },
                },
            ],
            }
        ],
        temperature=0.0,
    )
    coordinates = json.loads(response.choices[0].message.content[7:-3])
    left, top, right, bottom = coordinates["left"], coordinates["top"], coordinates["right"], coordinates["bottom"]

    with Image.open(image_path) as img:
        cropped_img = img.crop((left, top, right, bottom))
        
        # Save the cropped image
        cropped_img.save(output_path)
        print(f"Cropped image saved to {output_path}")

crop_browser_window('screenshot.png', 'cropped_browser.png')