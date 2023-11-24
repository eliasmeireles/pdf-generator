#!/bin/sh

yarn install --production

#nohup yarn start &

#
#counter=0
#
#while true; do
#  echo 'Checking if pdf server is running on port 3100...'
#  if nc -z localhost 3100; then
#    echo 'PDF server is up!'
#    break
#  else
#    counter=$((counter+1))
#    if [ $counter -gt 5 ]; then
#      echo 'Tried 5 times, server is not up. Exiting...'
#      exit 1
#    else
#      echo "PDF server is not up yet, sleeping for 5 seconds and trying again... Attempt - $counter"
#      sleep 5
#    fi
#  fi
#done

java -jar /app.jar
