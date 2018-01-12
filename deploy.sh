#!/bin/bash
docker build -t 127.0.0.1:5000/pstracker-nginx ./nginx
docker build -t 127.0.0.1:5000/pstracker ./src
docker build -t 127.0.0.1:5000/pstracker-pusher -f src/pusher-docker ./src
docker push 127.0.0.1:5000/pstracker-nginx
docker push 127.0.0.1:5000/pstracker
docker push 127.0.0.1:5000/pstracker-pusher