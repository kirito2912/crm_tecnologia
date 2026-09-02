import urllib.request
import json

url = "http://127.0.0.1:8000/api/v1/login/request-otp"
payload = {
    "email": "eduardocaballero392@gmail.com",
    "full_name": "Eduardo Caballero",
    "mode": "register",
    "company": "Nexaflow Inc"
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=15) as response:
        res = json.loads(response.read().decode("utf-8"))
        print(f"Status: {response.status}")
        print(f"Response: {res}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
