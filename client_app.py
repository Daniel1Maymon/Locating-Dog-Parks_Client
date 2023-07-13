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

    variable = session.get('variable')
    print(f':: parks ENDPOINT:: variable={variable}')
    return render_template("parks.html", variable=variable)


@app.route("/login")
def login():
    variable_value = 'example'
    session['variable'] = variable_value
    
    variable = session.get('variable')
    print(f':: login:: variable={variable}')
    
    return render_template("login.html", variable=variable_value)

@app.route("/update_variable", methods=["POST"])
def update_variable():
    print(":: inside update_variable :: ")
    request_body = json.loads(request.get_data(as_text=True))
    
    new_variable_value = request_body['userBoundary']
    session['variable'] = new_variable_value
    print(f":: update_variable ENDPOINT:: {session.get('variable')}")
    return jsonify({'msg':'Variable updated successfully'})


@app.route('/update_user_role', methods=["POST"])
def update_user_role():
    request_body = json.loads(request.get_data(as_text=True))
    user_boundary = json.loads(request_body['userBoundary'].replace("'", "\""))
    
    role = request_body['role']
    userEmail = user_boundary['userId']['email']
    
    url = 'http://localhost:8084/superapp/users/2023b.ben.el.shervi/' + userEmail  + '3'
    
    body_to_send ={
        "role": role
    }
    
    json_paylod = json.dumps(body_to_send)
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
    }
    
    response = requests.put(url=url, headers=headers, data=json_paylod)
    print(f":: /update_user_role :: response = {response}")
    return response.text
    

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
    url = "http://localhost:8080/users/"
    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
    }

    response = requests.post(url=url, headers=headers,data=json_paylod)
    return jsonify(response.json())


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
    variable = session.get('variable')
    
    if variable:
        print(f':: index:: variable={variable}')
    else:
        # Variable not found in the session
        print('Variable not available')
    
    return render_template("home_page.html")

@app.route("/send_get_parks_request", methods=["GET", "POST"])
def send_get_parks_request():
    request_body = json.loads(request.get_data(as_text=True))
    json_paylod = json.dumps(request_body)

    url = 'http://localhost:8084/superapp/miniapp/locatingDogParks'
    headers = {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
    }

    response = requests.post(url=url, headers=headers,data=json_paylod)
    return response.json()
    

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=6002)
    
