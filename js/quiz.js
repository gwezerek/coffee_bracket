/*jshint -W099 */

'use strict';

// SETUP VARIABLES
// =============================================

var data = '';
var i = 0;
var formURL = 'https://docs.google.com/forms/d/1Vt0gCO1voI1DV49tWkHirgxkW7mIRapsL3SttzD90YQ/formResponse'; // Example: 'https://docs.google.com/forms/d/KEYGOESHERE/formResponse'
var spreadsheetURL = 'data/competitors.tsv';

// For pym

// For template
var vizEven = false;
var vizQuiz = true;
var quizTemplate = _.template($('.viz-designer-template').html());

// For bracket
var divisionColor = ['#F2D46D', '#80BDB6', '#E09D8B', '#F0BD89'];
var designerText = '';

// For quiz
var indicesRound1 = [0, 7, 3, 4, 2, 5, 1, 6, 8, 15, 11, 12, 10, 13, 9, 14, 16, 23, 19, 20, 18, 21, 17, 22, 24, 31, 27, 28, 26, 29, 25, 30];
var indicesRound2 = [0, 4, 2, 1, 15, 12, 13, 9, 16, 20, 18, 17, 24, 28, 26, 25];
var indicesRound3 = [4, 2, 15, 9, 20, 17, 24, 26];
var indicesRound4 = [4, 9, 17, 24];
var indicesRound5 = [4, 17];

var currentRound = indicesRound5;

// For rankings
var divisions = {

    // We set these manually to reduce complexity in the rearrange on round change
    // To compute, run the following inside the convertAbs() function:
    // var topArray = [];
    // designers.each(function() {
    //     topArray.push($(this).position().top);
    // });
    // console.log(topArray);

    topPosRound1: [0, 50, 111, 161, 222, 272, 333, 383],
    topPosRound2: [0, 50, 111, 161, 222, 267, 312, 357],
    topPosRound3: [0, 50, 111, 156, 201, 246, 291, 336],

    division1: {
        roundNumber: 3,
        roundArray: [1, 2, 3],
        round1: [0, 7, 1, 6, 2, 5, 3, 4],
        round2: [0, 4, 2, 1, 7, 3, 5, 6],
        round3: [4, 2, 0, 1, 7, 3, 5, 6]
    },
    division2: {
        roundNumber: 3,
        roundArray: [1, 2, 3],
        round1: [8, 15, 9, 14, 10, 13, 11, 12],
        round2: [15, 12, 13, 9, 8, 11, 10, 14],
        round3: [15, 9, 12, 13, 8, 11, 10, 14]
    },
    division3: {
        roundNumber: 3,
        roundArray: [1, 2, 3],
        round1: [16, 23, 17, 22, 18, 21, 19, 20],
        round2: [16, 20, 18, 17, 23, 19, 21, 22],
        round3: [20, 17, 16, 18, 23, 19, 21, 22]
    },
    division4: {
        roundNumber: 3,
        roundArray: [1, 2, 3],
        round1: [24, 31, 25, 30, 26, 29, 27, 28],
        round2: [24, 28, 26, 25, 31, 27, 29, 30],
        round3: [24, 26, 28, 25, 31, 27, 29, 30]
    },
    division5: {
        roundNumber: 2,
        roundArray: [1, 2],
        round1: [4, 9, 17, 24],
        round2: [4, 17, 9, 24]
    }
};



// SETUP
// =============================================

// Set the form url
$('.viz-form').attr('action', formURL);

// Set each rankings division's round to the latest we've defined above
populateRounds();



// LOAD DAT DATA
// =============================================

d3.tsv(spreadsheetURL, function(error, myData) {
    data = myData;
    buildBracket(myData, 0, '.viz-bracket-left');
    buildBracket(myData, 1, '.viz-bracket-right');
    // populateQuiz(myData);
    populateRankings(myData);
});



// THE D3 BITS
// =============================================

var margin = {
        top: 10,
        right: 100,
        bottom: 0,
        left: 0
    },
    baseWidth = 500,
    width = baseWidth - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

var tree = d3.layout.tree()
    .separation(function(a, b) {
        return a.parent === b.parent ? 1 : 1.5;
    })
    .children(function(d) {
        return d.parents;
    })
    .size([height, width]);


