# CS377Q-BLV-Screenshots

A screenshot tool for blind and low vision individuals.

## Installing OCR Redaction Tool

Install required packages

```
pip install -r requirements.txt
```

Install Tesseract OCR engine (only for the Tesseract version in ocr_redact_tesseract.py)

On Mac

```
brew install tesseract
```

On Windows follow these [instructions](https://github.com/UB-Mannheim/tesseract/wiki)

### Web App

There is a work in progress web app that can perform image redaction and let a user query an image.

**screenshot-web-app** contains an html/css/js web app that can take a screenshot or local image file. Then you can redact information from that image or ask questions about it to gpt.

The webpage is still very raw and there is some screen reader accessibility that is being worked on.

**screenshot-backend** contains a Flask backend that uses Python that takes API calls to redact information from images as well as respond to questions about an image.

To run the web app:

1. ensure that you set the **OPENAI_API_KEY** environment variable to your OpenAI key.
2. Run `python app.py` within the **screenshot-backend** folder.
3. Open **screenshot-web-app/index.html** in your favorite browser (Testing has only happened in Chrome)

### Experiments thus far

This repo contains several ways of potentially doing the same thing. Specfically, there are 3 tasks being explored.

1. OCR Redaction
2. Accessible Screenshot Tool GUI
3. GenAI Cropping

For OCR Redaction there is **ocr_redact_easyocr.py** and **ocr_redact_tesseract.py**. Both run similar code where users are prompted to select a kind of text to remove and then a test image. The difference is the usage of OCR engine (EasyOCR and Tesseract). EasyOCR is simplier and Tesseract is fast and can be better but it requires more installs.

For the GUI there is **screenshot-web-app** that models a potential route using html/css/js.

For cropping there is the crop folder. **crop_window.py** shows an example of how to use gpt-4o to crop a screenshot to a specfic window. **identify_windows.py** uses gpt to generate a list of windows.
