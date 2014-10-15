/* Globals */
var data = getData();
var geo_json = getGeojson();
var latlng = getLatlng();
var markerLayers = [];
var legend;

function getColorScale() {
    var INCREMENTS = 4;
    var maxCases = getMaxCases(data, $("#disease_select").val());
    var casesPerIncrement = Math.ceil(maxCases / (INCREMENTS * 1000)) * 1000;
    var domain = [1];
    for (var i = 0; i < INCREMENTS; i++) {
        domain.push(casesPerIncrement * (i + 1));
    }
    var scale = d3.scale.threshold()
        .domain(domain)
        .range(['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A']);
    scale.domainMax = domain[domain.length - 1];
    return scale;
}

function makeMap(L, map, disease_data, geo_json) {

	function matchKey(datapoint, key_variable){
		countryExists = key_variable[datapoint];
		if (! countryExists) {
			return 0.0;
		} else {
			return parseFloat(countryExists);
		}
    };
	
    function style_1(feature) {
		return {
			fillColor: getColorScale()(matchKey(feature.id, disease_data)),
			weight: 1,
			opacity: 0.2,
			color: 'black',
			fillOpacity: 0.7
		};
	};

    gJson_layer_1 = L.geoJson(geo_json, {style: style_1}).addTo(map);
};

function updateMap(disease_data, geo_json) {

	function matchKey(datapoint, key_variable){
		countryExists = key_variable[datapoint];
		if (! countryExists) {
			return 0.0;
		} else {
			return parseFloat(countryExists);
		}
    };
	
    function style_1(feature) {
		return {
			fillColor: getColorScale()(matchKey(feature.id, disease_data)),
			weight: 1,
			opacity: 0.2,
			color: 'black',
			fillOpacity: 0.7
		};
	};

    gJson_layer_1.setStyle(style_1);
};

function createLegent (L, map) {

    var colorScale = getColorScale();

    if (legend !== undefined) {
        map.removeControl(legend);
    }
	legend = L.control({position: 'topright'});
    legend.onAdd = function (map) {var div = L.DomUtil.create('div', 'legend'); return div};
    legend.addTo(map);

    var x = d3.scale.linear()
        .domain([0, colorScale.domainMax])
        .range([0, 400]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top")
        .tickSize(1)
        .tickValues(colorScale.domain());

    var svg = d3.select(".legend.leaflet-control").append("svg")
        .attr("id", 'legend')
        .attr("width", 450)
        .attr("height", 40);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(25,16)");

    g.selectAll("rect")
        .data(colorScale.range().map(function(d, i) {
			return {
				x0: i ? x(colorScale.domain()[i - 1]) : x.range()[0],
				x1: i < colorScale.domain().length ? x(colorScale.domain()[i]) : x.range()[1],
				z: d
			};
        }))
		.enter().append("rect")
			.attr("height", 10)
			.attr("x", function(d) { return d.x0; })
			.attr("width", function(d) { return d.x1 - d.x0; })
			.style("fill", function(d) { return d.z; });

    g.call(xAxis).append("text")
        .attr("class", "caption")
        .attr("y", 21)
        .text('Estimated Cases');
};

function plotMarkers(map, markersData) {
    /* Remove old markers */
    for (var i = 0; i < markerLayers.length; i++) {
        map.removeLayer(markerLayers[i]);
    }
    /* Plot new markers */
    var icon = L.icon({
        iconUrl: 'red.png',
        shadowUrl: null,
        iconSize: [16, 16],
        iconAnchor: [0, 0],
        popupAnchor: [-3, -76]
    });
	for (var i = 0; i < markersData.length; i++) {
        var country = markersData[i];
		marker = L.marker(latlng[country], {icon: icon});
		marker.bindPopup(country);
		map.addLayer(marker);
        markerLayers.push(marker);
	};
};

/* Initializations */
$(function() {

    /* MAP INITIALIZAION */
    var map = L.map('map').setView([25, -5], 2);

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Map data (c) <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);

    var dataSetName; /* Choose between ebola & flu */
    var date; /* Time-stamp chose between two datasets */

    makeMap(L, map, data.cases.ebola['20140322'], geo_json);
    createLegent(L, map);

    /* UI INITIALIZATION */
	var select = $("#timestamp");
	$("#timestamp_slider").slider({
		min: 1,
		max: 79,
		range: "min",
		value: select[0].selectedIndex + 1,
		slide: function( event, ui ) {
			select[0].selectedIndex = ui.value - 1;
			date = $("#timestamp").val();
            updateCountries(map);
			updateMap(data.cases[$('#disease_select').val()][date], geo_json);
		}
	});
	$( "#timestamp" ).change(function() {
		slider.slider( "value", this.selectedIndex + 1 );
		date = $("#timestamp").val();
		updateMap(data.cases.ebola[date], geo_json);
	});

    /* Initialize logarithmic sliders */
    $("#routes_slider").logSlider({
        min: 1,
        callback: function(event, value) {
            $("#routes").val(value);
            updateCountries(map);
        },
    });
    $("#local_cases_slider").logSlider({
        min: 1,
        callback: function(event, value) {
            $("#local_cases").val(value);
            updateCountries(map);
        },
    });
    $("#border_cases_slider").logSlider({
        min: 1,
        callback: function(event, value) {
            $("#border_cases").val(value);
            updateCountries(map);
        },
    });

    /* Initialize additional controls */
    $("#life_exp_slider").slider({
        range: true,
        slide: function(event, ui) {
            $("#min_life_exp").val(ui.values[0]);
            $("#max_life_exp").val(ui.values[1]);
            updateCountries(map);
        }
    });
    $("#border").button().click(function() {
        updateCountries(map);
    })
    $("#border_label").attr("unselectable", "on")
        .css("user-select", "none");

    /* Initialize disease selector. */
    var diseaseSelect = $("#disease_select").selectmenu({
        change: function(event, ui) {
            updateSliders(ui.item.value);
            createLegent(L, map);
        }
    });

    updateSliders(diseaseSelect.val(), reset=true);
    updateCountries(map);
});