function buildBracket(data, leftRightIndex, target) {

    var svg = d3.select(target).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    // d3.json('http://www.guswezerek.com/projects/bracket_madness/treeData.json', function(json) {
    d3.json('data/treeData.json', function(json) {

        var nodes = tree.nodes(json.parents[leftRightIndex]);

        var link = svg.selectAll('.link')
            .data(tree.links(nodes))
            .enter().append('path')
            .attr('class', 'viz-bracket-elbow');

        var node = svg.selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', function(n) {
                if (n.children) {
                    return 'viz-inner viz-node';
                } else {
                    return 'viz-leaf viz-node';
                }
            });

        designerText = node.append('text');

        // Storing data-originalIndex custom, namespaced attribute
        designerText.each(function(d) {
            this.setAttributeNS('http://www.guswezerek.com', 'data-originalIndex', d.competitorIndex);
        });

        designerText.attr('class', function(d) {
            if (d.lost == 'true') {
                return 'viz-bracket-designer-name viz-bracket-designer-loser';
            } else {
                return 'viz-bracket-designer-name';
            }
        })
            .attr('y', function(d) {
                // if it has a second line, y should be larger
                if (data[d.competitorIndex] && data[d.competitorIndex].second_line !== 'FALSE') {
                    return '-16';
                } else {
                    return '-5';
                }
            });



        // Seed
        designerText.append('tspan')
            .attr('class', 'viz-bracket-seed')
            .text(function(d) {
                if (data[d.competitorIndex] && data[d.competitorIndex].rank) {
                    return data[d.competitorIndex].rank;
                }
            });

        // Competitor first line
        designerText.append('tspan')
            .attr('dx', '3')
            .text(function(d) {
                if (data[d.competitorIndex] && data[d.competitorIndex].first_line) {
                    return data[d.competitorIndex].first_line;
                }
            });

        // Competitor second line
        var secondLine = designerText.append('tspan')
            .attr('dy', '1em')
            .text(function(d) {
                if (data[d.competitorIndex] && data[d.competitorIndex].second_line !== 'FALSE') {
                    return data[d.competitorIndex].second_line;
                }
            });

        // Binds the handler that shows the winners' paths on hover
        // We target the surrogate to get around the division-right overlapping division-left
        // and making the division-left winner un-hoverable

        bindHover(designerText, data, 1);
        bindHover($('.viz-bracket-left-finals-surrogate'), data, 0);

        // For future: Move this helper to the helper section outside of this block.

        function bindHover(target, d, svgFlag) {
            target.on('mouseover', function(d) {
                var desiredIndex = '';
                // The originalIndex is stored in the custom data-originalIndex attribute
                // But we get those in different ways depending on whether 'this' is an SVGElement or HTMLElement

                if (svgFlag) {
                    desiredIndex = this.getAttributeNS('http://www.guswezerek.com', 'data-originalIndex');
                } else {
                    desiredIndex = this.dataset.originalindex;
                }

                // For rounds 1-4
                // var desiredTargets = link.filter(function(d) {
                //     if (d.target.competitorIndex === desiredIndex) {
                //         return d;
                //     }
                // });
                // var desiredPaths = getDesired(desiredTargets);


                // For final rounds
                var desiredTargets = link.filter(function(d) {
                    if (d.target.competitorIndex === desiredIndex && d.target.lost != "true") {
                        console.log(d.target);
                        return d;
                    }
                });

                var desiredPaths = desiredTargets[0];

                desiredTargets.moveToFront();

                for (var i = 0; i < desiredPaths.length; i++) {
                    desiredPaths[i].addClass('viz-active-path');
                }

            })
                .on('mouseout', function(d) {
                    link.each(function(d) {
                        $(this)[0].removeClass('viz-active-path');
                    });
                });
        }

        function getDesired(desiredTargets) {
            if (desiredTargets[0].length == 5) {
                return desiredTargets[0];
            } else {
                return desiredTargets[0].slice(1);
            }
        }


        // The following moves the finals connector elbows out of the center
        // and removes the padding for leaf nodes
        // We could probably refactor, but this works well for this instance.

        if (leftRightIndex === 0) {
            node.attr('transform', function(n) {
                if (n.children) {
                    return 'translate(' + (width - n.y + 95) + ',' + n.x + ')';
                } else {
                    return 'translate(' + (width - n.y) + ',' + n.x + ')';
                }
            });
            link.attr('d', elbowRight);
            designerText.attr('text-anchor', 'end');
            secondLine.attr('x', '95');
        } else {
            node.attr('transform', function(n) {
                if (n.children) {
                    return 'translate(' + (n.y + 5) + ',' + n.x + ')';
                } else {
                    return 'translate(' + n.y + ',' + n.x + ')';
                }
            });
            link.attr('d', elbowLeft);
            adjustFinalsRight();
            designerText.attr('text-anchor', 'start');
            secondLine.attr('x', '12');
        }

        adjustFinalsLeft();
        adjustFinalsRight();
        d3.selectAll('.viz-bracket-left .viz-leaf text').attr('x', 95);
        d3.selectAll('.viz-bracket-right .viz-leaf text').attr('x', 5);

    });
}



