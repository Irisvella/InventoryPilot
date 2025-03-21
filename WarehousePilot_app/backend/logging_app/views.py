from django.shortcuts import render
from rest_framework.response import Response
import logging
import json

# THE PURPOSE OF THIS FILE IS TO HELP ADD LOGGING TO YOUR BACKEND:

# 1. IMPORT THE LOGGING LIBRARY TO YOUR FILE
import logging

# 2. FETCH THE LOGGER FROM SETTINGS.PY FILE
logger = logging.getLogger('WarehousePilot_app')

# WHEN LOGGING, CHOOSE TO LOG BASED ON THE SEVERITY:
"""
    info: use for writing debugging messages that you want to print to the terminal (ie. instead of print statements to the terminal)
          OR
          use for writing actions that have occurred like successful states (ie. login successful)
    warning: use for if something may go wrong, but no error has occurred
    error: use for writing error messages
    critical: use for when a crtitical issue occurs (something that could take the product down)
"""
# 3. WRITE YOUR LOG MESSAGE AND CHOOSE THE CORRECT SEVERITY BASED ON THE COMMENT ABOVE
def logging_example_view(request):
    try:
        # view logic being done
        logger.info("An action has occurred successfully") # INFO LEVEL LOG
        return Response({"message": "Success"})
    except Exception as e:
        logger.error("An error occurred: %s", str(e), exc_info=True) # LOGGING AN ERROR
        return Response({"message": "Error"}, status=500)
    

# -------------------------------------------------------------------------------
#  BELOW THIS POINT IS A LOGGING API TO SEND LOGS FROM FRONTEND BACK INTO DJANGO
# -------------------------------------------------------------------------------

# Backend API to pass log messages from frontend to Django
def logs_from_frontend(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        level = data.get('level', 'info').lower()
        message = data.get('message', '')
        logger = logging.getLogger('WarehousePilot_app')

        if level == 'debug':
            logger.info(message)
        elif level == 'warning':
            logger.warning(message)
        elif level == 'error':
            logger.error(message)
        elif level == 'critical':
            logger.critical(message)       
        else:
            logger.info(message)