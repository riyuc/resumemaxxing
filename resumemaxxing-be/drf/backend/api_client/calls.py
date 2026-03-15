import requests

endpoint = "http://localhost:8000/api/"

get_response = requests.post(
    url=endpoint, 
    json={"product_id" : "123"}
)

print(get_response.json())