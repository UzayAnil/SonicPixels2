from flask import Flask, flash, url_for, render_template, request, redirect, make_response, Response, jsonify
from flask_socketio import SocketIO
from pythonosc import osc_message_builder
from pythonosc import udp_client
import socket

import json

import datetime

from pymongo import MongoClient

import datetime

import os

#IP_RANGE = '10.99.100.55'
IP_RANGE = '192.168.1.255'
#IP_RANGE = '10.99.204.255'
PORT = 9000

client = udp_client.UDPClient(IP_RANGE, PORT)
client._sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)


MONGO_URL = os.environ.get('MONGO_URL')

CLIENT = MongoClient(MONGO_URL)
DB = CLIENT['SonicPixels']
COMPOSITIONS = DB['compositions']

ALLOWED_KEY = os.environ.get('API_KEY')

APP = Flask(__name__)
 
APP.secret_key = os.environ.get('SECRET_KEY')

SOCKETIO = SocketIO(APP)

WAV_COMMANDS = {'one-shot':1, 'loop':1, 'off': 3}
LOOP_COMMANDS = {'one-shot': 0, 'loop': 1, 'off': 0, }
DATA_SIZE = 5

@APP.route('/')
def index():
    return render_template('index.html')

@APP.route('/test')
def test_page():
    return render_template('test_playback.html')

@APP.route('/save-composition', methods=['POST'])
def save_composition():
    incoming = request.get_json()
    COMPOSITIONS.update({'author':incoming.get('author'), 'name':incoming.get('name')}, incoming, upsert=True)
    return jsonify(saved=True)

@APP.route('/load-composition/<author>/<name>')
def load_composition(author, name):
    loaded_composition = COMPOSITIONS.find_one({'name': name, 'author':author}, {'_id':0})
    return jsonify(loaded_composition=loaded_composition)

@SOCKETIO.on('connect')
def connect():
    print("Connected")

@SOCKETIO.on('frame')
def handle_frame(data):
    msg = osc_message_builder.OscMessageBuilder(address='/BULK')
    master_volume = float(data.get('master_volume'))
    current_palette = data.get('palette')
    current_num_units = data.get('num_units')
    meta = current_num_units | DATA_SIZE << 16
    msg.add_arg(meta)
    for cell in data.get('cells'):
        wav_command = WAV_COMMANDS.get(cell.get('state'))
        loop_cmd = LOOP_COMMANDS.get(cell.get('state'))
        action = wav_command | loop_cmd << 7
        playback_cmd = (int(cell.get('sound'))+1) | int(cell.get('bank')) << 8 | action << 16
        msg.add_arg(playback_cmd)
        msg.add_arg(float(cell.get('begin')))
        msg.add_arg(float(cell.get('end')))
        msg.add_arg(float(cell.get('volume'))*master_volume)
        if cell.get('state') == 'off':
            cell_colour = [0, 0, 0]
        else:
            cell_colour = current_palette[int(cell.get('sound'))]
        light_cmd = cell_colour[0] | cell_colour[1] << 8 | cell_colour[2] << 16
        msg.add_arg(light_cmd)
    client.send(msg.build())

if __name__ == '__main__':
    SOCKETIO.run(APP, host="0.0.0.0", debug=True)
