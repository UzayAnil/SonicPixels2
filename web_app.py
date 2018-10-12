from flask import Flask, flash, url_for, render_template, request, redirect, make_response, Response, jsonify
from flask_socketio import SocketIO
from pythonosc import osc_message_builder
from pythonosc import udp_client

import json

import datetime

from pymongo import MongoClient

import datetime

import os

client = udp_client.SimpleUDPClient("127.0.0.1", 8000)

MONGO_URL = os.environ.get('MONGO_URL')

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['SonicPixels']
COMPOSITIONS = DB['compositions']

ALLOWED_KEY = os.environ.get('API_KEY')

APP = Flask(__name__)
 
APP.secret_key = os.environ.get('SECRET_KEY')

SOCKETIO = SocketIO(APP)

@APP.route('/')
def index():
    return render_template('index.html')

@APP.route('/test')
def test_page():
    return render_template('test.html')

@APP.route('/save-composition', methods=['POST'])
def save_composition():
    incoming = request.get_json()
    COMPOSITIONS.insert_one(incoming)
    return jsonify(saved=True)

@APP.route('/load-composition/<name>')
def load_composition(name):
    loaded_composition = COMPOSITIONS.find_one({'name': name}, {'_id':0})
    print(loaded_composition)
    return jsonify(loaded_composition=loaded_composition)

@SOCKETIO.on('connect')
def connect():
    print("Connected")

@SOCKETIO.on('frame')
def handle_frame(data):
    for cell in data.get('cells'):
        send_osc(cell)

def send_osc(cell_args):
    client.send_message("/pixel", "%s %s %s %s %s %s %s" % (
    cell_args.get('cell_id'),\
    cell_args.get('state'),\
    cell_args.get('bank'),\
    cell_args.get('sound'),\
    cell_args.get('volume'),\
    cell_args.get('start'),\
    cell_args.get('end')))

if __name__ == '__main__':
    SOCKETIO.run(APP, host="0.0.0.0", debug=True)