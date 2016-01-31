#! /bin/bash
# pm2 should be installed. Please type the following line:
# npm install pm2 -g
pm2 start gs/StartGS.js --name "gs" -i 2 -f --log-date-format="YYYY-MM-DD HH:mm Z" -l "logs/gs.log" --merge-logs -- --repl