// HANDLERS
// =============================================

// Vote functionality
$('.viz-quiz-wrapper').on('click', '.viz-quiz-target', function() {
    var $this = $(this);
    var winner = $this.closest('.viz-choice-item');
    var winnerInput = winner.find('.viz-radio');
    var loser = winner.siblings('.viz-choice-item');
    var loserTarget = loser.find('.viz-quiz-target');
    var submittedAlert = $this.closest('.viz-choices-group').next('.viz-submitted-alert');

    // Add classes
    loser.addClass('viz-choice-loser');
    winner.addClass('viz-choice-winner');

    // Remove handlers
    $this.off('click');
    loserTarget.off('click');

    // Let the user know the vote was submitted
    submittedAlert.slideDown(200).delay(1000).slideUp(200);

    // Enable and select our answer, submit the quiz
    winnerInput.attr('disabled', false);
    winnerInput.attr('checked', true);

    // Delay form submission to give submittedAlert time to finish
    setTimeout(function() {

        $('.viz-form').submit();

        // Disable selected answer so it doesn't get sent
        // When the user selects another answer
        winnerInput.attr('disabled', true);
        winner.off('click');
        loser.off('click');

    }, 2000);

});

// Show/hide the description
$('.viz-container').on('click', '.viz-choice-item', function() {
    var $this = $(this);
    var selectedDescription = $this.find('.viz-designer-description');

    $('.viz-designer-description').not(selectedDescription).slideUp(200);
    selectedDescription.slideToggle(200);
});

// Stops voting from showing the description the first time
$('.viz-container').on('click', '.viz-choice-item .viz-quiz-target', function(e) {
    e.stopPropagation();
});

// Iterating through rounds
$('.viz-division-button').on('click', function() {
    var toAppendString = '';
    var $this = $(this);
    var division = $this.closest('.viz-division');
    var divisionID = division.attr('id');
    var designers = division.find('.viz-choice-item');
    var oldRoundNumber = divisions[divisionID].roundNumber;
    var divisionRoundArray = divisions[divisionID].roundArray;
    var addRound = false;
    var subRound = false;

    if ($this.hasClass('viz-next')) {
        addRound = true;
    } else {
        subRound = true;
    }

    var currentDivisionRound = updateRoundNumber(oldRoundNumber, addRound, subRound);
    var desiredIndices = divisions[divisionID]['round' + currentDivisionRound];

    updateTopperText(division, currentDivisionRound);
    divisions[divisionID].roundNumber = currentDivisionRound;
    setButtons(currentDivisionRound, divisionRoundArray, division);
    freezeHeight(division);

    // Convert elements to absolute positioning
    convertAbs(designers, oldRoundNumber);

    // Reorder and animate elements
    toAppendString = refilterData(division, desiredIndices, currentDivisionRound, designers);

    // Replace animated absolute elements with real DOM elements
    division.find('.viz-division-designers-list').html(toAppendString);

    // Set losers
    setLosers(currentDivisionRound, division);

});


