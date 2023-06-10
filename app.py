from flask import Flask, render_template, jsonify, request, make_response
from flask_cors import CORS
from livereload import Server
from flask import session
import requests
import os
import json


app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "*"}})  # Set origins to allow all origins
CORS(app)


gen = f"{os.urandom(16)}"
app.secret_key = b"123456"


@app.route("/parks")
def parks():
    user_boundary = session.get("user_boundary")
    session["user_boundary"] = session.get("user_boundary")
    print(f"parks::  user_boundary={user_boundary}")
    return render_template("parks.html")


@app.route("/login")
def login():
    # user_boundary = session.get('user_boundary')
    # print(f"login::  user_boundary={user_boundary}")
    return render_template("login.html")


# Serve as proxy to prevent CORS error
@app.route("/send_login_request", methods=["GET", "POST"])
def send_login_request():
    request_body = json.loads(request.get_data(as_text=True))
    email = request_body["email"]

    # json.loads(request.get_data(as_text=True))['email']

    url = "http://localhost:8084/superapp/users/login/2023b.ben.el.shervi/" + email

    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
    }

    response = requests.get(url=url, headers=headers)

    # return response
    return response.json()


@app.route("/send_register_request", methods=["GET", "POST"])
def send_register_request():
    request_body = json.loads(request.get_data(as_text=True))
    json_paylod = json.dumps(request_body)
    url = "http://localhost:8084/superapp/users"
    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
    }

    response = requests.post(url=url, headers=headers,data=json_paylod)
    return response.json()


@app.route("/register")
def register():
    new_user_boundary = ":: CHANGES BY /change_user_boundary ::"

    session["user_boundary"] = new_user_boundary

    print(f"register::  session['user_boundary']={session['user_boundary']}")

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"user_boundary": new_user_boundary})
    else:
        return render_template("register.html", user_boundary=new_user_boundary)


@app.route("/change_user_boundary")
def change_user_boundary():
    new_user_boundary = ":: CHANGES BY /change_user_boundary ::"

    session["user_boundary"] = new_user_boundary
    return jsonify(new_user_boundary)


@app.route("/get_user_boundary")
def get_user_boundary():
    user_boundary = session.get("user_boundary")
    return jsonify(user_boundary=user_boundary)


@app.route("/")
def index():
    return render_template("home_page.html")

# @app.route("/send_get_parks_request", methods=["GET", "POST"])
# def send_get_parks_request():
#     request_body = json.loads(request.get_data(as_text=True))
#     json_paylod = json.dumps(request_body)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=6002)
    # app.run(host="127.0.0.1", port=6002, debug=True)
