from flask import Flask
from flask_cors import CORS
from routes.api.api_routes import api_routes
from routes.webapp.web_routes import webapp_blueprint

class MyFlaskApp:
    def __init__(self, build_dir, port=8000):
        self.app = Flask(__name__, static_url_path='', static_folder=build_dir)
        CORS(self.app)

        self.app.register_blueprint(webapp_blueprint)
        self.app.register_blueprint(api_routes)

        self.port = port

    def run(self):
        self.app.run(use_reloader=True, port=self.port, threaded=True, debug=True)

if __name__ == '__main__':
    build_dir = "C:/Users/User/Desktop/תכנות/davidson/project/DavidsonProject/WebApp/steps/build"
    my_app = MyFlaskApp(build_dir)
    my_app.run()
