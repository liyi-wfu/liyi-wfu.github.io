
var chart;   // chart object
var ar = []; // Store all downloaded data
var msline = 0;
var msfocus = 0;

var tips = ['All Trades', '5-min Trades', '15-min Trades',
            'All Mid-Quotes', '5-min Mid-Quotes','15-min Mid-Quotes'];

var colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22','#34495e', 
              '#e73c4c','#34db98','#2e71cc','#9bb659','#e6227e','#345e49'];

var colors_used = [];
for(i=0; i<colors.length; i++) colors_used.push(false);

var color_id = 0;

function next_color()
{
    for(i=0; i<colors.length; i++) if(colors_used[i]==false)
    {
        colors_used[i] = true;
        return i;
    }
}

// Setup ticker-add box

function moveTickerBox()
{
    $('#symbol-list').css('right', '15px');
    $('#symbol-list').css('top', '40px');

    $('#future-list').css('right', '15px');
    $('#future-list').css('top', '40px');
    
    $('#future-pit-list').css('right', '15px');
    $('#future-pit-list').css('top', '40px');
}

function browserSymbol()
{
    $('#future').val('');
    sym = $('#ticker').val();
    if(sym == "") return;

    $.getJSON('symbol.php?s=' + sym, function(d){
        moveTickerBox();
        $('#symbol-list').fadeIn(250);
        code = '<div id="symbol-nres">Found ' + d.length.toString() + ' results</div>';

        for(i=0; i<d.length; i++)
            code += '<div data-perm="' + d[i][0] +'" class="symbol-one"><span class="symbol-sym">' 
                + d[i][1] + '</span> '
                + d[i][2] + ' (' + d[i][0] + ')</div>';

        $('#symbol-list').html(code);

        $('.symbol-one').click(function(){
            $('#ticker').val($(this).data('perm'));
            $('#symbol-list').fadeOut(240);
            newSeries();
        });
    });
}

var nft_show = 0;

function browserFuture()
{
    moveTickerBox();
    $('#future-list').fadeIn(250);
    
    $('#ticker').val('');
    root = $('#future').val();
    
    nft_show = 0;
    
    $('.future-item').each(function() {
        if($(this).data('root').startsWith($('#future').val().toUpperCase()))
        { $(this).css('display', 'block'); nft_show++; }
        else $(this).css('display', 'none');
    });
    
    w = $('.risklabtitle').width();
    if(nft_show < 20) w = '235';
    
    $('#future-list').css('width', w + 'px');
}


var nft2_show = 0;

function browserFuture2()
{
    moveTickerBox();
    $('#future-pit-list').fadeIn(250);
    
    $('#ticker').val('');
    root = $('#future-pit').val();
    
    nft2_show = 0;
    
    $('.future-pit-item').each(function() {
        if($(this).data('root').startsWith($('#future-pit').val().toUpperCase()))
        { $(this).css('display', 'block'); nft2_show++; }
        else $(this).css('display', 'none');
    });
    
    w = $('.risklabtitle').width();
    if(nft2_show < 20) w = '235';
    
    $('#future-pit-list').css('width', w + 'px');
}



function updateLines()
{
    flag1 = $('#sstrades').prop('checked');
    flag2 = $('#ssquotes').prop('checked');
    flag3 = $('#rv5m').prop('checked');
    flag4 = $('#rv15m').prop('checked');
    
    flags = [flag1, flag1 && flag3, flag1 && flag4, flag2, flag2 && flag3, flag2 && flag4]
    
    for(i=0;i<6;i++) 
        if(flags[i]) chart.series[i].show();
        else chart.series[i].hide();
    
    
    if($('#cishade').prop('checked')) chart.series[6].show();
    else chart.series[6].hide();
}

function initTickerBox()
{
    $('#ticker').focusout(function() { $('#symbol-list').fadeOut(240); });
    $('#ticker').focusin(function() { browserSymbol(); });
    $('#ticker').on('input', function(){ browserSymbol(); });
    
    $('#future').focusout(function() { $('#future-list').fadeOut(240); });
    $('#future').focusin(function() { browserFuture(); });
    $('#future').on('input', function(){ browserFuture(); });
    
    $('#future-pit').focusout(function() { $('#future-pit-list').fadeOut(240); });
    $('#future-pit').focusin(function() { browserFuture2(); });
    $('#future-pit').on('input', function(){ browserFuture2(); });
    
    moveTickerBox();
    $(window).resize(function() {moveTickerBox();});
    
    $('input[type=radio][name=msline]').change(function() { msline=parseInt($(this).val()); updateSeries(); });
    
    $('#sstrades').change(function(){ updateLines(); });
    $('#ssquotes').change(function(){ updateLines(); });
    $('#rv5m').change(function(){ updateLines(); });
    $('#rv15m').change(function(){ updateLines(); });
    $('#cishade').change(function(){ updateLines(); });
}

// ticker header

var html_delete_style_ext = "";

function addTicker(id, coname, ticker, permno, color)
{
    if(permno == ticker) 
    {
        if(ticker.endsWith('/P'))
        {
            ticker = ticker.replace('/P', '');
            permno = 'PIT-hrs';
        }
        else permno = "GLOBEX-hrs";
    }
    
    return '<div data-id="' + id.toString() 
        + '" class="stockone" style="border-color:' + color + ';color:' + color + '">'  
        + coname + ' <span class="label label-primary label-stock" style="background-color:' + color + ';">' 
        + ticker + '</span> <span class="label label-primary label-stock" style="background-color:' + color + ';">'
        + permno +'</span>  <span data-id="' 
        + id.toString() + '"title="Click to remove this ticker" class="label-delstock glyphicon glyphicon-remove-circle" style="color:' 
        + color + ';' + html_delete_style_ext + '"></span></div>';
}

// Change color and show/hide of series

var export_image = false;

function updateSeries()
{
    chart.destroy();
    initChart();
    
    if(msfocus==-1)
    {
        maxi = 0;
        maxc = ar[0].data[0].length;
        for(i=1; i<ar.length; i++) if(ar[i].data[0].length > maxc) { maxi = i; maxc = ar[i].data[0].length; }
        if(maxi != 0) { tmp = ar[0]; ar[0] = ar[maxi]; ar[maxi] = tmp; }

        for(i=0; i<ar.length; i++)
        {
            stock = ar[i];
            data = stock.data;
            chart.addSeries({name: stock.ticker + "-" + msline.toString(), dashStyle: 'Solid', color: ar[i].color, data: data[msline]});
        }
        
        
        lss = '';
        
        for(i=0; i<ar.length; i++)
            lss += addTicker(i, ar[i].coname, ar[i].ticker, ar[i].permno, ar[i].color);
        
        $('#stocklist').html(lss);
        
        $('.stockone').click(function(){
            msfocus = parseInt($(this).data('id'));
            updateSeries();
        });
        
        $('#method-ss').hide();
        $('#method-ms').show();
    }
    else if (msfocus<ar.length)
    {
        
        stock = ar[msfocus];
        data = stock.data;

        dstyle = ["Solid", "ShortDash", "ShortDot"];
        
        for(i=0; i<6; i++) chart.addSeries({name: stock.ticker + "-" + i.toString(), dashStyle: dstyle[i%3], 
                                            color:colors[Math.floor(i/3)], data: data[i]});
        
        chart.addSeries({name: "CI", data: stock.ci, type: 'arearange', lineWidth: 0, color: "#F90", fillOpacity: 0.25, zIndex: 0});
        
        lss = addTicker(msfocus, stock.coname, stock.ticker, stock.permno, '#333');
        
        if(ar.length>1) lss += '<button id="showall" class="btn btn-danger btn-sm" style="float:left;margin-top:3px;margin-left:5px">Show All</button>';
        
        $('#stocklist').html(lss);
        
        $('#method-ss').show();
        $('#method-ms').hide();
        
        $('#sstrades').prop( "checked", true );
        $('#ssquotes').prop( "checked", false );
        $('#rv5m').prop( "checked", false );
        $('#rv15m').prop( "checked", false );
        $('#cishade').prop( "checked", true );
        
        updateLines();
        
        $('#showall').click(function(){
            msfocus = -1;
            updateSeries();
        });
    }
    else  $('#stocklist').html('');
    
    $('.label-delstock').click(function() {
        $('#busy-shade').fadeIn(100);
        
        index = parseInt($(this).data('id'));
        colors_used[ar[index].color_id] = false;
        ar.splice(index,1);
        if(ar.length<=msfocus) msfocus = ar.length - 1;
        if(ar.length<=1) msfocus = 0;
        updateSeries();
        $('#busy-shade').fadeOut(500);
        return false;
    });
    
    if(export_image) 
    { 
        $('#method-ss').hide();
        $('#method-ms').hide();
    }
    
    show_quotes = true;
    for(i=0; i<ar.length; i++) if(ar[i].permno == ar[i].ticker) { show_quotes = false; break; }

    if(show_quotes) { $('#ssquotes-d').show(); $('#msq1').show(); $('#msq2').show(); $('#msq3').show(); }
    else {$('#ssquotes-d').hide(); $('#msq1').hide(); $('#msq2').hide(); $('#msq3').hide(); }
}