/* Slider with logarithmic scale */
$.widget("custom.logSlider", $.ui.slider, {
    options: {
        min: 0,
        mx: 10000,
        logPower: 2,
        step: 0.1,
        callback: undefined
    },
    _create: function() {
        $.ui.slider.prototype._create.call(this);
        var self = this;
        if (self.options['callback'] !== undefined) {
            var callback = self.options['callback'];
            self._setOption("slide", function(event, ui) {
                callback(event, Math.ceil(Math.pow(ui.value, self.options['logPower'])));
            });
        }
    },
    _setOption: function( key, value ) {
        var valueUpdated = false;
        if (key === "mx") {
            this._setOption("max", Math.ceil(Math.pow(value, 1 / this.options['logPower'])));
            if (this.options['value'] > this.options['max']) {
                this.options['value'] = this.options['max'];
            }
            valueUpdated = true;
        } else if (key === "vl") {
            this._setOption("value", Math.ceil(Math.pow(value, 1 / this.options['logPower'])));
            valueUpdated = true;
        } else {
            this._super( key, value );
        };

        // Force calling of callback when value is updated from outside
        if (valueUpdated === true) {
            var sliderValue = this.options['value'];
            var scaledValue = Math.ceil(Math.pow(sliderValue, this.options['logPower']));
            this.options['callback'](event, scaledValue);
        }
    }
})

/* Updates a list of countries that satisfy the query criteria */
function updateCountries(map) {
    countries = getRiskCountries(
        disease=$("#disease_select").val(),
        date=$("#timestamp").val(),
        minLifeExpectancy=Number($("#min_life_exp").val()),
        maxLifeExpectancy=Number($("#max_life_exp").val()),
        minRoutesInto=Number($("#routes").val()),
        considerBorderRisk=($("#border").prop("checked")),
        minLocalCases=Number($("#local_cases").val()),
        borderingCases=Number($("#border_cases").val())
    );
    plotMarkers(map, countries);
};