// Selecting designers for the infoMod
// And moving the info mod to the correct position
$('.viz-bracket').on('click', '.viz-bracket-designer-name', function() {

    var originalIndex = d3.select(this).datum().competitorIndex;
    var divisionObj = data[originalIndex];
    var infoMod = $('.viz-bracket-info-mod');
    var colorsIndex = Math.floor(originalIndex / (data.length / 4));

    // Variables for tooltip positioning

    var bracket = $(this).closest('.viz-bracket-wrapper');
    var node = $(this).parent()[0];
    var position = $(this).parent().attr('transform').replace('translate(', '');
    var pozLeft = parseInt(position.match(/\d+/)[0]);
    var pozTop = parseInt(position.match(/,\d+/)[0].replace(',', ''));

    infoMod.find('.viz-info-instructions').hide();

    if (bracket.hasClass('viz-bracket-left')) {
        if (node.hasClass('viz-leaf')) {
            pozLeft += 130;
            pozTop -= 24;
        } else if (node.hasClass('viz-inner')) {
            pozLeft += 35;
            pozTop -= 24;
        }
    } else if (bracket.hasClass('viz-bracket-right')) {
        infoMod.removeClass('viz-bracket-info-left');
        if (node.hasClass('viz-leaf')) {
            pozLeft += 120;
            pozTop -= 26;
        } else if (node.hasClass('viz-inner')) {
            pozLeft += 115;
            pozTop -= 27;
        }
    }

    window.setTimeout(function() {

        if (bracket.hasClass('viz-bracket-left')) {
            infoMod.addClass('viz-bracket-info-left');
        }

        infoMod.addClass('viz-info-initiated');
        infoMod.fadeIn(200);
        infoMod.css({
            'top': pozTop + 'px',
            'left': pozLeft + 'px'
        });
        infoMod.find('.viz-headshot').css({
            'right': 40 * originalIndex + 'px',
            'background-color': divisionColor[colorsIndex]
        });
        infoMod.find('.viz-designer-name').html(divisionObj.name);
        infoMod.find('.viz-designer-job').html('(' + divisionObj.rank + ') ' + divisionObj.job);
        infoMod.find('.viz-bracket-designer-description').html(divisionObj.description);
        infoMod.find('.viz-info-designer-wrapper').fadeIn(1000);
    }, 200);

});


// Special case for surrogate
// This code could easily be refactored into the handler above
// But it's after midnight.

$('.viz-bracket-left-finals-surrogate').on('click', function() {

    var originalIndex = this.dataset.originalindex;
    var divisionObj = data[originalIndex];
    var infoMod = $('.viz-bracket-info-mod');
    var colorsIndex = Math.floor(originalIndex / (data.length / 4));

    // Variables for tooltip positioning
    var forcedTarget = $('.viz-bracket-designer-name').first();
    var bracket = forcedTarget.closest('.viz-bracket-wrapper');
    var node = forcedTarget.parent()[0];
    var position = forcedTarget.parent().attr('transform').replace('translate(', '');
    var pozLeft = parseInt(position.match(/\d+/)[0]);
    var pozTop = parseInt(position.match(/,\d+/)[0].replace(',', ''));

    if (bracket.hasClass('viz-bracket-left')) {
        if (node.hasClass('viz-leaf')) {
            pozLeft += 130;
            pozTop -= 24;
        } else if (node.hasClass('viz-inner')) {
            pozLeft += 35;
            pozTop -= 24;
        }
    } else if (bracket.hasClass('viz-bracket-right')) {
        infoMod.removeClass('viz-bracket-info-left');
        if (node.hasClass('viz-leaf')) {
            pozLeft += 120;
            pozTop -= 26;
        } else if (node.hasClass('viz-inner')) {
            pozLeft += 115;
            pozTop -= 27;
        }
    }


    infoMod.find('.viz-info-instructions').hide();

    window.setTimeout(function() {

        if (bracket.hasClass('viz-bracket-left')) {
            infoMod.addClass('viz-bracket-info-left');
        }

        infoMod.addClass('viz-info-initiated');
        infoMod.fadeIn(200);
        infoMod.css({
            'top': pozTop + 'px',
            'left': pozLeft + 'px'
        });
        infoMod.find('.viz-headshot').css({
            'right': 40 * originalIndex + 'px',
            'background-color': divisionColor[colorsIndex]
        });
        infoMod.find('.viz-designer-name').html(divisionObj.name);
        infoMod.find('.viz-designer-job').html('(' + divisionObj.rank + ') ' + divisionObj.job);
        infoMod.find('.viz-bracket-designer-description').html(divisionObj.description);
        infoMod.find('.viz-info-designer-wrapper').fadeIn(1000);
    }, 200);

});

// Hiding the info mod if someone clicks off it
$(document).click(function(e) {
    if (!$('.viz-info-initiated').find(e.target).length) {
        $('.viz-info-initiated').fadeOut(200);
    }
});



// HELPERS
// =============================================

// SVG godesend extension methods

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

SVGElement.prototype.hasClass = function(className) {
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(this.getAttribute('class'));
};

SVGElement.prototype.addClass = function(className) {
    if (!this.hasClass(className)) {
        this.setAttribute('class', this.getAttribute('class') + ' ' + className);
    }
};

