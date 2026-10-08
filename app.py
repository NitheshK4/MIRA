from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)


@app.route("/")
def home():
    return """
    <h1>Python Web Application</h1>
    <p>Docker container is running successfully!</p>
    """


@app.route("/status")
def status():
    return jsonify({
        "status": "running",
        "language": "Python",
        "framework": "Flask"
    })


@app.route("/scrape")
def scrape():
    url = "https://example.com"

    response = requests.get(url)

    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.title.text

    return jsonify({
        "website": url,
        "title": title
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )
