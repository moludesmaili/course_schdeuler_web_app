import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Get Desktop Path
desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "comments.json")

# Ensure the file exists
if not os.path.exists(desktop_path):
    with open(desktop_path, "w") as f:
        json.dump([], f)  # Initialize with an empty list

# Function to load comments from the file
def load_comments():
    with open(desktop_path, "r") as f:
        return json.load(f)

# Function to save comments to the file
def save_comment(username, comment):
    comments = load_comments()
    comments.append({"username": username, "comment": comment})

    with open(desktop_path, "w") as f:
        json.dump(comments, f, indent=4)

# API to get all comments
@app.route('/get_comments', methods=['GET'])
def get_comments():
    return jsonify(load_comments())

# API to add a new comment
@app.route('/add_comment', methods=['POST'])
def add_comment():
    data = request.json
    username = data.get("username")
    comment = data.get("comment")

    if not username or not comment:
        return jsonify({"error": "Both username and comment are required"}), 400

    save_comment(username, comment)
    return jsonify({"message": "Comment saved successfully!"}), 201

if __name__ == '__main__':
    app.run(debug=True)