function queryData(pn, ft)
{
    $('#busy-shade').fadeIn(100);
    
    if(ft>0) ft_flag = "&ft=" + ft.toString();
    else ft_flag = "";

    if(typeof pn == "undefined") { 
      defs = $('#default-instrument').val().split(':');
      pn = defs[1];
      ft = (defs[0]=='Future'?1:0);
      ft_flag = (ft>0?"&ft=1":""); 
    }
    
    $.get('data.php?ticker=' + pn + ft_flag, function(data) {
        
        line = data.split("\n");
        if(line.length<10)
        {
            alert('Not Available at this Moment. ' + pn + ft_flag + "\n" + data);
            return;   
        }
        
        newdata = [[],[],[],[],[],[]];
        newtips = [[],[],[],[],[],[]];
        newci = [];
        
        methods = ['All Trades', '5-Min Trades', '15-Min Trades', 'All Quotes', '5-Min Quotes', '15-Min Quotes'];
        
        if(ft) index = [2,5,6,7,10,11];
        else index = [2,5,6,7,10,11]
        
        for(i=0; i<6; i++) for(j=0; j<20000; j++) { newtips[i].push(''); }
        
        for(i=6; i<line.length; i++)
        {
            w = line[i].split(' ');
            if(w.length<12) continue;
            
            yy = w[1].substr(0,4);
            mm = w[1].substr(4,2);
            dd = w[1].substr(6,2);
            
            utc = Date.UTC(parseInt(yy), parseInt(mm)-1, parseInt(dd));
			ndx = utc/86400000;
            
            //if(line[0] == line[1]) nnn = 3; else nnn = 6;
            nnn = 6;
            
            for(j=0; j<nnn; j++)
            {
                // remove mid-quotes results of future before 2007
                if(ft && j>=3)
                {
                    if(parseInt(w[1])<20070000) continue;
                    //continue;
                }
                
                vol = parseFloat(w[index[j]]);

                //if(j!=0 && j!=3) ; // do nothing for RV
                //else if(ft==false) vol = Math.sqrt(vol); // sqrt for QMLE

                if(vol<1.0E-6) continue;
                if(vol>3.0) vol = 3.0;
                
                newdata[j].push([utc, vol]);
                tipone = '';
                
                if(ft) tipone += w[0].substring(line[0].length) + ' | ';
                                
                if(vol==3.0) tipone += '&gt; ';
                tipone += Math.round(vol * 10000)/100 + '%'

                if(j==0 || j==3)
                {
                    ciw = parseFloat(w[index[j]+2]);
					//if(ft) ciw = w[4];
                    //else ciw = (parseFloat(w[5]) - parseFloat(w[4])) * 0.25 / vol;

                    if(j==0) newci.push([utc, vol-ciw, vol+ciw]);
                    tipone += '±' + (ciw*100).toFixed(1) + '%';
                    
                    ma = w[index[j]+1];
                    if(ma == '0') tipone += ' i.i.d.';
                    else tipone += ' MA(' + ma + ')';
                }
                
                newtips[j][ndx] = tipone + ' | ' + methods[j];
            }
        }
		        
        color_id = next_color();
        color = colors[color_id];
        
        ar.push({
            ticker: line[0],
            permno: line[1],
            coname: line[2],
            nvalue: parseInt(line[3]),
            minday: parseInt(line[4]),
            maxday: parseInt(line[5]),
            data: newdata,
            ci: newci,
            tips: newtips,
            color: color,
            color_id: color_id
        });
		
        if(ar.length>1) msfocus=-1; else msfocus=0;
        
        updateSeries();
        $('#busy-shade').fadeOut(500);
    });
}