SVGElement.prototype.removeClass = function(className) {
    var removedClass = this.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
    if (this.hasClass(className)) {
        this.setAttribute('class', removedClass);
    }
};

// Graphic-specific helpers

function populateQuiz(data) {
    var myObj = {};
    var toAppendStringLeft = '';
    var toAppendStringRight = '';
    vizQuiz = true; // This flag shows the viz-choice-target and ul wrapper element in the template

    // Get and order only the day's designers
    var quizData = filterData(data, currentRound);

    // Create objects that underscore likes
    // Keep in dot notation or else quizData won't stick
    myObj['designers'] = quizData;
    quizData = myObj;

    // Compile the list for that round
    for (i = 0; i < quizData.designers.length; i++) {

        // FOR WIDGET
        quizData.designers[i].vizQuiz = true;
        // END FOR WIDGET

        if (i === 0) {
            quizData.designers[i].division_index = 1;
        } else {
            quizData.designers[i].division_index = 3;
        }

        if (i % 2) {
            // FOR WIDGET
            quizData.designers[i].vizEven = true;
            // END FOR WIDGET

            vizEven = true;
        } else {
            // FOR WIDGET
            quizData.designers[i].vizEven = false;
            // END FOR WIDGET

            vizEven = false;
        }

        if (i < (currentRound.length)) {
            toAppendStringLeft += quizTemplate(quizData.designers[i]);
        } else {
            toAppendStringRight += quizTemplate(quizData.designers[i]);
        }

    }

    // Append the list
    $('.viz-quiz-left').prepend(toAppendStringLeft);
    $('.viz-quiz-right').prepend(toAppendStringRight);
}

function populateRankings(data) {
    var divisionElements = $('.viz-division');
    vizQuiz = false; // This flag hides the viz-choice-target and ul wrapper element in the template

    // Populate each divison with designers
    divisionElements.each(function(index) {
        var toAppendString = '';
        var myObj = {};
        var $this = $(this);
        var divisionID = $this.attr('id');
        var divisionRound = divisions[divisionID].roundNumber;
        var divisionRoundArray = divisions[divisionID].roundArray;
        var desiredIndices = divisions[divisionID]['round' + divisionRound];

        // Get and order only the division's designers
        var rankingsData = filterData(data, desiredIndices);

        // Create objects that underscore likes
        myObj.designers = rankingsData;
        rankingsData = myObj;

        // Compile the list for that division
        for (i = 0; i < rankingsData.designers.length; i++) {
            // FOR WIDGET
            rankingsData.designers[i].vizQuiz = false;
            rankingsData.designers[i].division_index = index;

            // Need to set for finals
            // Looks like my dynamic class names weren't as elegant as I thought
            // In retrospect could re-do using data-original-index and Math.floor
            if (index === 0) {
                if (i === 0) {
                    rankingsData.designers[i].division_index = 1;
                } else if (i === 1) {
                    rankingsData.designers[i].division_index = 3;
                } else if (i === 2) {
                    rankingsData.designers[i].division_index = 2;
                } else if (i === 3) {
                    rankingsData.designers[i].division_index = 4;
                }
            }

            if (i % 2) {
                // FOR WIDGET
                rankingsData.designers[i].vizEven = true;
                // END FOR WIDGET

                vizEven = true;
            } else {
                // FOR WIDGET
                rankingsData.designers[i].vizEven = false;
                // END FOR WIDGET

                vizEven = false;
            }
            // END FOR WIDGET
            toAppendString += quizTemplate(rankingsData.designers[i]);
        }

        // Append the list
        $this.find('.viz-division-designers-list').append(toAppendString);

        // Fade out the losers
        setLosers(divisionRound, $this);

        // Show and hide  right buttons
        setButtons(divisionRound, divisionRoundArray, $this);


    });
}

function filterData(data, desiredIndices) {
    var filteredArray = [];

    for (i = 0; i < desiredIndices.length; i++) {
        filteredArray.push(data[desiredIndices[i]]);
    }
    return filteredArray;
}

function convertAbs(designers, oldRoundNumber) {
    var designerSpecs = {};
    designerSpecs.currentPos = divisions['topPosRound' + oldRoundNumber];
    designerSpecs.designerWidth = designers.eq(1).innerWidth();

    // Shut down visible descriptions TKTK
    designers.find('.viz-designer-description').slideUp(200);
    designers.addClass('viz-transition');
    convertCompetitors(designers, designerSpecs);
}


