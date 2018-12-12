$(function() {
    var template = _.template($('#page-template').html()),
        $content = $('#content');

    function parse_message(message) {
        var date = new Date();
        if (message.includes(":")) {
            var splitted = message.split(":");
            date.setHours(splitted[0]);
            date.setMinutes(splitted[1]);
        }
        if (message.includes("retard")) {
            date.setMinutes(date.getMinutes() - 10);
        }

        return date;

    }


    function get_temperature() {
        $.simpleWeather({
            location: 'Orsay, France',
            woeid: '',
            unit: 'c',
			async: false,
            success: function(weather) {
                var html = "<p>";
				html += weather.temp + '&deg;' + weather.units.temp + '<br />';
                html += "<span class='low'>"  + weather.low  + '&deg;' + weather.units.temp + '</span><br />';
                html += "<span class='high'>" + weather.high + '&deg;' + weather.units.temp + '</span><br />';
				html += "</p>";
                $("#temp").html(html);
            },
            error: function(error) {
            }
        });
    }

    var getData = function() {

        var schedules_url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/rers/b/lozere/A+R';
        var traffic_url = 'https://api-ratp.pierre-grimaud.fr/v3/traffic/rers/b';

        var cdg_count = 0;
        var st_remy_count = 0;
		
        $.when($.getJSON(schedules_url), $.getJSON(traffic_url)).done(function(schedules, traffic) {
            var date = new Date(),
                hours = date.getHours(),
                minutes = date.getMinutes(),
                current_time = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);

            var trafficResponse = traffic[0].result,
                scheduleResponse = schedules[0].result;

            var new_responses = [];

            scheduleResponse.schedules.forEach(function(element) {
                if (element.message.includes("sans"))
                    return;
                if (element.destination.startsWith("Orsay") || element.destination.startsWith("Saint")) {
                    if (st_remy_count < 3) {
                        element.destination = "Vers St-Remy";

                        var arrival_time = parse_message(element.message);

                        var partir_dans = ((Math.floor((arrival_time - date) / 60000) - 9));
                        if (partir_dans < -4) {
                            if (partir_dans < -10) {
                                element.temps = "Inconnu";
                            } else {
                                element.temps = "Trop tard.";
                            }
                        } else {
                            partir_dans = "" + partir_dans;
                            element.temps = "Il faut partir dans " + partir_dans + (partir_dans.length <= 4 ? " ".repeat(4 - partir_dans.length) : "") + "minutes";
                        }
                        new_responses.push(element);
                    }
                    st_remy_count += 1;
                } else {
                    if (cdg_count < 3) {
                        element.destination = "Vers Paris";


                        var arrival_time = parse_message(element.message);

                        var partir_dans = ((Math.floor((arrival_time - date) / 60000) - 9));
                        if (partir_dans < -4) {
                            if (partir_dans < -10) {
                                element.temps = "Inconnu";
                            } else {
                                element.temps = "Trop tard.";
                            }
                        } else {
                            partir_dans = "" + partir_dans;
                            element.temps = "Il faut partir dans " + partir_dans + (partir_dans.length <= 4 ? " ".repeat(4 - partir_dans.length) : "") + "minutes";
                        }

                        new_responses.push(element);
                    }
                    cdg_count += 1;
                }
            });
            scheduleResponse.schedules = new_responses;
			
            var data = {
                traffic: trafficResponse.message,
                line: 'B',
                type: 'rer',
                horaires: scheduleResponse.schedules,
                station: 'Lozère',
                current_time: current_time
            };

            $content.html(template(data));
			
            var date_2 = new Date();
            var day = date_2.getDay();
            $(".td2-header").css("background-color", "#555b69");
            $("#time").css("color", "");

            console.log("day: " + day);
            if (day == 4) {
                $("#time").css("color", "yellow");
            } else if (day == 3 || day == 6) {
                $(".td2-header").css("background-color", "rgb(245, 245, 245)");
                $("#time").css("color", "black");
            }
			
			get_temperature();
        });

    };

    getData();
    //setInterval(getData, 20000);
});