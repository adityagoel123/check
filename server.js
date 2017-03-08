var user_a  = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25', 
        'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25', 
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36' 
    ], 
	Pageres = require('pageres'),
	express = require('express'),
    app     = express(),
    server  = app.listen(8080),
    io      = require('socket.io').listen(server),
    request = require('request'),
    cheerio = require('cheerio'),
    uri     = require('uri-js'),
    im      = require('image-size'),
    res_mob = false,
    res_tab = false,
    res_dkp = false,
    count   = 0;

//Express server settings for static content delivery
app.use(express.static(__dirname));   

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/home.html');
});

//Socket.io start-up process
io.on('connection', function(socket){
    socket.on('message', function(uri){
    	res_mob = false;
	    res_tab = false;
	    res_dkp = false;
	    count   = 0;
        iterate(uri);
    });
});

//Process website url, save image and find its responsiveness
function snapshot(url, width, device, agent){  
	var path = device+'_'+width+'x'+320+'-'+new Date().getTime();
	var pageres = new Pageres({delay: 2})
    .src(url, [width+'x'+320], {filename: path, format: 'jpg', userAgent: agent})
    .dest(__dirname+'/static/images/');

	pageres.run(function (err) {
        if(err){
            console.log(err);
        }else{
	        count += 1;
	    	im(__dirname + '/static/images/'+path+'.jpeg', function (e, d) {
	  			if(e){
	  				console.log(e);
	  			}else{
	  				if(d.width>=width-50 && d.width<=width+50){
	  					status = 'success';
	  					if(device=='Mobile'){	                  
		                    res_mob = true;	                    
		                }else if(device=='Tablet'){	                    
		                    res_tab = true;	                    
		                }else if(device=='Desktop'){	                    
		                    res_dkp = true;	                    
		                }
	  				}else{
	  					status = 'danger';
	  				}
	                
	  				io.emit('responsiveness', device, status);
	  			}
	            if(count == 3){
	                if(res_mob && res_tab && res_dkp){
	                    var output = { 
	                        result: 'Responsive',                
	                    }; 
	                }else if(res_mob && (!res_tab || !res_dkp)){
	                    var output = { 
	                        result: 'Adaptive',                    
	                    }; 
	                }else{
	                    var output = { 
	                        result: "NotMobile",                         
	                    }; 
	                } 
	                console.log(output);       
	            }
			});
	        io.emit('image', path, false);
	    }
    });
}

//Helper function for image processor
function iterate(url){ 
    for (var i=0, h=user_a.length; i<h; i++){
        i==1 ? device='Tablet' : i==2 ? device='Desktop' : device='Mobile';
        i==1 ? width=800 : i==2 ? width=900 : width=320;

        snapshot(url, width, device, user_a[i]);
        io.emit('load', width, device);
    }
}

console.log('Open localhost with port 8080');