// Create a series to the chart from the permno in the input box.
// Search existed/loaded data first.
// If the stock has alreay be downloaded, just draw it.
// If not, call queryData() to download and draw it.

function newSeries()
{ 
    pn = $('#ticker').val();
    ft = 0;
    
    if(pn=="")
    {
        pn = $('#future').val();
        ft = 1;
    }
    
    if(pn=="")
    {
        pn = $('#future-pit').val();
        ft = 2;
    }
    
    if(pn=="") 
    {
        if(ar.length>0) { alert("Please input symbol or perm number!"); return; }
        else { pn = 'ES'; ft = 1; }
    }
    
    for(i=0; i<ar.length; i++) if(ar[i].permno == pn)
    {
        drawSeries(i);
        return;
    }
    
    queryData(pn, ft);
    $('#ticker').val('');
    $('#future').val('');
    $('#future-pit').val('');
}

// Define basic chart properties and initialize it.
// Chart won't show up until a series is added.
// Called after page is loaded or before redraw.

var opt_rangeselector = {
    buttons: [
                { type: 'month', count: 1, text: '1m'},
                { type: 'month', count: 3, text: '3m'},
                { type: 'month', count: 6, text: '6m'},
                { type: 'year', count: 1, text: '1y'},
                { type: 'year', count: 5, text: '5y'},
                { type: 'all', text: 'All'}
            ],
            
    selected: 4
};

var opt_xaxis = {};
var opt_navigator = { enabled: true };
var opt_scrollbar = { enabled: true };

function initChart()
{
    chart = new Highcharts.StockChart('panel-view', {
        
        credits: { enabled: false },
        exporting: { enabled: false },
        
        rangeSelector: opt_rangeselector,
        xAxis: opt_xaxis,
        navigator: opt_navigator,
        scrollbar: opt_scrollbar,
        
        chart: {
            events: {
                redraw: function () {
                    if(chart.yAxis[0].getExtremes().max>1.999) $('#ymax').show();
                    else $('#ymax').hide();
                }
            }
        },
        
        yAxis: {
            min: 0,
            //ceiling: 3,  This line caused issues from 05/01/2022, looks like from an update of the vendor's library.
            
            plotLines: [{value: 0, width: 2, color: 'silver'}],
            
            labels: {
                align: 'left',
                style: { color: "#66C", fontSize:'14px'},
                y: 6,
	        formatter: function() { val = this.value * 100; ss = val.toFixed(0) + "%"; if(val<10) ss = '0' + ss; return ss; }
            }
        },
		
        tooltip: {
            pointFormatter: function() { 
                
                w = this.series.name.split('-');
                if(w.length<2) return '';
                
                for(i=0; i<ar.length; i++) if(ar[i].ticker == w[0]) { id = i; break; }
                it = parseInt(w[1]);
                ii = Math.round(this.x/86400000); 
                
                while(ar[id].tips[it][ii]=="" && ii>=0) ii--;
                
                // value = (this.y*100).toFixed(1)
                // if(Math.abs(this.y - 3.0)<0.001) value = '&gt;' + value;
                
                if(msfocus==-1)
                {
                    return '<span style="color:' + this.series.color + '">' + w[0] + ' | '
                        + ar[id].tips[it][ii] + '</span><br />';
                }
                else 
                    return '<span style="color:' + this.series.color + '">' 
                        + ar[id].tips[it][ii] + '</span><br />';
                
            },
            
            style: { lineHeight: '20px', fontWeight: 'bold' }
        },
		
		plotOptions: {
			line: { 
				dataGrouping: { approximation: 'high', smoothed: true }
			}
		}
        
    }, function(){});
}

/*
function sharefacebook(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/zh_CN/sdk.js#xfbml=1&version=v2.10";
  fjs.parentNode.insertBefore(js, fjs);
}
*/

