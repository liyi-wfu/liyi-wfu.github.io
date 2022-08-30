var nselector = 4;

function updateLink()
{
    wt = $(window).scrollTop();
    wh = $(window).height();
    
    for(i=0; i<nselector; i++)
    {
        tt = $('.pagesection:nth(' + i.toString() + ')').offset().top - wh/2;
        if(tt>wt) break;
    }
    
    $('.sectionlink').removeClass('active');
    $('.sectionlink:nth(' + (i-1).toString() + ')').addClass('active');
}

$(function(){
    
    $(window).scroll(function(){ updateLink(); });
    updateLink();
    
    $('.label-keyword').mouseover(function(){
        
        $('#keyword').val($(this).text());

        $('.label-keyword').each(function(i, obj) {
            
            if($(obj).text().includes($('#keyword').val()))
                $(obj).addClass('label-highlight');
        });
    });
    
    $('.label-keyword').mouseout(function(){
        
        $('.label-keyword').removeClass('label-highlight');
    });
    
    $('#plotboxfull').click(function(){
        
        if($(this).html().indexOf("fullscreen") == -1)
        {
            $('#plotbox').removeClass('plotboxfs');
            $('#plotbox').addClass('col-xs-12');
            $(window).scrollTop($('.pagesection:nth(2)').offset().top);
            $('body').css("overflow","auto");
            $('#panel-view').css("height", "480px");
            
            $(this).html('<span class="glyphicon glyphicon-fullscreen"></span>');    
        }
        else
        {
            $('#plotbox').removeClass('col-xs-12');
            $('#plotbox').addClass('plotboxfs');
            $(window).scrollTop(0);
            $('body').css("overflow","hidden");
            $('#panel-view').css("height", "calc(100% - 100px)");
            $(this).html('<span class="glyphicon glyphicon-resize-small"></span>');
        }
        
        updateSeries();
    })
    
    
    // vol
    
    initTickerBox();
    initChart();
    newSeries();
    initShare();
    
    $('#daytable').DataTable({searching: false, paging: false, info: false, responsive: true});
        
})