function convertCompetitors(designers, specs) {
    designers.each(function(i) {
        $(this).css({
            'top': specs.currentPos[i],
            'width': specs.designerWidth
        });
    });
}

function refilterData(container, desiredIndices, currentDivisionRound, designers) {
    var filteredArray = [];

    for (i = 0; i < desiredIndices.length; i++) {
        var desiredElement = container.find("[data-originalIndex='" + desiredIndices[i] + "']");

        desiredElement.animate({
            top: divisions['topPosRound' + currentDivisionRound][i]
        }, 1000, function() {
            // Remove transition-specific styling
            designers.removeClass('viz-transition');
            designers.css('width', '100%');
            container.css('height', 'auto');
        });

        filteredArray.push(desiredElement[0]);
    }
    return filteredArray;
}

function populateRounds() {
    var divisionElements = $('.viz-division');
    divisionElements.each(function() {
        var $this = $(this);
        var roundNumber = divisions[$this.attr('id')].roundNumber;

        updateTopperText($this, roundNumber);
    });
}

function setButtons(roundNumber, roundArray, container) {
    var prevButton = container.find('.viz-prev');
    var nextButton = container.find('.viz-next');

    if (roundNumber == roundArray[0]) {
        prevButton.hide();
    } else {
        prevButton.show();
    }

    if (roundNumber == roundArray[roundArray.length - 1]) {
        nextButton.hide();
    } else {
        nextButton.show();
    }
}

function freezeHeight(container) {
    var freezeHeightNum = container.outerHeight();
    container.css('height', freezeHeightNum + 'px');
}

function updateRoundNumber(oldRoundNumber, addRound, subRound) {
    return oldRoundNumber + addRound - subRound;
}

function updateTopperText(container, roundNumber) {
    container.find('.viz-division-round').text('Round ' + roundNumber);
}

function setLosers(roundNumber, container) {
    var designers = container.find('.viz-choice-item');

    if (roundNumber == 2 && container.hasClass('viz-division-finals')) {
        roundNumber = 'finals';
    }

    // Reset losers
    designers.removeClass('viz-choice-loser');


    if (roundNumber == 2) {
        designers.slice(-4).addClass('viz-choice-loser');
    } else if (roundNumber == 3) {
        designers.slice(-6).addClass('viz-choice-loser');
    } else if (roundNumber === 'finals') {
        designers.slice(-2).addClass('viz-choice-loser');
    }

}



// D3 HELPERS

function adjustFinalsLeft() {
    var elbows = $('.viz-bracket-left .viz-bracket-elbow');
    elbows.eq(0).attr('d', 'M500,168H400V135');
    elbows.eq(1).attr('d', 'M500,168H400V405');

    $('.viz-bracket-left .viz-node').eq(0).attr('transform', 'translate(495,168)');
}

function adjustFinalsRight() {
    var elbows = $('.viz-bracket-right .viz-bracket-elbow');
    elbows.eq(0).attr('d', 'M0,372H100V135');
    elbows.eq(1).attr('d', 'M0,372H100V405');

    $('.viz-bracket-right .viz-node').eq(0).attr('transform', 'translate(0,372)');
}

function elbowLeft(d, i) {
    return 'M' + d.source.y + ',' + d.source.x + 'H' + d.target.y + 'V' + d.target.x + (d.target.children ? '' : 'h' + 100);
}

function elbowRight(d, i) {
    return 'M' + (baseWidth - d.source.y) + ',' + d.source.x + 'H' + (baseWidth - d.target.y) + 'V' + d.target.x + (d.target.children ? '' : 'h' + (-100));
}

// Badass deduping script in case mofos wanna try to game the system again
// d3.csv('dedupe.csv', function(csv) {
// 	var prevVal = 'Dieter Rams';
// 	var dupeCounter = 0;

// 	var noDupes = csv.filter(function(d) {
// 		if (d.Column === prevVal && dupeCounter > 4) {
// 			dupeCounter++;
// 		} else if (d.Column === prevVal) {
// 			dupeCounter++;
// 			return d;
// 		} else {
// 			dupeCounter = 0;
// 			prevVal = d.Column;
// 			return d;
// 		}
// 	});

// 	var finalString = JSON.stringify(noDupes);

// 	console.log(finalString);

// });