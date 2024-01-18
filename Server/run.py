from flask import Flask
from flask_cors import CORS
from routes.api.api_routes import api_routes
from routes.webapp.web_routes import webapp_blueprint
import os

build_dir = "C:/Users/User/Desktop/תכנות/davidson/project/DavidsonProject/WebApp/steps/build"

app = Flask(__name__, static_url_path='', static_folder=build_dir)
CORS(app)

app.register_blueprint(webapp_blueprint)
app.register_blueprint(api_routes)

if __name__ == '__main__':
    app.run(use_reloader=True, port=8000, threaded=True)
