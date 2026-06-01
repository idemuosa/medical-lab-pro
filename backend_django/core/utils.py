import requests

def send_notification(message, notification_type="info"):
    """
    Sends a notification to the Node.js socket server.
    """
    socket_url = "http://localhost:4000/trigger"
    payload = {
        "message": message,
        "type": notification_type
    }
    try:
        response = requests.post(socket_url, json=payload, timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"Failed to send notification: {e}")
        return False
