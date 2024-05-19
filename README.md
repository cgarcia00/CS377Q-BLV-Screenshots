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

### Explortations thus far

This repo contains several ways of potentially doing the same thing. Specfically, there are 3 tasks being explored.

1. OCR Redaction
2. Accessible Screenshot Tool GUI
3. GenAI Cropping (TODO)

For OCR Redaction there is ocr_redact_easyocr.py and ocr_redact_tesseract.py. Both run similar code where users are prompted to select a kind of text to remove and then a test image. The difference is the usage of OCR engine (EasyOCR and Tesseract). EasyOCR is simplier and works a bit better but Tesseract is fast (but it requires more installs).

For the GUI there is screenshot-web-app that models a potential route using html/css/js. There is also screenshot-python-app that uses tkinter for the GUI and pyttsx3 for screen reading.

The GenAI cropping has not been explored yet but is a remaining action item.
