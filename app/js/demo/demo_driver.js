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

    var $trafficStatusList = $("#mockTrafficStat");
    function urlCall(url) {
        return new DataFetcher(function () {
            return url;
            //return "/traffic_status";
        });
    }
    df2 = urlCall("/traffic_status");

    function triggerGraphs(data, sorceType) {
        var resul = data["result"];
        var inputData = resul["data"];
        var trafficArray = [];
        var packetArray = [];
        var trafficAndPacketArray = [];
        console.log("length of inputData " + inputData.length)
        var trafficMin = inputData[0]["traffic"];
        var trafficMax = inputData[0]["traffic"];
        var packetMin = inputData[0]["packets"];
        var packetMax = inputData[0]["packets"];

        for (var i = 0; i < inputData.length; i++) {
            trafficArray.push(inputData[i]["traffic"]);
            packetArray.push(inputData[i]["packets"]);
            trafficAndPacketArray.push([inputData[i]["traffic"], inputData[i]["packets"]]);
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

        function getObjByType(inputDataForType, selectType, selectObj) {
            var typeSet = {};
            for (var i = 0; i < inputDataForType.length; i++) {

                if (!(inputDataForType[i][selectType] in typeSet)) {
                    if (inputDataForType[i][selectType] === undefined) {
                        inputDataForType[i][selectType] = "TypeNotDefined";
                    }
                    typeSet[inputDataForType[i][selectType]] = [inputDataForType[i][selectObj]];
                }
                else {
                    if (!(inputDataForType[i][selectObj] in typeSet[inputDataForType[i][selectType]])) {
                        typeSet[inputDataForType[i][selectType]].push(inputDataForType[i][selectObj]);
                    }
                }
            }
            return typeSet;
        }
        var srcObjByType = getObjByType(inputData, "srcType", "srcObj");
        function getBarGraphData(inputDataForBarGraph, selectType) {
            var typeSet = {};
            for (var i = 0; i < inputDataForBarGraph.length; i++) {
                if (!(inputDataForBarGraph[i][selectType] in typeSet)) {
                    if (inputDataForBarGraph[i][selectType] === undefined) {
                        inputDataForBarGraph[i][selectType] = "TypeNotDefined";
                    }
                    typeSet[inputDataForBarGraph[i][selectType]] = [inputDataForBarGraph[i]["traffic"], 1, inputDataForBarGraph[i]["traffic"], inputDataForBarGraph[i]["packets"], 1, inputDataForBarGraph[i]["packets"]];
                }
                else {
                    var currentTotal = typeSet[inputDataForBarGraph[i][selectType]][0]
                    currentTotal = currentTotal + inputDataForBarGraph[i]["traffic"];
                    var currentCount = typeSet[inputDataForBarGraph[i][selectType]][1]
                    currentCount = currentCount + 1.0;
                    var currentAvg = currentTotal / currentCount;
                    var currentPacketTotal = typeSet[inputDataForBarGraph[i][selectType]][3]
                    currentPacketTotal = currentPacketTotal + inputDataForBarGraph[i]["packets"];
                    var currentPacketCount = typeSet[inputDataForBarGraph[i][selectType]][4]
                    currentPacketCount = currentPacketCount + 1.0;
                    var currentPacketAvg = currentPacketTotal / currentPacketCount;
                    typeSet[inputDataForBarGraph[i][selectType]] = [currentTotal, currentCount, currentAvg, currentPacketTotal, currentPacketCount, currentPacketAvg];
                }

            }
            return typeSet;
        }
        var rawBarGraphData = getBarGraphData(inputData, "srcType");
        function generateBarGraphData(barGraphDataPara, value) {
            console.log("value" + value);
            if (value == 1) {
                var text = "Traffic Vs Source Type";
                $("#chart2Name").html(text);
                var data = [];
                for (var key in barGraphDataPara) {
                    if (barGraphDataPara.hasOwnProperty(key)) {
                        var dataBuffer = {
                            "type": key,
                            "avgTraffic": barGraphDataPara[key][2]
                        }
                        data.push(dataBuffer);
                    }
                }
            }
            else {
                var text = "Packets Vs Source Type";
                $("#chart2Name").html(text);
                var data = [];
                for (var key in barGraphDataPara) {
                    if (barGraphDataPara.hasOwnProperty(key)) {
                        var dataBuffer = {
                            "type": key,
                            "avgTraffic": barGraphDataPara[key][5]
                        }
                        data.push(dataBuffer);
                    }
                }
            }
            return data;
        }
        var barGraphData = generateBarGraphData(rawBarGraphData, 1);
        createBarGraph(barGraphData);
        var trafficRange = (trafficMax - trafficMin) / 4;
        var packetsRange = (packetMax - packetMin) / 4;
        var trafficRange1UpperLimit = trafficRange;
        var trafficRange2UpperLimit = trafficRange * 2;
        var trafficRange3UpperLimit = trafficRange * 3;
        var packetsRange1UpperLimit = packetsRange;
        var packetsRange2UpperLimit = packetsRange * 2;
        var packetsRange3UpperLimit = packetsRange * 3;
        function getNetworkFlow(para1, para2) {
            var NetworkFlowArray = {};
            for (var i = 0; i < inputData.length; i++) {
                var flowDirection = inputData[i][para1] + "," + inputData[i][para2];
                if (flowDirection in NetworkFlowArray) {
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

        function generateGraphData(NetworkFlowPara) {
            var dataForBiParateChart = [];
            for (var key in NetworkFlowPara) {
                if (NetworkFlowPara.hasOwnProperty(key)) {
                    var NetworkFlowValues = NetworkFlowPara[key]

                    var trafficValue = NetworkFlowValues[0];
                    var packetValue = NetworkFlowValues[1];
                    var KeySplitArray = key.split(',');
                    var sourceObject = KeySplitArray[0];
                    var DestinationObject = KeySplitArray[1];
                    dataForBiParateChart.push([sourceObject, DestinationObject, trafficValue, packetValue]);
                }
            }
            return dataForBiParateChart;
        }

        var dataForGraph1 = generateGraphData(NetworkFlowGraph1);
        var dataForGraph2 = generateGraphData(NetworkFlowGraph2);
        function generateNetworkGraph(NetworkGraphPara, objectList) {
            console.log(JSON.stringify(objectList))
            var filterObj = [];
            for (var i = 0; i < objectList.length; i++) {
                if (!(filterObj.includes(objectList[i]))) {

                    filterObj.push(objectList[i])
                }
            }
            var networkGraph = [];

            for (var key in NetworkGraphPara) {
                if (NetworkGraphPara.hasOwnProperty(key)) {
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
                    if (filterObj.includes(sourceObject) && filterObj.includes(DestinationObject)) {
                        var NodeData = {
                            source: sourceObject,
                            target: DestinationObject,
                            type: trafficStatus
                        }
                        if (NodeData.source)
                            networkGraph.push(NodeData);
                    }
                }
            }
            return networkGraph;
        }
        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        }
        var data = dataForGraph1;
        var colorsForBiparate = {};
        for (var i = 0; i < data.length; i++) {
            var keyForColor = data[i][0];
            if (!(keyForColor in colorsForBiparate)) {
                colorsForBiparate[keyForColor] = getRandomColor();
            }
        }
        var rad = document.valueInputForm.optradio;
        var prev = null;
        
        $("#bipartHeading").html(" Network Traffic")
        for (var i = 0; i < rad.length; i++) {
            rad[i].onclick = function () {
                (prev) ? console.log(prev.value) : null;
                if (this !== prev) {
                    prev = this;
                }
                d3.select("#chart").select("svg").remove();
                if(+this.value == 2){
                    $("#bipartHeading").html(" Packet Traffic")
                }
                else{
                    $("#bipartHeading").html(" Network Traffic")
                }
                createGraph(dataForGraph1, dataForGraph2, (+this.value) + 1);
                d3.select("#chart2").select("svg").remove();
                var barGraphData = generateBarGraphData(rawBarGraphData, (+this.value));
                createBarGraph(barGraphData);
            };
        }
        function createGraph(dataForGraph1, dataForGraph2, dataIndex) {
            var svg = d3.select("#chart").append("svg").attr("width", 1160).attr("height", 800);
            var g = [svg.append("g").attr("transform", "translate(150,100)")
                , svg.append("g").attr("transform", "translate(750,100)")];
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

                g[i].append("text").attr("x", -50).attr("y", -8).style("text-anchor", "middle").text(setBpGraphLable);


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
            g[0].append("text").attr("x", 250).attr("y", -8).style("text-anchor", "middle").text("Destination Object");
            g[1].append("text").attr("x", 250).attr("y", -8).style("text-anchor", "middle").text("Destination Type");
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
        createGraph(dataForGraph1, dataForGraph2, 2);


        $(document).ready(function () {

            function pullDataForNetworkGraph() {
                var selectedObj = [];
                var selectedTypes = $('#MultiSelectRadio').val();
                for (var i = 0; i < selectedTypes.length; i++) {
                    var result = srcObjByType[selectedTypes[i]];
                    for (var j = 0; j < result.length; j++) {
                        selectedObj.push(result[j]);
                    }
                }

                var dataForNetworkGraph = generateNetworkGraph(NetworkFlowGraphBaseCase, selectedObj);
                d3v3.select("#chart3").select("svg").remove();
                drawNetworkGraph(dataForNetworkGraph);
            }
            var typeArray = [];
            for (var key in srcObjByType) {
                if (srcObjByType.hasOwnProperty(key)) {
                    typeArray.push(key);
                }
            }

            var htmlString;
            for (var i = 0; i < typeArray.length; i++) {
                htmlString += "<option value=\"" + typeArray[i] + "\">" + typeArray[i] + "</option>";
            }
            $("#MultiSelectRadio").html(htmlString);
            $("#MultiSelectRadio").val(typeArray[0]);
            $('#MultiSelectRadio').multiselect();

            pullDataForNetworkGraph();

            $('#MultiSelectRadio').on("change", function () {
                pullDataForNetworkGraph();
            });


        });
        function drawNetworkGraph(dataForNetworkGraph) {
            var links = dataForNetworkGraph;
            var nodes = {};
            links.forEach(function (link) {
                link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
                link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
            });

            var width = 660,
                height = 450;

            var force = d3v3.layout.force()
                .nodes(d3v3.values(nodes))
                .links(links)
                .size([width, height])
                .linkDistance(180)
                .charge(-25)
                .on("tick", tick)
                .start();

            var svg = d3v3.select("#chart3").append("svg")
                .attr("width", width)
                .attr("height", height);
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
                .attr("x", 15)
                .attr("y", ".100em")
                .text(function (d) { return d.name; });

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
        }
        function createBarGraph(barGraphData) {

            var data = barGraphData;
            var margin = { top: 20, right: 20, bottom: 30, left: 40 },
                width = 550 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);
            var svg = d3.select("#chart2").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
            x.domain(data.map(function (d) { return d.type; }));
            y.domain([0, d3.max(data, function (d) { return d.avgTraffic; })]);
            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) { return x(d.type); })
                .attr("width", x.bandwidth())
                .attr("y", function (d) { return y(d.avgTraffic); })
                .attr("height", function (d) { return height - y(d.avgTraffic); });
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));
            svg.append("g")
                .call(d3.axisLeft(y));

            svg.append("text")
                .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 10) + ")")
                .style("text-anchor", "middle", "bolder")
                .text(" SOURCE TYPE ");
        }
    }
    var setBpGraphLable = " Source Object " ;
    function url2() {
        $(df2).on({
            "stateFetchingSuccess": function (event, data) {

                data.result.data.forEach(function (dataEntry) {
                });
                var para1 = "srcObj";
                var para2 = "destObj";
                triggerGraphs(data, para1);
                jQuery("#action-1").click(function (e) {
                    d3.select("#chart").select("svg").remove();
                    d3v3.select("#chart2").select("svg").remove();
                    para1 = "srcObj";
                    para2 = "destObj";
                    setBpGraphLable = " Source Object "
                    triggerGraphs(data, para1);
                    e.preventDefault();
                });
                jQuery("#action-2").click(function (e) {
                    d3.select("#chart").select("svg").remove();
                    d3v3.select("#chart2").select("svg").remove();
                    para1 = "srcType";
                    para2 = "destObj";
                    setBpGraphLable = " Source Type "
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
    }
    url2();
    var radChoose = document.valueInputForm1.optradioChoose;
    var prev = null;
        for (var i = 0; i < radChoose.length; i++) {
            radChoose[i].onclick = function () {
                (prev) ? console.log(prev.value) : null;
                if (this !== prev) {
                    prev = this;
                }
                if(+this.value == 2){
                d3.select("#chart").select("svg").remove();
                d3.select("#chart2").select("svg").remove();
                d3v3.select("#chart3").select("svg").remove();
                df2 = urlCall("/traffic_status/frozen");
                url2();
                }
                else{
                d3.select("#chart").select("svg").remove();
                d3.select("#chart2").select("svg").remove();
                d3v3.select("#chart3").select("svg").remove();
                df2 = urlCall("/traffic_status");
                url2();
                }
            };
        }
              /*  $('#traffic_status_frozen').on("click", function () {
                df2 = urlCall("/traffic_status/frozen");
                url2();
            });*/

})();