function getMaxRoutes(data) {
    var maxRoutes = 0;
    for (var country in data.flights) {
        if (data.flights.hasOwnProperty(country)) {
            for (var adjCountry in data.flights[country]) {
                if (data.flights[country].hasOwnProperty(adjCountry)) {
                    if (data.flights[country][adjCountry] > maxRoutes) {
                        maxRoutes = data.flights[country][adjCountry];
                    }
                }
            }
        }
    }
    return maxRoutes;
};

function getDates(data, disease) {
    var dates = [];
    for (var date in data.cases[disease]) {
        if (data.cases[disease].hasOwnProperty(date)) {
            dates.push(date);
        }
    }
    return dates;
}

function getMaxCases(data, disease) {
    var maxCases = 0;
    var diseaseData = data.cases[disease];
    for (var date in diseaseData) {
        if (diseaseData.hasOwnProperty(date)) {
            var dateData = diseaseData[date];
            for (var country in dateData) {
                if (dateData.hasOwnProperty(country)) {
                    if (dateData[country] > maxCases) {
                        maxCases = dateData[country];
                    }
                }
            }
        }
    }
    return maxCases;
}

function getLifeExpectancyRange(data) {
    var minExpectancy = 1000;
    var maxExpectancy = 0;
    var expectancies = data.lifeExpectancies;
    for (var country in expectancies) {
        if (expectancies.hasOwnProperty(country)) {
            if (expectancies[country] < minExpectancy) {
                minExpectancy = expectancies[country];
            }
            if (expectancies[country] > maxExpectancy) {
                maxExpectancy = expectancies[country];
            }
        }
    }
    return [minExpectancy, maxExpectancy];
}

function updateSliders(disease, reset) {
    var maxCases = getMaxCases(data, disease);
    var maxRoutes = getMaxRoutes(data);
    var expectancyRange = getLifeExpectancyRange(data);
    var sortedDates = getDates(data, disease).sort();

    // Update date slider
    $("#timestamp option").remove();
    for (var i = 0; i < sortedDates.length; i++) {
        var dateStr = sortedDates[i];
        var year = Number(dateStr.substr(0, 4));
        var month = Number(dateStr.substr(4, 2));
        var day = Number(dateStr.substr(6, 2));
        $("#timestamp").append(
            "<option value=" + dateStr + ">" + month + "/" + day + "/" + year + "</option>"
        );
    }
    var tsSlider = $("#timestamp_slider").slider("option", {
        "max": sortedDates.length,
        "value": sortedDates.length / 10
    });
    tsSlider.slider("option", "slide")(null, {value: tsSlider.slider("value")});
    updateMap(data.cases[disease][$("#timestamp").val()], geo_json);

    // Set maximum and minimum slider values
    $("#routes_slider").logSlider("option", "mx", maxRoutes);
    $("#local_cases_slider").logSlider("option", "mx", maxCases);
    $("#border_cases_slider").logSlider("option", "mx", maxCases);
    $("#life_exp_slider").slider("option", "min", expectancyRange[0]);
    $("#life_exp_slider").slider("option", "max", expectancyRange[1]);

    if (reset) {
        $("#border").prop("checked", true);
        $("#routes_slider").logSlider("option", "vl", 500);
        $("#local_cases_slider").logSlider("option", "vl", 100);
        $("#border_cases_slider").logSlider("option", "vl", 100);
        $("#life_exp_slider").slider("option", "min", expectancyRange[0]);
        $("#life_exp_slider").slider("option", "max", expectancyRange[1]);
    }

    // Initialize or reset values as needed
    if ($("#min_life_exp").val() === "" || $("#max_life_exp").val() === "") {
        $("#life_exp_slider").slider("option", "values", [expectancyRange[0], expectancyRange[1]]);
        $("#min_life_exp").val(expectancyRange[0]);
        $("#max_life_exp").val(expectancyRange[1]);
    }
}
