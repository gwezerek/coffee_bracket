# Fast Company Bracket Madness

## Dependencies

* [SASS](http://sass-lang.com/install)
* [Compass](http://compass-style.org/install/)

## Development

1. To view the project at http://localhost:8000/index.html, you'll need to do a python -m SimpleHTTPServer from the project directory.

## Update the following after each round
* treeData.json, moving the winners up a level by filling in the competitorIndex property and setting the loser flag to "true" on the losers
* Update divisions js object
* Update indicesRoundX

## For the final rounds
* Display the .viz-bracket-left-finals-surrogate and give it an ID of the left division winner's originalIndex
* Add .viz-date-finished classes to the dates that have passed
* Set and display the image for the .viz-champion-headshot, add appropriate division class to the headshot-wrap
* Reveal .viz-champion-name


## To Set Quiz Up
* Create a Google quiz with one multiple choice question that has all of the competitors as options
* Publish that quiz and grab its unique PUBKEY from the url
* Store https://docs.google.com/forms/d/KEYGOESHERE/formResponse as the formURL var in the js file
* Visit the survey online and copy the form element html
* In the html, replace the input element's name and id attributes with the value from the input's value from the html you copied
* Test to make sure the voting works
