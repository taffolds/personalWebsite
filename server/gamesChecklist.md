What happens if you aren't logged in? Should you be allowed to play
on your device against someone else on the same device? Or should I say
you need to log in to play? In any case, there needs to be some kind
of feedback to user to say if they are playing against a friend
or they can log in to play people online

Where are games accessed from? From the four in a row page?
Where are they created? Profile page? Separate page? Load from four in a row page?
What about cycling through games? There are some architectural and layout concerns.
Start with the duct tape, refactor later

[] Only allow one active game per friendship
[] Games expire after 3 days of no moves
[] Last to make move is winner
[] Counter for user? Implement in frontend
[] Games start when game request accepted
[] Delete game request entry when game accepted/declined
[] Games are either inProgress, completed, draw, or forfeited
[] Set up cron job for expired game requests
[] If Alice sends game request to Bob, then Bob sends game request to Alice, automatically start game

[] Display all games a user has participated in, and with whom they had the game
[] Make front end display without game numbers, but show which players had the game
[] If numbers, order by dateCreated, and number in for loop/map
[] Delete all associated games when a user requests to have their info deleted

Just realised if I want historic moves, I can add a column to the "games" table called "firstMover", then in the JSON
array store the move numbers. This will allow:
show the correct colours to the player when replaying games
give the player the possibility to choose starting colour easily
log games
easy to cycle through moves in order in react

[] WebSocket - what a pain this will be...