var shareURL = "";

function finishShare()
{
    $("#share-body").text("The shared picture is ready.");
    $("#share-link").attr("href", shareURL);
    $("#share-foot").show();
}

function getShareURL()
{
    url_root = 'http://dachxiu.chicagobooth.edu/share_vol.php'
        
    pnlist = [];
    ticker = [];

    for(i=0; i<ar.length; i++) 
    {
        pnlist.push(ar[i].permno);
        ticker.push(ar[i].ticker);
    }
    url_pn = "?pn=" + pnlist.join('-') + "&ticker=" + ticker.join('-');

    dates = chart.xAxis[0].getExtremes();
    t1 = Math.round(dates.min).toString();
    t2 = Math.round(dates.max).toString();
    url_date = "&t1=" + t1 + "&t2=" + t2;

    url = url_root + url_pn + url_date;
    
    return url;
}

function initShare()
{
    $("#share-link").click(function(){
        $("#share-foot").hide();
        $("#share-modal").modal("hide");
    });
    
    $('#share-fb').click(function(){
        
        $("#share-body").text("Preparing the shared image. Please wait ...");
        $("#share-modal").modal({backdrop:"static"});
        
        url = getShareURL()
        shareURL = "http://www.facebook.com/sharer.php?u=" + encodeURIComponent(url);
        
        $.post('share_image.php',
            {
                name: pnlist.join('-') + '_' + t1 + "_" + t2,
                content: chart.getSVG()    
            },
            
            function() { setTimeout(function() {finishShare();}, 3000) }
        );
        
        return false;
    })
    
    $('#share-li').click(function(){
        
        $("#share-body").text("Preparing the shared image. Please wait ...");
        $("#share-modal").modal({backdrop:"static"});
                
        url = getShareURL();
        shareURL = "https://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(url);
        
        $.post('share_image.php',
            {
                name: pnlist.join('-') + '_' + t1 + "_" + t2,
                content: chart.getSVG()    
            },
            
            function() { setTimeout(function() {finishShare();}, 1000) }
        );
        
        return false;
    })
    
    $('#share-tw').click(function(){
        
        $("#share-body").text("Preparing the shared image. Please wait ...");
        $("#share-modal").modal({backdrop:"static"});
                
        url = getShareURL();
        shareURL = "http://twitter.com/share?url=" + encodeURIComponent(url);
        
        $.post('share_image.php',
            {
                name: pnlist.join('-') + '_' + t1 + "_" + t2,
                content: chart.getSVG()    
            },
            
            function() { setTimeout(function() {finishShare();}, 1000) }
        );
        
        return false;
    })
}

function download()
{
    csv = "Symbol,PN,Type,Date,Volatility\n";
    types = ["QMLE-Trade", "5Min-Trade","15Min-Trade","QMLE-Quote", "5Min-Quote","15Min-Quote"];
    
    for(i=0; i<ar.length; i++)
    {
        if(ar[i].permno == ar[i].ticker)
        {
            ncol = 3;
            head0 = ar[i].ticker + ",N/A"
        }
        else
        {
            ncol = 6;
            head0 = ar[i].ticker + "," + ar[i].permno
        }
        
        for(j=0; j<ncol; j+=3)
        {
            data = ar[i].data[j];
            head1 = head0 + "," + types[j];
            
            for(k=0; k<data.length; k++)
            {
                utc = data[k][0];
                day = (new Date(utc).getUTCFullYear()) + "-" + (new Date(utc).getUTCMonth() + 1) +
                                                 "-" + (new Date(utc).getUTCDate());
                
                row = head1 + "," + day + "," + data[k][1] + "\n";
                csv += row;
            }
        } 
    }
    
    var blob = new Blob([csv], {type: 'text/csv'});
    $("#download-link").attr('href', window.URL.createObjectURL(blob));
    $("#download-modal").modal(); 
}


$(function(){
    $('.future-item').click(function() {
        $('#future').val($(this).data('root'));
        $('#symbol-list').fadeOut(250);
        newSeries();
    });
    
    $('.future-pit-item').click(function() {
        $('#future-pit').val($(this).data('root'));
        $('#symbol-pit-list').fadeOut(250);
        newSeries();
    });
});
