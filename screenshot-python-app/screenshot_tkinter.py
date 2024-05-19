import tkinter as tk
from tkinter import Button, Text, Label
from PIL import Image, ImageGrab, ImageTk
import requests
import json
import base64
import pyttsx3

# Initialize the pyttsx3 engine
engine = pyttsx3.init()

def speak(text):
    engine.say(text)
    engine.runAndWait()

def on_focus_in(event):
    widget = event.widget
    if isinstance(widget, Button):
        speak(f"Button: {widget.cget('text')}")
    elif isinstance(widget, Text):
        if widget == text_input:
            speak("Text input area")
        elif widget == text_output:
            speak("Text output area")

def take_screenshot():
    speak("Taking screenshot")
    
    # Hide the window
    root.withdraw()
    root.update()  # Ensure the window is hidden before the screenshot is taken
    
    # Capture the screen
    screenshot = ImageGrab.grab()
    screenshot.save('screenshot.png')
    
    # Show the window again
    root.deiconify()
    speak("Screenshot taken and saved")

    # Display the screenshot
    display_screenshot(screenshot)

def display_screenshot(screenshot):
    screenshot = screenshot.resize((400, 300), Image.LANCZOS)
    screenshot_tk = ImageTk.PhotoImage(screenshot)
    screenshot_label.config(image=screenshot_tk)
    screenshot_label.image = screenshot_tk

def query_gpt(text):
    api_key = None # ENTER API KEY HERE
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "gpt-4-turbo",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{text}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{get_image()}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 300
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
    return response.json()["choices"][0]["message"]["content"]

def send_query():
    query = text_input.get("1.0", "end-1c")
    speak("Sending query to GPT-4")
    response = query_gpt(query)
    text_output.config(state='normal')
    text_output.delete("1.0", "end")
    text_output.insert("end", response)
    text_output.config(state='disabled')
    speak("Response received and displayed")

# Helper Functions

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def get_image():
    # Path to image
    image_path = "./screenshot.png"
    # Getting base64 string
    return encode_image(image_path)

# Create the main window
root = tk.Tk()
root.title("Screenshot Tool")

# Add a button to take a screenshot
screenshot_button = Button(root, text="Take Screenshot", command=take_screenshot)
screenshot_button.pack()

# Text input for the chatbot
text_input = Text(root, height=10, width=100)
text_input.pack()

# Button to send chatbot query
send_button = Button(root, text="Send Query", command=send_query)
send_button.pack()

# Text output for chatbot responses
text_output = Text(root, state='disabled', height=20, width=100)
text_output.pack()

# Label to display the screenshot
screenshot_label = Label(root)
screenshot_label.pack()

# Bind focus in events to the widgets
screenshot_button.bind("<FocusIn>", on_focus_in)
text_input.bind("<FocusIn>", on_focus_in)
send_button.bind("<FocusIn>", on_focus_in)
text_output.bind("<FocusIn>", on_focus_in)

# Bind Enter key to the focused widget
def on_key_press(event):
    widget = root.focus_get()
    if isinstance(widget, Button):
        widget.invoke()

root.bind("<Return>", on_key_press)

# Announce the application start
speak("Screenshot tool started. Use the buttons to take a screenshot or send a query.")

root.mainloop()