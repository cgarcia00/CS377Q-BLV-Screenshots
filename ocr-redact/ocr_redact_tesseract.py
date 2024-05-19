import cv2
import pytesseract
import numpy as np
import re
from PIL import Image
import os

# Define a regular expression pattern for phone numbers, ssn, and emails
phone_pattern = re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
ssn_pattern = re.compile(r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b')
email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
number_pattern = re.compile(r'\b\d+\b')

# Helper Function

def get_user_choice():
    print("Choose the type of pattern to remove:")
    print("1. Phone Number")
    print("2. SSN")
    print("3. Email")
    print("4. Numbers")
    choice = input("Enter your choice (1/2/3/4): ")
    return choice

def get_image_choice():
    print("\nAvailable images in the 'test_images' folder:")
    images = [f for f in os.listdir('test_images') if os.path.isfile(os.path.join('test_images', f))]
    for idx, img in enumerate(images):
        print(f"{idx + 1}. {img}")
    img_choice = int(input("Enter the number of the image you want to process: ")) - 1
    return os.path.join('test_images', images[img_choice])

# Get user input
choice = get_user_choice()
image_path = get_image_choice()

# Set the chosen pattern
if choice == '1':
    pattern = phone_pattern
elif choice == '2':
    pattern = ssn_pattern
elif choice == '3':
    pattern = email_pattern
elif choice == '4':
    pattern = number_pattern
else:
    print("Invalid choice")
    exit()

# Set the Tesseract executable path if needed (for Windows users)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Load the image
image = cv2.imread(image_path)

# Convert the image to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Perform OCR using Tesseract
custom_config = r'--oem 3 --psm 6'
ocr_result = pytesseract.image_to_data(gray, config=custom_config, output_type=pytesseract.Output.DICT)

# Create a mask for the detected text
mask = np.zeros(image.shape[:2], dtype=np.uint8)

# Iterate over each detected text element
for i in range(len(ocr_result['text'])):
    text = ocr_result['text'][i]
    if pattern.match(text):
        (x, y, w, h) = (ocr_result['left'][i], ocr_result['top'][i], ocr_result['width'][i], ocr_result['height'][i])
        cv2.rectangle(mask, (x, y), (x + w, y + h), (255), -1)
        # Draw a rectangle outline for visualization
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)  # Green color outline

# Inpaint the image using the mask
inpainted_image = cv2.inpaint(image, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

# Save the result
result_path = 'inpainted_image.jpg'
cv2.imwrite(result_path, inpainted_image)

# Display the mask and the inpainted image
cv2.imshow('Mask with Outline', image)  # Image with outline
cv2.imshow('Inpainted Image', inpainted_image)  # Inpainted image
cv2.waitKey(0)
cv2.destroyAllWindows()
