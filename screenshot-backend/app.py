import os
import re
import cv2
import pytesseract
import numpy as np
from flask import Flask, request, jsonify, send_file
from PIL import Image
import io
import base64
import openai
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Enables CORS

# Set up OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai.OpenAI()

# Define a regular expression pattern for phone numbers, SSN, emails, and numbers
phone_pattern = re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
ssn_pattern = re.compile(r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b')
email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
number_pattern = re.compile(r'\b\d+\b')

patterns = {
    'phone': phone_pattern,
    'ssn': ssn_pattern,
    'email': email_pattern,
    'numbers': number_pattern
}

# Endpoint for image redaction
@app.route('/redact', methods=['POST'])
def redact_image():
    if 'image' not in request.files or 'category' not in request.form:
        return jsonify({'error': 'No image or category provided'}), 400

    image_file = request.files['image']
    category = request.form['category']

    if category not in patterns:
        return jsonify({'error': 'Invalid category'}), 400

    pattern = patterns[category]

    # Read the image from the uploaded file
    image = Image.open(image_file)
    image_np = np.array(image)
    
    # Ensure the image is in 8-bit 3-channel format
    if image_np.dtype != np.uint8:
        image_np = image_np.astype(np.uint8)
    
    if len(image_np.shape) == 2:  # If grayscale, convert to color
        image_np = cv2.cvtColor(image_np, cv2.COLOR_GRAY2RGB)
    elif image_np.shape[2] == 4:  # If RGBA, convert to RGB
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
    
    # Convert the image to grayscale for OCR
    gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
    
    # Perform OCR using Tesseract
    custom_config = r'--oem 3 --psm 6'
    ocr_result = pytesseract.image_to_data(gray, config=custom_config, output_type=pytesseract.Output.DICT)
    
    # Create a mask for the detected text
    mask = np.zeros(image_np.shape[:2], dtype=np.uint8)
    
    # Iterate over each text element and make masks
    for i in range(len(ocr_result['text'])):
        text = ocr_result['text'][i]
        if pattern.match(text):
            (x, y, w, h) = (ocr_result['left'][i], ocr_result['top'][i], ocr_result['width'][i], ocr_result['height'][i])
            cv2.rectangle(mask, (x, y), (x + w, y + h), (255), -1)
            # Draw a rectangle outline for visualization
            cv2.rectangle(image_np, (x, y), (x + w, y + h), (0, 255, 0), 2)  # Green color outline
    
    # Ensure the mask is in the correct format
    if mask.dtype != np.uint8:
        mask = mask.astype(np.uint8)

    # Inpaint the image using the mask
    inpainted_image = cv2.inpaint(image_np, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    
    # Convert the inpainted image from BGR to RGB
    # inpainted_image_rgb = cv2.cvtColor(inpainted_image, cv2.COLOR_BGR2RGB)
    
    # Convert the inpainted image to a format suitable for sending back to the client
    inpainted_image_pil = Image.fromarray(inpainted_image)
    byte_io = io.BytesIO()
    inpainted_image_pil.save(byte_io, format='JPEG')
    byte_io.seek(0)
    
    return send_file(byte_io, mimetype='image/jpeg')

# Endpoint to ask questions about an image
@app.route('/chat', methods=['POST'])
def chat():
    if 'image' not in request.files or 'message' not in request.form:
        return jsonify({'error': 'No image or message provided'}), 400

    image_file = request.files['image']
    user_message = request.form['message']

    # Convert the image to RGB if it's in RGBA mode
    image = Image.open(image_file)
    if image.mode == 'RGBA':
        image = image.convert('RGB')

    # Resize the image to reduce the size
    max_size = (500, 500)
    image.thumbnail(max_size, Image.LANCZOS)
    
    # Convert the image to base64 for the prompt
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    base64_image = base64.b64encode(buffered.getvalue()).decode()

    prompt = f"User message: {user_message}\nImage base64: {base64_image}"

    try:
        # OpenAI API call
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
            # Temperature set low for determinism
            temperature=0.0,
        )
        return jsonify({'message': response.choices[0].message.content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# API endpoint for identifying windows
@app.route('/identify_windows', methods=['POST'])
def identify_windows():
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    image_file = request.files['image']

    # Convert the image to RGB if it's in RGBA mode
    image = Image.open(image_file)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Convert the image to base64 for the prompt
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    base64_image = base64.b64encode(buffered.getvalue()).decode()

    response = identify_windows(base64_image)
    if 'error' in response:
        return jsonify(response), 500
    
    return jsonify(response)

# API endpoint for cropping windows
@app.route('/crop_window', methods=['POST'])
def crop_window():
    if 'image' not in request.files or 'window' not in request.form:
        return jsonify({'error': 'No image or window provided'}), 400

    image_file = request.files['image']
    window = request.form['window']

    # Convert the image to RGB if it's in RGBA mode
    image = Image.open(image_file)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Convert the image to base64 for the prompt
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    base64_image = base64.b64encode(buffered.getvalue()).decode()

    # Call crop_browser_window
    cropped_image = crop_browser_window(base64_image, image_file, window)

    # Convert to a format suitable for sending back to the client
    if cropped_image.mode == 'RGBA':
        cropped_image = cropped_image.convert('RGB')

    byte_io = io.BytesIO()
    cropped_image.save(byte_io, format='JPEG')
    byte_io.seek(0)
    
    return send_file(byte_io, mimetype='image/jpeg')

# Helper functions

# Helper function that returns a cropped image containing only the window specificed in the window variable
def crop_browser_window(image_data, image_file, window):
    with Image.open(image_file) as img:
        width, height = img.size

    prompt = f"""
    I have an image with dimensions {width}x{height}. 
    Please provide the coordinates to crop this image to only contain the {window}. 
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
    coordinates = json.loads(response_string)
    left, top, right, bottom = coordinates["left"], coordinates["top"], coordinates["right"], coordinates["bottom"]

    with Image.open(image_file) as img:
        cropped_img = img.crop((left, top, right, bottom))
        
        return cropped_img

# Helper function for the identify windows endpoint that returns a json with an attribute called "windows" that has a list of window names
def identify_windows(image_data):

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

if __name__ == '__main__':
    app.run(debug=True)
