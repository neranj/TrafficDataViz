(function () {
    function DataFetcher(urlFactory, delay) {
        var self = this;

        self.repeat = false;
        self.delay = delay;
        self.timer = null;
        self.requestObj = null;

        function getNext() {
            self.requestObj = $.ajax({
                url: urlFactory()
            }).done(function (response) {
                $(self).trigger("stateFetchingSuccess", {
                    result: response
                });
            }).fail(function (jqXHR, textStatus, errorThrown) {
                $(self).trigger("stateFetchingFailure", {
                    error: textStatus
                });
            }).always(function () {
                if (self.repeat && _.isNumber(self.delay)) {
                    self.timer = setTimeout(getNext, self.delay);
                }
            });
        }

        self.start = function (shouldRepeat) {
            self.repeat = shouldRepeat;
            getNext();
        };

        self.stop = function () {
            self.repeat = false;
            clearTimeout(self.timer);
        };

        self.repeatOnce = function () {
            getNext();
        };

        self.setDelay = function (newDelay) {
            this.delay = newDelay;
        };
    }

    function addNewEntry($container, contentHTML) {
        var $innerSpan = $("<p/>").text(contentHTML),
            $newEntry = $("<li/>").append($innerSpan);

        $container.append($newEntry);
    }

    var $trafficStatusList = $("#mockTrafficStat"),
        df2 = new DataFetcher(function () {
            // return "/traffic_status/frozen";
            return "/traffic_status";
            //codingArea
        });
    function triggerGraphs(data, sorceType) {
        var resul = data["result"];
        var inputData = resul["data"];
        console.log("length of inputData " + inputData.length)
        var trafficMin = inputData[0]["traffic"];
        var trafficMax = inputData[0]["traffic"];
        var packetMin = inputData[0]["packets"];
        var packetMax = inputData[0]["packets"];
        for (var i = 0; i < inputData.length; i++) {
            if (inputData[i]["traffic"] < trafficMin) {
                trafficMin = inputData[i]["traffic"];
            }
            if (inputData[i]["traffic"] > trafficMax) {
                trafficMax = inputData[i]["traffic"];
            }
            if (inputData[i]["packets"] < packetMin) {
                packetMin = inputData[i]["packets"];
            }
            if (inputData[i]["packets"] > packetMax) {
                packetMax = inputData[i]["packets"];
            }
        }

        var trafficRange = (trafficMax - trafficMin) / 4;
        var packetsRange = (packetMax - packetMin) / 4;
        var trafficRange1UpperLimit = trafficRange;
        var trafficRange2UpperLimit = trafficRange * 2;
        var trafficRange3UpperLimit = trafficRange * 3;
        var packetsRange1UpperLimit = packetsRange;
        var packetsRange2UpperLimit = packetsRange * 2;
        var packetsRange3UpperLimit = packetsRange * 3;

        //console.log("trafficRange " + trafficRange1UpperLimit + "  " + trafficRange2UpperLimit + "  " + trafficRange3UpperLimit + "  " + trafficMax);
        function getNetworkFlow(para1, para2) {
            var NetworkFlowArray = {};
            for (var i = 0; i < inputData.length; i++) {
                var flowDirection = inputData[i][para1] + "," + inputData[i][para2];
                if (flowDirection in NetworkFlowArray) {
                    //console.log("duplicate exhists " + flowDirection);
                    var sum = inputData[i]["traffic"];
                    sum = sum + NetworkFlowArray[flowDirection][0];
                    var packSum = inputData[i]["packets"];
                    packSum = packSum + NetworkFlowArray[flowDirection][1];
                }
                else {
                    NetworkFlowArray[flowDirection] = [inputData[i]["traffic"], inputData[i]["packets"]];
                }
            }
            return NetworkFlowArray;
        }
        var NetworkFlowGraphBaseCase = getNetworkFlow("srcObj", "destObj");
        var para1 = sorceType;
        var para2 = "destObj";
        var NetworkFlowGraph1 = getNetworkFlow(para1, para2);
        para1 = sorceType;
        para2 = "destType";
        var NetworkFlowGraph2 = getNetworkFlow(para1, para2);

        // console.log(JSON.stringify(NetworkFlow));
        // console.log("length of NetworkFlow "+Object.keys(NetworkFlow).length);

        function generateGraphData(NetworkFlowPara) {
            var dataForBiParateChart = [];
            for (var key in NetworkFlowPara) {
                if (NetworkFlowPara.hasOwnProperty(key)) {
                    //console.log(key + " -> " + NetworkFlow[key]);
                    var NetworkFlowValues = NetworkFlowPara[key]

                    var trafficValue = NetworkFlowValues[0];
                    var packetValue = NetworkFlowValues[1];
                    var KeySplitArray = key.split(',');
                    var sourceObject = KeySplitArray[0];
                    var DestinationObject = KeySplitArray[1];
                    //console.log(sourceObject + " and " + DestinationObject);
                    dataForBiParateChart.push([sourceObject, DestinationObject, trafficValue, packetValue]);
                }
            }
            return dataForBiParateChart;
        }

        var dataForGraph1 = generateGraphData(NetworkFlowGraph1);
        var dataForGraph2 = generateGraphData(NetworkFlowGraph2);
        // console.log(JSON.stringify(dataForBiParateChart));

        function generateNetworkGraph(NetworkGraphPara) {
            var networkGraph = [];
            var filterObj = ["obj5"];
            for (var key in NetworkGraphPara) {
                if (NetworkGraphPara.hasOwnProperty(key)) {
                    //console.log(key + " -> " + NetworkFlow[key]);
                    var NetworkFlowValues = NetworkGraphPara[key]
                    var trafficValue = NetworkFlowValues[0];
                    var packetValue = NetworkFlowValues[1];
                    var trafficStatus = "low";
                    var packetStatus = "low"
                    if (trafficValue >= trafficMin && trafficValue < trafficRange1UpperLimit) {
                        trafficStatus = "low";
                    }
                    if (trafficValue >= trafficRange1UpperLimit && trafficValue < trafficRange2UpperLimit) {
                        trafficStatus = "medium";
                    }
                    if (trafficValue >= trafficRange2UpperLimit && trafficValue < trafficRange3UpperLimit) {
                        trafficStatus = "mediumhigh";
                    }
                    if (trafficValue >= trafficRange3UpperLimit && trafficValue <= trafficMax) {
                        trafficStatus = "high";
                    }

                    if (packetValue >= packetMin && packetValue < packetsRange1UpperLimit) {
                        packetStatus = "low";
                    }
                    if (packetValue >= packetsRange1UpperLimit && packetValue < packetsRange2UpperLimit) {
                        packetStatus = "medium";
                    }
                    if (packetValue >= packetsRange2UpperLimit && packetValue < packetsRange3UpperLimit) {
                        packetStatus = "mediumhigh";
                    }
                    if (packetValue >= packetsRange3UpperLimit && packetValue <= packetMax) {
                        packetStatus = "high";
                    }


                    var KeySplitArray = key.split(',');
                    var sourceObject = KeySplitArray[0];
                    var DestinationObject = KeySplitArray[1];
                    //console.log(sourceObject + " and " + DestinationObject);

                    if (filterObj.includes(sourceObject) || filterObj.includes(DestinationObject)) {
                        console.log(filterObj);
                        var NodeData = {
                            source: sourceObject,
                            target: DestinationObject,
                            type: trafficStatus
                        }
                        if (NodeData.source)
                            networkGraph.push(NodeData);
                    }
                    // networkGraph.push([sourceObject, DestinationObject, trafficStatus, packetStatus]);
                }
            }
            return networkGraph;
        }

        var dataForNetworkGraph = generateNetworkGraph(NetworkFlowGraphBaseCase);
        //console.log(JSON.stringify(dataForNetworkGraph));


        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        }
        var data = dataForGraph1;
        //var color ={obj1:"#3366CC", obj2:"#DC3912",  obj2:"#FF9900", obj3:"#109618", obj5:"#990099", obj6:"#0099C6"};
        var colorsForBiparate = {};
        for (var i = 0; i < data.length; i++) {
            //  console.log(data[i][0]);
            var keyForColor = data[i][0];
            if (!(keyForColor in colorsForBiparate)) {
                //colorsForBiparate[keyForColor] = Colors.random()["rgb"];
                colorsForBiparate[keyForColor] = getRandomColor();
            }
        }
        // console.log(JSON.stringify(colorsForBiparate))




        var rad = document.valueInputForm.optradio;
        var prev = null;
        for (var i = 0; i < rad.length; i++) {
            rad[i].onclick = function () {
                (prev) ? console.log(prev.value) : null;
                if (this !== prev) {
                    prev = this;
                }
                //console.log(this.value)
                d3.select("#chart").select("svg").remove();

                createGraph(dataForGraph1, dataForGraph2, (+this.value) + 1);
                // alert(this.value);
            };
        }
        function createGraph(dataForGraph1, dataForGraph2, dataIndex) {
            var svg = d3.select("#chart").append("svg").attr("width", 960).attr("height", 800);
            var g = [svg.append("g").attr("transform", "translate(150,100)")
                , svg.append("g").attr("transform", "translate(650,100)")];
            var bp = [viz.bP()
                .data(dataForGraph1)
                .min(12)
                .pad(1)
                .height(600)
                .value(d => d[dataIndex])
                .width(200)
                .barSize(35)
                .fill(d => colorsForBiparate[d.primary])
                , viz.bP()
                    .data(dataForGraph2)
                    .min(12)
                    .pad(1)
                    .height(600)
                    .value(d => d[dataIndex])
                    .width(200)
                    .barSize(35)
                    .fill(d => colorsForBiparate[d.primary])
            ];

            [0, 1].forEach(function (i) {
                g[i].call(bp[i])

                g[i].append("text").attr("x", -50).attr("y", -8).style("text-anchor", "middle").text("source");
                g[i].append("text").attr("x", 250).attr("y", -8).style("text-anchor", "middle").text("destination");

                g[i].append("line").attr("x1", -100).attr("x2", 0);
                g[i].append("line").attr("x1", 200).attr("x2", 300);

                g[i].append("line").attr("y1", 610).attr("y2", 610).attr("x1", -100).attr("x2", 0);
                g[i].append("line").attr("y1", 610).attr("y2", 610).attr("x1", 200).attr("x2", 300);

                g[i].selectAll(".mainBars")
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout);

                g[i].selectAll(".mainBars").append("text").attr("class", "label")
                    .attr("x", d => (d.part == "primary" ? -30 : 30))
                    .attr("y", d => +6)
                    .text(d => d.key)
                    .attr("text-anchor", d => (d.part == "primary" ? "end" : "start"));

                g[i].selectAll(".mainBars").append("text").attr("class", "perc")
                    .attr("x", d => (d.part == "primary" ? -100 : 80))
                    .attr("y", d => +6)
                    .text(function (d) { return d3.format("0.0%")(d.percent) })
                    .attr("text-anchor", d => (d.part == "primary" ? "end" : "start"));
            });


            function mouseover(d) {
                [0, 1].forEach(function (i) {
                    bp[i].mouseover(d);

                    g[i].selectAll(".mainBars").select(".perc")
                        .text(function (d) { return d3.format("0.0%")(d.percent) });
                });
            }
            function mouseout(d) {
                [0, 1].forEach(function (i) {
                    bp[i].mouseout(d);

                    g[i].selectAll(".mainBars").select(".perc")
                        .text(function (d) { return d3.format("0.0%")(d.percent) });
                });
            }
            d3.select(self.frameElement).style("height", "800px");

        }
        // end
        createGraph(dataForGraph1, dataForGraph2, 2);
        // startAgain


        var links = dataForNetworkGraph;

        var nodes = {};

        // Compute the distinct nodes from the links.
        links.forEach(function (link) {
            link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
            link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
        });

        var width = 1160,
            height = 1000;

        var force = d3v3.layout.force()
            .nodes(d3v3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(380)
            .charge(-30)
            .on("tick", tick)
            .start();

        var svg = d3v3.select("#chart2").append("svg")
            .attr("width", width)
            .attr("height", height);

        // Per-type markers, as they don't inherit styles.
        svg.append("defs").selectAll("marker")
            .data(["low", "medium", "mediumhigh", "high"])
            .enter().append("marker")
            .attr("id", function (d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

        var path = svg.append("g").selectAll("path")
            .data(force.links())
            .enter().append("path")
            .attr("class", function (d) { return "link " + d.type; })
            .attr("marker-end", function (d) { return "url(#" + d.type + ")"; });

        var circle = svg.append("g").selectAll("circle")
            .data(force.nodes())
            .enter().append("circle")
            .attr("r", 6)
            .call(force.drag);

        var text = svg.append("g").selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function (d) { return d.name; });

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", linkArc);
            circle.attr("transform", transform);
            text.attr("transform", transform);
        }

        function linkArc(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        }

        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }
        //EndAgain
    }
    $(df2).on({
        "stateFetchingSuccess": function (event, data) {

            data.result.data.forEach(function (dataEntry) {
            });
            // start
                var para1 = "srcObj";
                var para2 = "destObj";
                triggerGraphs(data, para1);
            jQuery("#action-1").click(function (e) {
                 d3.select("#chart").select("svg").remove();
                 d3.select("#chart2").select("svg").remove();
                 para1 = "srcObj";
                 para2 = "destObj";
                triggerGraphs(data, para1);
                e.preventDefault();
            });
            jQuery("#action-2").click(function (e) {
                d3.select("#chart").select("svg").remove();
                d3.select("#chart2").select("svg").remove();
                 para1 = "srcType";
                 para2 = "destObj";
                triggerGraphs(data, para1);
                e.preventDefault();
            });


        },
        "stateFetchingFailure": function (event, data) {
            addNewEntry($trafficStatusList, JSON.stringify(data.error));
            addNewEntry($trafficStatusList, "Hit a snag. Retry after 1 sec...");
            setTimeout(function () {
                $trafficStatusList.html("");
                df2.repeatOnce();
            }, 1000);
        }
    });

    df2.start();
})();