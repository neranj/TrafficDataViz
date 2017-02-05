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
                }).done(function(response) {
                    $(self).trigger("stateFetchingSuccess", {
                        result: response
                    });
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    $(self).trigger("stateFetchingFailure", {
                        error: textStatus
                    });
                }).always(function() {
                    if (self.repeat && _.isNumber(self.delay)) {
                        self.timer = setTimeout(getNext, self.delay);
                    }
                });
        }

        self.start = function(shouldRepeat) {
            self.repeat = shouldRepeat;
            getNext();
        };

        self.stop = function() {
            self.repeat = false;
            clearTimeout(self.timer);
        };

        self.repeatOnce = function() {
            getNext();
        };

        self.setDelay = function(newDelay) {
            this.delay = newDelay;
        };
    }

    function addNewEntry($container, contentHTML) {
        var $innerSpan = $("<p/>").text(contentHTML),
            $newEntry = $("<li/>").append($innerSpan);

        $container.append($newEntry);
    }

    var $trafficStatusList = $("#mockTrafficStat"),
        df2 = new DataFetcher(function() {
            return "/traffic_status/frozen";
            //return "/traffic_status";
            //codingArea
        });

    $(df2).on({
        "stateFetchingSuccess": function(event, data) {
           
            data.result.data.forEach(function(dataEntry) {
                // console.log("datacoming  "+dataEntry);
               // addNewEntry($trafficStatusList, JSON.stringify(dataEntry));
                // codingArea
});
                // start
             var   resul = data["result"];
             var inputData = resul["data"];
            // console.log("datacoming  "+JSON.stringify(inputData));
            var NetworkFlow = {};
            console.log("length of inputData "+ inputData.length)
            for(var i=0; i< inputData.length;i++){
               //  console.log(JSON.stringify(inputData[i]["destType"]));
               var flowDirection  = inputData[i]["srcObj"] + "," + inputData[i]["destObj"];
               // console.log(flowDirection);
               if(flowDirection in NetworkFlow){
                   console.log("duplicate exhists " + flowDirection);
               }
               NetworkFlow[flowDirection] = [ inputData[i]["traffic"],inputData[i]["packets"] ]
             //  console.log(NetworkFlow)
            }
           // console.log(JSON.stringify(NetworkFlow));
           // console.log("length of NetworkFlow "+Object.keys(NetworkFlow).length);
           var dataForBiParateChart = [];
        
        for (var key in NetworkFlow) {
        if (NetworkFlow.hasOwnProperty(key)) {
            //console.log(key + " -> " + NetworkFlow[key]);
            var NetworkFlowValues =  NetworkFlow[key]
       
           var TrafficValue = NetworkFlowValues[0];
           var PacketValue = NetworkFlowValues[1];
           var KeySplitArray = key.split(',');
           var sourceObject = KeySplitArray[0];
           var DestinationObject = KeySplitArray[1];
           //console.log(sourceObject + " and " + DestinationObject);
            dataForBiParateChart.push([sourceObject,DestinationObject,TrafficValue,PacketValue]);
        }
        }
       // console.log(JSON.stringify(dataForBiParateChart));
            
/*var data=[['Lite','CA',16,1],
['Small','CA',1278,1],
['Medium','CA',27,1],
['Plus','CA',58,1],
['Grand','CA',1551,1],
['Elite','CA',141,1],
['Lite','AZ',5453,111],
['Small','AZ',683,111],
['Medium','AZ',862,111],
['Grand','AZ',6228,111],
['Lite','AL',15001,1],
['Small','AL',527,1],
['Medium','AL',836,1],
['Plus','AL',28648,1],
['Grand','AL',3,1]

];*/
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}
var data = dataForBiParateChart;
//var color ={obj1:"#3366CC", obj2:"#DC3912",  obj2:"#FF9900", obj3:"#109618", obj5:"#990099", obj6:"#0099C6"};
var colorsForBiparate = {};
for(var i =0; i<data.length;i++){
    console.log(data[i][0]);
    var keyForColor = data[i][0];
    if( ! (keyForColor in colorsForBiparate)){
        //colorsForBiparate[keyForColor] = Colors.random()["rgb"];
        colorsForBiparate[keyForColor] = getRandomColor();
    }
}
console.log(JSON.stringify(colorsForBiparate))


var svg = d3.select("#chart").append("svg").attr("width", 960).attr("height", 800);
var g = svg.append("g").attr("transform","translate(200,50)");

var bp=viz.bP()
		.data(data)
		.min(12)
		.pad(1)
		.height(600)
		.width(500)
		.barSize(35)
		.fill(d=>colorsForBiparate[d.primary]);
        
			
g.call(bp);
g.append("text").attr("x",-50).attr("y",-8).style("text-anchor","middle").text("Source Object");
g.append("text").attr("x", 520).attr("y",-8).style("text-anchor","middle").text("Destination Object");
g.selectAll(".mainBars")
	.on("mouseover",mouseover)
	.on("mouseout",mouseout)

g.selectAll(".mainBars").append("text").attr("class","label")
	.attr("x",d=>(d.part=="primary"? -30: 30))
	.attr("y",d=>+6)
	.text(d=>d.key)
	.attr("text-anchor",d=>(d.part=="primary"? "end": "start"));
	
g.selectAll(".mainBars").append("text").attr("class","perc")
	.attr("x",d=>(d.part=="primary"? -100: 80))
	.attr("y",d=>+6)
	.text(function(d){ return d3.format("0.0%")(d.percent)})
	.attr("text-anchor",d=>(d.part=="primary"? "end": "start"));

function mouseover(d){
	bp.mouseover(d);
	g.selectAll(".mainBars")
	.select(".perc")
	.text(function(d){ return d3.format("0.0%")(d.percent)})
}
function mouseout(d){
	bp.mouseout(d);
	g.selectAll(".mainBars")
		.select(".perc")
	.text(function(d){ return d3.format("0.0%")(d.percent)})
}
d3.select(self.frameElement).style("height", "800px");
                // end 
                
            
        },
        "stateFetchingFailure": function(event, data) {
            addNewEntry($trafficStatusList, JSON.stringify(data.error));
            addNewEntry($trafficStatusList, "Hit a snag. Retry after 1 sec...");
            setTimeout(function() {
                $trafficStatusList.html("");
                df2.repeatOnce();
            }, 1000);
        }
    });

    df2.start();
})();