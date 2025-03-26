# Qrosity

A Django-based web application.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows (Command Prompt):
     ```
     .\venv\Scripts\activate
     ```
   - Windows (PowerShell):
     ```
     .\venv\Scripts\Activate.ps1
     ```
   - Linux/Mac:
     ```
     source venv/bin/activate
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Start the development server:
   ```
   python manage.py runserver
   ```

Visit http://localhost:8000 to see the application running.

## VS Code Development

1. Open the project in VS Code
2. Open VS Code's integrated terminal (View -> Terminal)
3. Activate the virtual environment:
   ```
   .\venv\Scripts\activate
   ```
4. Run the development server:
   ```
   python manage.py runserver
   ```

The server will start at http://localhost:8000

## Development Tips

### Updating Requirements
After installing new packages, update requirements.txt with:
```
pip freeze > requirements.txt
```
This will save the exact versions of all installed packages.
